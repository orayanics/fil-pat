import { WebSocketServer, WebSocket } from "ws";
import * as os from "os";
import { prisma } from "./src/lib/database/client";
import { logActivity } from "./src/lib/auth/auth";

const port = process.env.WEBSOCKET_PORT ? parseInt(process.env.WEBSOCKET_PORT, 10) : 8080;
// Bind to 0.0.0.0 by default so external devices on the LAN can connect
const host = process.env.WEBSOCKET_HOST || "0.0.0.0";
// (BASE_URL not needed here — QR generation happens client-side or via sendQrData)

const wss = new WebSocketServer({ port, host });

// Detect server machine LAN IP at startup as a fallback for QR generation
function getServerLocalIp(): string | null {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const list = interfaces[name] || [];
      for (const iface of list) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (err) {
    console.warn('Failed to detect server local IP:', err);
  }
  return null;
}

const SERVER_LOCAL_IP = getServerLocalIp();

// Enhanced room management with database tracking
const rooms: Record<string, Set<WebSocket>> = {};
const roomCurrentItems: Record<string, SessionItemData> = {};
// Keep a full ordered list of session items for each room (populated when a template is assigned)
const roomItemsList: Record<string, Array<Record<string, unknown>>> = {};
// Track assigned patient per room (to enforce 1:1)
const roomPatient: Record<string, WebSocket | null> = {};
const connectionMap: Map<WebSocket, { 
  connectionId: string;
  userId?: number;
  userType: string;
  sessionId?: string;
  roomId?: string;
  ipAddress?: string;
  last_activity?: Date; 
}> = new Map();

// =============================================
// DATABASE HELPERS
// =============================================

interface WebSocketConnectionData {
  sessionId?: string;
  userId?: number;
  userType?: string;
  ipAddress?: string;
  userAgent?: string;
  roomId?: string;
  role?: string;
}

async function createWebSocketConnection(ws: WebSocket, data: WebSocketConnectionData) {
  try {
    const connectionId = Math.random().toString(36).substring(2, 15);

    const connection = await prisma.webSocketConnection.create({
      data: {
        connection_uuid: connectionId,
        session_id: data.sessionId ? parseInt(data.sessionId) : null,
        user_id: data.userId ?? null,
        user_type: data.userType ?? "clinician",
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        room_id: data.roomId,
        role_in_session: data.role ?? "participant",
      },
    });

    connectionMap.set(ws, {
      connectionId,
      userId: data.userId,
      userType: data.userType ?? "clinician",
      sessionId: data.sessionId,
      roomId: data.roomId,
      ipAddress: data.ipAddress,
    });

    await logActivity({
      user_id: data.userId,
      action: "websocket_connect",
      description: `WebSocket connection established for ${data.userType ?? "clinician"}`,
      session_uuid: connectionId,
      ip_address: data.ipAddress,
    });

    return connection;
  } catch (error) {
    console.error("Failed to create WebSocket connection record:", error);
  }
}


interface WebSocketConnectionUpdates {
  session_id?: number | null;
  user_id?: number | null;
  user_type?: string;
  ip_address?: string;
  user_agent?: string;
  room_id?: string;
  role_in_session?: string;
  last_activity?: Date;
}

async function updateWebSocketConnection(ws: WebSocket, updates: WebSocketConnectionUpdates) {
  try {
    const connectionData = connectionMap.get(ws);
    if (!connectionData) return;

    await prisma.webSocketConnection.update({
      where: { connection_uuid: connectionData.connectionId },
      data: {
        ...updates,
        last_activity: new Date(), // always update this field
      },
    });

    // Merge the updates into the in-memory map
    connectionMap.set(ws, {
      ...connectionData,
      ...updates,
      last_activity: new Date(),
    });
  } catch (error) {
    console.error("Failed to update WebSocket connection:", error);
  }
}


async function removeWebSocketConnection(ws: WebSocket) {
  try {
    const connectionData = connectionMap.get(ws);
    if (!connectionData) return;

    await prisma.webSocketConnection.update({
      where: { connection_uuid: connectionData.connectionId },
      data: {
        connection_status: 'disconnected',
        disconnected_at: new Date()
      }
    });

    await logActivity({
      user_id: connectionData.userId,
      action: 'websocket_disconnect',
      description: `WebSocket connection closed for ${connectionData.userType}`,
      session_uuid: connectionData.connectionId,
      ip_address: connectionData.ipAddress
    });

    connectionMap.delete(ws);
  } catch (error) {
    console.error('Failed to remove WebSocket connection record:', error);
  }
}

interface AssessmentSessionInput {
  sessionId: string;
  roomId?: string;
  clinicianId?: number;
  patientId?: number;
  isKidsMode?: boolean;
}

async function createOrUpdateAssessmentSession(data: AssessmentSessionInput) {
  try {
    // Check if session already exists
    let session = await prisma.assessmentSession.findUnique({
      where: { session_uuid: data.sessionId },
    });

    if (!session) {
      // Ensure we have both clinicianId and patientId before creating a session to avoid FK violations
      if (!data.clinicianId || !data.patientId) {
        console.warn("Skipping session creation: missing clinicianId or patientId", { sessionId: data.sessionId, provided: data });
        return null;
      }

      // Get default template
      const template = await prisma.assessmentTemplate.findFirst({
        where: { is_default: true },
        include: { session_items: true },
      });

      if (!template) {
        throw new Error("No default template found");
      }

      // Create session with explicit IDs only (no magic fallbacks)
      session = await prisma.assessmentSession.create({
        data: {
          session_uuid: data.sessionId,
          // Prisma expects undefined for absent optional relations rather than null
          patient_id: data.patientId ?? undefined,
          clinician_id: data.clinicianId,
          template_id: template.template_id,
          session_name: `Session ${data.sessionId}`,
          session_date: new Date(),
          session_mode: data.isKidsMode ? "Kids" : "Standard",
          status: "Scheduled",
          total_items: template.session_items.length,
          websocket_room_id: data.roomId,
        },
      });

      await logActivity({
        user_id: data.clinicianId,
        action: "create_session",
        entity_type: "assessment_session",
        entity_id: session.session_id,
        description: `Created new assessment session: ${session.session_uuid}`,
        new_values: {
          session_uuid: session.session_uuid,
          template_id: template.template_id,
        },
      });
    }

    return session;
  } catch (error) {
    console.error("Failed to create/update assessment session:", error);
    return null;
  }
}


interface SessionItemData {
  item: number;
  question?: string;
  [key: string]: unknown;
}


async function updateSessionProgress(sessionId: string, itemData: SessionItemData): Promise<void> {
  try {
    const session = await prisma.assessmentSession.findUnique({
      where: { session_uuid: sessionId },
    });

    if (!session) {
      console.warn(`Session not found for UUID: ${sessionId}`);
      return;
    }

    await prisma.assessmentSession.update({
      where: { session_uuid: sessionId },
      data: {
        current_item_id: itemData.item,
        completed_items: itemData.item > 0 ? itemData.item - 1 : 0, // ✅ Prevent negatives
        status: "In Progress",
      },
    });

    await logActivity({
      user_id: session.clinician_id,
      action: "update_session_progress",
      entity_type: "assessment_session",
      entity_id: session.session_id,
      description: `Session progress updated to item ${itemData.item}`,
      new_values: { current_item: itemData.item },
    });
  } catch (error) {
    console.error("Failed to update session progress:", error);
  }
}


interface SessionItemData {
  item: number;
  max_score?: number;
}

interface ResponseData {
  response?: string;
  audioPath?: string;
  isCorrect?: boolean;
  score?: number;
  timeTaken?: number;
  notes?: string;
}

async function saveSessionResponse(
  sessionId: string,
  itemData: SessionItemData,
  responseData: ResponseData
): Promise<void> {
  try {
    const session = await prisma.assessmentSession.findUnique({
      where: { session_uuid: sessionId },
    });

    if (!session) {
      console.warn(`Session not found for UUID: ${sessionId}`);
      return;
    }
    // Make response saving idempotent: update existing response for the same
    // session_id + session_item_id if present, otherwise create one.
    // Using findFirst() because there may not be a unique constraint in the
    // schema for (session_id, session_item_id).
    const existing = await prisma.sessionResponse.findFirst({
      where: {
        session_id: session.session_id,
        session_item_id: itemData.item,
      },
    });

    if (existing) {
      await prisma.sessionResponse.update({
        where: { response_id: existing.response_id },
        data: {
          response_text: responseData.response ?? null,
          response_audio_path: responseData.audioPath ?? null,
          is_correct: responseData.isCorrect ?? null,
          score: responseData.score ?? null,
          max_possible_score: itemData.max_score ?? 1.0,
          time_taken_seconds: responseData.timeTaken ?? null,
          clinician_notes: responseData.notes ?? null,
        },
      });

      await logActivity({
        user_id: session.clinician_id,
        action: "update_response",
        entity_type: "session_response",
        entity_id: session.session_id,
        description: `Updated response for item ${itemData.item}`,
        new_values: {
          item_id: itemData.item,
          score: responseData.score ?? null,
        },
      });
    } else {
      await prisma.sessionResponse.create({
        data: {
          session_id: session.session_id,
          session_item_id: itemData.item,
          response_text: responseData.response ?? null,
          response_audio_path: responseData.audioPath ?? null,
          is_correct: responseData.isCorrect ?? null,
          score: responseData.score ?? null,
          max_possible_score: itemData.max_score ?? 1.0,
          time_taken_seconds: responseData.timeTaken ?? null,
          clinician_notes: responseData.notes ?? null,
        },
      });

      await logActivity({
        user_id: session.clinician_id,
        action: "save_response",
        entity_type: "session_response",
        entity_id: session.session_id,
        description: `Response saved for item ${itemData.item}`,
        new_values: {
          item_id: itemData.item,
          score: responseData.score ?? null,
        },
      });
    }
  } catch (error) {
    console.error("Failed to save session response:", error);
  }
}


// =============================================
// ENHANCED BROADCASTING FUNCTIONS
// =============================================

const broadcastToRoom = (roomId: string, message: string, excludeWs?: WebSocket) => {
  const clients = rooms[roomId];
  if (clients) {
    clients.forEach(async (client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(message);
        
        // Update last activity for this connection
        await updateWebSocketConnection(client, {
          last_activity: new Date()
        });
      }
    });
  }
};

const broadcastQrData = async (qrData: string, sessionId: string, clinicianId?: number) => {
  const message = JSON.stringify({
    type: "sendQrData",
    qrData,
    sessionId,
    timestamp: new Date().toISOString()
  });

  // Broadcast to all connected clients
  wss.clients.forEach(async (client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });

  // Log QR code generation
  await logActivity({
    user_id: clinicianId,
    action: 'generate_qr_code',
    entity_type: 'assessment_session',
    description: `QR code generated for session: ${sessionId}`
  });
};

interface AssessmentItem {
  item: number;
  question?: string;
  max_score?: number;
  [key: string]: unknown; // Allows extra optional fields
}

async function broadcastAssessmentItemChange(
  item: AssessmentItem,
  sessionId: string
): Promise<void> {
  // Update the in-memory room state
  roomCurrentItems[sessionId] = item;

  const message = JSON.stringify({
    type: "changeAssessmentItem",
    item,
    sessionId,
    timestamp: new Date().toISOString(),
  });

  // Broadcast to all clients in the same session room
  broadcastToRoom(sessionId, message);

  // Persist progress in the database
  await updateSessionProgress(sessionId, item);
}


// =============================================
// ENHANCED ROOM MANAGEMENT
// =============================================

interface UserData {
  clinicianId?: number;
  patientId?: number;
  isKidsMode?: boolean;
  role?: string;
}

const joinRoom = async (ws: WebSocket, roomId: string, userData?: UserData) => {
  const isNewRoom = !rooms[roomId];

  if (isNewRoom) {
    rooms[roomId] = new Set<WebSocket>();
    
    // Initialize with first item from database
    try {
      const template = await prisma.assessmentTemplate.findFirst({
        where: { is_default: true },
        include: { 
          session_items: {
            where: { is_active: true },
            orderBy: { display_order: 'asc' }
          }
        }
      });
      
      if (template && template.session_items.length > 0) {
        const firstItem = template.session_items[0];
        roomCurrentItems[roomId] = {
          ...firstItem, // keep all extra data first
          item: firstItem.item_number || firstItem.item_id,
          question: firstItem.question // override after spread
        };
      }
    } catch (error) {
      console.error('Failed to load default session items:', error);
      // Fallback to hardcoded data if database fails
      roomCurrentItems[roomId] = { item: 1, question: "Starting session..." };
    }

    // Create session record
    // Only create/update session if we have a clinicianId (avoid FK violations when patients join before clinicians)
    if (userData?.clinicianId) {
      await createOrUpdateAssessmentSession({
        sessionId: roomId,
        roomId: roomId,
        clinicianId: userData?.clinicianId,
        patientId: userData?.patientId,
        isKidsMode: userData?.isKidsMode || false
      });
    } else {
      // Defer session creation until clinician creates it explicitly
      console.log(`Deferring DB session creation for room ${roomId} until a clinician creates the session`);
    }
  }
  // Enforce 1:1 patient binding: if this join is a patient and a patient already exists, reject
  const role = userData?.role ?? 'participant';

  if (role === 'patient') {
    if (roomPatient[roomId]) {
      // Notify the joining patient they cannot join
      try {
        ws.send(JSON.stringify({ type: 'patientRejected', message: 'A patient is already connected to this session.' }));
      } catch {}
      return;
    }
    // Assign this ws as the patient for the room
    roomPatient[roomId] = ws;
  }

  rooms[roomId].add(ws);
  
  // Update connection record
  await updateWebSocketConnection(ws, {
    room_id: roomId,
    role_in_session: userData?.role || 'participant'
  });

  // Broadcast updated participant count to the room (clinician + patient)
  try {
    broadcastToRoom(roomId, JSON.stringify({ type: 'participantCount', count: rooms[roomId].size }));
  } catch {}

  console.log(`Client joined room: ${roomId}, total clients: ${rooms[roomId].size}`);

  // If the room now has both a clinician and at least one other client (patient),
  // ensure there is an assessmentSession record in the DB. This covers the case
  // where the patient scans the QR before the clinician explicitly created the session.
  try {
    // Check if a session already exists
    const existingSession = await prisma.assessmentSession.findUnique({ where: { session_uuid: roomId } });
    if (!existingSession) {
      // Find a clinician in the room
      let clinicianIdInRoom: number | null = null;
      rooms[roomId].forEach((client) => {
        const conn = connectionMap.get(client as WebSocket);
        if (conn && conn.userType === 'clinician' && conn.userId) {
          clinicianIdInRoom = conn.userId;
        }
      });

      // If there's a clinician and more than one participant, create a session and temp patient
      if (clinicianIdInRoom && rooms[roomId].size >= 2) {
        // Create a temporary patient to attach to the session
        const tempPatient = await prisma.patient.create({
          data: {
            first_name: 'Unregistered',
            last_name: 'Patient',
            date_of_birth: new Date(2000, 0, 1),
            is_active: false,
            notes: `Temporary patient for session ${roomId}`,
            assigned_clinician_id: clinicianIdInRoom
          }
        });

        const template = await prisma.assessmentTemplate.findFirst({ where: { is_default: true }, include: { session_items: true } });
        if (!template) {
          console.warn(`Auto-create session: no default template found for room ${roomId}, skipping auto-creation.`);
          return;
        }
        const templateId = template.template_id;

        const clinicianIpFromConn = (() => {
          // try to get any clinician connection IP
          let found: string | null = null;
          Array.from(rooms[roomId]).forEach((client) => {
            const c = connectionMap.get(client as WebSocket);
            if (!found && c && c.userType === 'clinician' && c.ipAddress) found = c.ipAddress;
          });
          return found;
        })();

        const newSession = await prisma.assessmentSession.create({
          data: {
            session_uuid: roomId,
            clinician_id: clinicianIdInRoom,
            patient_id: tempPatient.patient_id,
            // Prisma expects a number for template_id; set to null if not found
            template_id: templateId ?? undefined,
            clinician_ip: clinicianIpFromConn ?? null,
            session_date: new Date(),
            status: 'Scheduled',
            session_mode: 'Standard',
            is_practice_session: false
          }
        });

        // Notify room participants that a session record now exists
        const msg = JSON.stringify({ type: 'sessionCreated', sessionId: newSession.session_uuid, sessionInfo: { ...newSession, clinician_ip: clinicianIpFromConn ?? null }, tempPatientId: tempPatient.patient_id });
        broadcastToRoom(roomId, msg);

        await logActivity({
          user_id: clinicianIdInRoom,
          action: 'create_assessment_session_auto',
          entity_type: 'assessment_session',
          entity_id: newSession.session_id,
          description: `Auto-created assessment session for room ${roomId}`,
          new_values: { session_uuid: newSession.session_uuid }
        });
      }
    }
  } catch (err) {
    console.error('Failed to auto-create session on join:', err);
  }

  // If a clinician just joined and a patient is already assigned to this room, notify the clinician
  const roleJustJoined = userData?.role ?? 'participant';
  if (roleJustJoined === 'clinician') {
    const assignedPatientWs = roomPatient[roomId];
    if (assignedPatientWs) {
      const conn = connectionMap.get(assignedPatientWs as WebSocket);
      const ip = conn?.ipAddress ?? null;
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'patientConnected', sessionId: roomId, patientIp: ip }));
        }
      } catch {
        // ignore send errors
      }
    }
  }

  // If a patient joined, update session with patient_ip and notify clinician(s)
  if (role === 'patient') {
    const conn = connectionMap.get(ws);
    const ip = conn?.ipAddress ?? null;
    try {
      await prisma.assessmentSession.updateMany({
        where: { session_uuid: roomId },
        data: { patient_ip: ip }
      });
    } catch (err) {
      console.error('Failed to update session patient_ip:', err);
    }

    // Notify clinicians in the room that a patient has connected
    const infoMsg = JSON.stringify({ type: 'patientConnected', sessionId: roomId, patientIp: ip });
    broadcastToRoom(roomId, infoMsg, ws);
  }
};



const leaveRoom = async (ws: WebSocket, roomId: string) => {
  const clients = rooms[roomId];
  if (clients) {
    clients.delete(ws);
    // If this ws was the assigned patient, clear assignment
    if (roomPatient[roomId] === ws) {
      roomPatient[roomId] = null;
      // notify clinicians that patient left
      broadcastToRoom(roomId, JSON.stringify({ type: 'patientLeft', sessionId: roomId }));
    }
    console.log(`Client left room: ${roomId}`);
    
    if (clients.size === 0) {
      delete rooms[roomId];
      delete roomCurrentItems[roomId];
      delete roomPatient[roomId];
      console.log(`Room ${roomId} has been deleted due to no clients.`);
      
      // Mark session as completed if it was in progress
      try {
        await prisma.assessmentSession.updateMany({
          where: { 
            session_uuid: roomId,
            status: 'In Progress'
          },
          data: {
            status: 'Completed',
            end_time: new Date()
          }
        });
      } catch (error) {
        console.error('Failed to update session status on room cleanup:', error);
      }
    }
    else {
      // Broadcast updated participant count after someone leaves
      try {
        broadcastToRoom(roomId, JSON.stringify({ type: 'participantCount', count: clients.size }));
      } catch {}
    }
  }
};

// =============================================
// WEBSOCKET CONNECTION HANDLING
// =============================================

wss.on("connection", async (ws, request) => {
  // Normalize IPv6 mapped IPv4 addresses like '::ffff:192.168.0.5'
  let clientIP = request.socket.remoteAddress as string | undefined;
  if (clientIP && clientIP.startsWith("::ffff:")) {
    clientIP = clientIP.replace("::ffff:", "");
  }
  const userAgent = request.headers['user-agent'];
  
  console.log(`New WebSocket connection from ${clientIP}`);

  // Create connection record
  await createWebSocketConnection(ws, {
    ipAddress: clientIP,
    userAgent: userAgent,
    userType: 'unknown' // Will be updated when user identifies themselves
  });

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message.toString());
      const connectionData = connectionMap.get(ws);

      // Update connection activity
      await updateWebSocketConnection(ws, {
        last_activity: new Date()
      });

      switch (data.type) {
        case "authenticate":
          // Update connection with user information
          await updateWebSocketConnection(ws, {
            user_id: data.userId,
            user_type: data.userType,
            role_in_session: data.role
          });
          
          ws.send(JSON.stringify({ 
            type: "authenticated", 
            userId: data.userId,
            userType: data.userType 
          }));
          
          await logActivity({
            user_id: data.userId,
            action: 'websocket_authenticate',
            description: `User authenticated via WebSocket: ${data.userType}`,
            session_uuid: connectionData?.connectionId,
            ip_address: clientIP
          });
          break;

        case "createSession": {
          // Require clinicianId, sessionId, templateId. If patientId is missing, create a temporary patient.
          if (!data.clinicianId || !data.sessionId || !data.templateId) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Missing clinicianId, sessionId, or templateId for createSession"
            }));
            break;
          }
          let patientId = data.patientId;
          try {
            if (!patientId) {
              // Create a temporary patient
              const tempPatient = await prisma.patient.create({
                data: {
                  first_name: "Unregistered",
                  last_name: "Patient",
                  date_of_birth: new Date(2000, 0, 1),
                  is_active: false,
                  // Optionally, add a flag or note for cleanup
                  notes: `Temporary patient for session ${data.sessionId}`,
                  assigned_clinician_id: data.clinicianId
                }
              });
              patientId = tempPatient.patient_id;
            }
            const clinicianIpToUse = data.hostIp ?? connectionData?.ipAddress ?? SERVER_LOCAL_IP ?? null;
            const session = await prisma.assessmentSession.create({
              data: {
                session_uuid: data.sessionId,
                clinician_id: data.clinicianId,
                patient_id: patientId,
                template_id: data.templateId,
                clinician_ip: clinicianIpToUse,
                session_date: new Date(),
                status: 'Scheduled',
                session_mode: data.isKidsMode ? 'Kids' : 'Standard',
                is_practice_session: false
              }
            });
            ws.send(JSON.stringify({
              type: "sessionCreated",
              sessionId: session.session_uuid,
              sessionInfo: {
                ...session,
                clinician_ip: clinicianIpToUse
              },
              tempPatientId: !data.patientId ? patientId : undefined
            }));
            await logActivity({
              user_id: data.clinicianId,
              action: 'create_assessment_session',
              entity_type: 'assessment_session',
              entity_id: session.session_id,
              description: `Created assessment session: ${session.session_uuid}`,
              new_values: data
            });
          } catch (error) {
            console.error('Failed to create session:', error);
            ws.send(JSON.stringify({
              type: "error",
              message: "Failed to create session"
            }));
          }
          break;
        }
        case 'nextItem': {
          try {
            const roomId = data.sessionId;
            const items = roomItemsList[roomId] || [];
            const current = roomCurrentItems[roomId];
            if (!items || items.length === 0) break;
            let idx = 0;
            if (current) {
              idx = items.findIndex((it) => (it.item_id && current.item_id && it.item_id === current.item_id) || (it.item_number && current.item && it.item_number === current.item));
              if (idx === -1) idx = 0;
            }
            const nextIndex = Math.min(items.length - 1, idx + 1);
            const nextItem = items[nextIndex];
            const nextItemRecord = nextItem as Record<string, unknown>;
            const nextItemId = Number(String(nextItemRecord['item_number'] ?? nextItemRecord['item_id'] ?? 0));
            const nextQuestion = String(nextItemRecord['question'] ?? '');
            roomCurrentItems[roomId] = { item: nextItemId, question: nextQuestion };
            // Broadcast the new item
            const msg = JSON.stringify({ type: 'changeAssessmentItem', item: roomCurrentItems[roomId], sessionId: roomId, timestamp: new Date().toISOString() });
            broadcastToRoom(roomId, msg);
            // Persist progress
            await updateSessionProgress(roomId, { item: nextItemId });
          } catch (err) {
            console.error('Failed to advance to next item:', err);
          }
          break;
        }
        case 'prevItem': {
          try {
            const roomId = data.sessionId;
            const items = roomItemsList[roomId] || [];
            const current = roomCurrentItems[roomId];
            if (!items || items.length === 0) break;
            let idx = 0;
            if (current) {
              idx = items.findIndex((it) => (it.item_id && current.item_id && it.item_id === current.item_id) || (it.item_number && current.item && it.item_number === current.item));
              if (idx === -1) idx = 0;
            }
            const prevIndex = Math.max(0, idx - 1);
            const prevItem = items[prevIndex];
            const prevItemRecord = prevItem as Record<string, unknown>;
            const prevItemId = Number(String(prevItemRecord['item_number'] ?? prevItemRecord['item_id'] ?? 0));
            const prevQuestion = String(prevItemRecord['question'] ?? '');
            roomCurrentItems[roomId] = { item: prevItemId, question: prevQuestion };
            const msg = JSON.stringify({ type: 'changeAssessmentItem', item: roomCurrentItems[roomId], sessionId: roomId, timestamp: new Date().toISOString() });
            broadcastToRoom(roomId, msg);
            await updateSessionProgress(roomId, { item: prevItemId });
          } catch (err) {
            console.error('Failed to go to previous item:', err);
          }
          break;
        }
        case "joinRoom":
          // Enforce 1:1 patient binding inside joinRoom
          await joinRoom(ws, data.roomId, {
            clinicianId: data.clinicianId,
            patientId: data.patientId,
            role: data.role,
            isKidsMode: data.isKidsMode
          });
          
          ws.send(JSON.stringify({ 
            type: "joinedRoom", 
            roomId: data.roomId,
            timestamp: new Date().toISOString()
          }));
          
          // Send current item if available
          if (roomCurrentItems[data.roomId]) {
            ws.send(JSON.stringify({
              type: "changeAssessmentItem",
              item: roomCurrentItems[data.roomId],
              sessionId: data.roomId,
              timestamp: new Date().toISOString()
            }));
          }
          break;

        case "assignTemplate":
          try {
            if (!data.sessionId || !data.templateId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Missing sessionId or templateId' }));
              break;
            }
            // Update session template in DB
            await prisma.assessmentSession.updateMany({
              where: { session_uuid: data.sessionId },
              data: { template_id: data.templateId }
            });

            // Fetch template details to broadcast name/items so clients (patients) can reflect template
            const template = await prisma.assessmentTemplate.findUnique({
              where: { template_id: data.templateId },
              include: {
                session_items: {
                  where: { is_active: true },
                  orderBy: { display_order: 'asc' }
                }
              }
            });

            // Store the full template item list for this room and set the current item to the first one
            if (template && template.session_items && template.session_items.length > 0) {
              roomItemsList[data.sessionId] = template.session_items;
              const firstItem = template.session_items[0];
              roomCurrentItems[data.sessionId] = {
                ...firstItem,
                item: firstItem.item_number || firstItem.item_id,
                question: firstItem.question
              };
            }

            const msg = JSON.stringify({
              type: 'templateAssigned',
              sessionId: data.sessionId,
              templateId: data.templateId,
              templateName: template?.name ?? null,
              templateItems: template?.session_items ?? null
            });

            // Notify room participants (clinician + patient)
            broadcastToRoom(data.sessionId, msg);
          } catch (err) {
            console.error('Failed to assign template:', err);
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to assign template' }));
          }
          break;

        case 'startSession':
          try {
            if (!data.sessionId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Missing sessionId for startSession' }));
              break;
            }
            // Ensure roomCurrentItems reflect the session's template before starting
            try {
              const session = await prisma.assessmentSession.findUnique({ where: { session_uuid: data.sessionId } });
              if (session && session.template_id) {
                const template = await prisma.assessmentTemplate.findUnique({
                  where: { template_id: session.template_id },
                  include: {
                    session_items: {
                      where: { is_active: true },
                      orderBy: { display_order: 'asc' }
                    }
                  }
                });
                if (template && template.session_items && template.session_items.length > 0) {
                  roomItemsList[data.sessionId] = template.session_items;
                  const firstItem = template.session_items[0];
                  roomCurrentItems[data.sessionId] = {
                    ...firstItem,
                    item: firstItem.item_number || firstItem.item_id,
                    question: firstItem.question
                  };
                }
              }
            } catch (err) {
              console.warn('Failed to load template items on startSession:', err);
            }

            // Mark session as In Progress
            await prisma.assessmentSession.updateMany({
              where: { session_uuid: data.sessionId },
              data: { status: 'In Progress', start_time: new Date() }
            });

            const startMsg = JSON.stringify({ type: 'sessionStarted', sessionId: data.sessionId, timestamp: new Date().toISOString() });
            broadcastToRoom(data.sessionId, startMsg);

            // Send current item to participants so patient UI immediately shows the first item
            if (roomCurrentItems[data.sessionId]) {
              const changeMsg = JSON.stringify({ type: 'changeAssessmentItem', item: roomCurrentItems[data.sessionId], sessionId: data.sessionId, timestamp: new Date().toISOString() });
              broadcastToRoom(data.sessionId, changeMsg);
            }
          } catch (err) {
            console.error('Failed to start session:', err);
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to start session' }));
          }
          break;

        case "leaveRoom":
          await leaveRoom(ws, data.roomId);
          ws.send(JSON.stringify({ 
            type: "leftRoom", 
            roomId: data.roomId,
            timestamp: new Date().toISOString()
          }));
          break;

        case "sendQrData":
          await broadcastQrData(data.qrData, data.sessionId, data.clinicianId);
          break;

        case "changeAssessmentItem":
          await broadcastAssessmentItemChange(data.item, data.sessionId);
          break;

        case "submitResponse":
          // Save response to database
          await saveSessionResponse(data.sessionId, data.item, data.response);
          
          // Notify clinician of response submission
          const responseMessage = JSON.stringify({
            type: "responseSubmitted",
            sessionId: data.sessionId,
            itemId: data.item.item,
            response: data.response,
            timestamp: new Date().toISOString()
          });
          
          broadcastToRoom(data.sessionId, responseMessage, ws);
          break;

        case "updateSessionSettings":
          // Update session settings
          try {
            const session = await prisma.assessmentSession.findUnique({
              where: { session_uuid: data.sessionId }
            });

            if (session) {
              await prisma.assessmentSession.update({
                where: { session_uuid: data.sessionId },
                data: {
                  session_mode: data.settings.isKidsMode ? 'Kids' : 'Standard',
                  session_name: data.settings.sessionName,
                  pre_session_notes: data.settings.notes
                }
              });

              // Broadcast settings update to all room participants
              const settingsMessage = JSON.stringify({
                type: "sessionSettingsUpdated",
                sessionId: data.sessionId,
                settings: data.settings,
                timestamp: new Date().toISOString()
              });
              
              broadcastToRoom(data.sessionId, settingsMessage);
            }
          } catch (error) {
            console.error('Failed to update session settings:', error);
            ws.send(JSON.stringify({
              type: "error",
              message: "Failed to update session settings"
            }));
          }
          break;

        case "pauseSession":
          try {
            await prisma.assessmentSession.update({
              where: { session_uuid: data.sessionId },
              data: { status: 'Paused' }
            });

            const pauseMessage = JSON.stringify({
              type: "sessionPaused",
              sessionId: data.sessionId,
              timestamp: new Date().toISOString()
            });
            
            broadcastToRoom(data.sessionId, pauseMessage);
          } catch (error) {
            console.error('Failed to pause session:', error);
          }
          break;

        case "resumeSession":
          try {
            await prisma.assessmentSession.update({
              where: { session_uuid: data.sessionId },
              data: { status: 'In Progress' }
            });

            const resumeMessage = JSON.stringify({
              type: "sessionResumed",
              sessionId: data.sessionId,
              timestamp: new Date().toISOString()
            });
            
            broadcastToRoom(data.sessionId, resumeMessage);
          } catch (error) {
            console.error('Failed to resume session:', error);
          }
          break;

        case "endSession":
          try {
            const session = await prisma.assessmentSession.update({
              where: { session_uuid: data.sessionId },
              data: { 
                status: 'Completed',
                end_time: new Date(),
                post_session_notes: data.notes,
                session_summary: data.summary
              }
            });

            const endMessage = JSON.stringify({
              type: "sessionEnded",
              sessionId: data.sessionId,
              summary: data.summary,
              timestamp: new Date().toISOString()
            });
            
            broadcastToRoom(data.sessionId, endMessage);

            await logActivity({
              user_id: session.clinician_id,
              action: 'end_session',
              entity_type: 'assessment_session',
              entity_id: session.session_id,
              description: `Assessment session completed: ${data.sessionId}`
            });
          } catch (error) {
            console.error('Failed to end session:', error);
          }
          break;

        case "heartbeat":
          // Simple heartbeat to keep connection alive
          ws.send(JSON.stringify({
            type: "heartbeatResponse",
            timestamp: new Date().toISOString()
          }));
          break;

        default:
          console.log("Unknown message type:", data.type);
          ws.send(JSON.stringify({
            type: "error",
            message: `Unknown message type: ${data.type}`
          }));
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
      ws.send(JSON.stringify({
        type: "error",
        message: "Invalid message format"
      }));
    }
  });

  ws.on("close", async () => {
    console.log(`WebSocket connection closed from ${clientIP}`);
    
    // Remove client from all rooms
    for (const roomId in rooms) {
      if (rooms[roomId].has(ws)) {
        await leaveRoom(ws, roomId);
      }
    }
    
    // Clean up connection record
    await removeWebSocketConnection(ws);
  });

  ws.on("error", async (error) => {
    console.error(`WebSocket error from ${clientIP}:`, error);
    
    const connectionData = connectionMap.get(ws);
    await logActivity({
      user_id: connectionData?.userId,
      action: 'websocket_error',
      description: `WebSocket error: ${error.message}`,
      session_uuid: connectionData?.connectionId,
      ip_address: clientIP,
      error_message: error.message,
      success: false
    });
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: "connected",
    message: "Connected to Fil-PAT WebSocket server",
    timestamp: new Date().toISOString()
  }));
});

// =============================================
// PERIODIC CLEANUP AND MAINTENANCE
// =============================================

// Cleanup inactive connections every 5 minutes
setInterval(async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Mark stale connections as disconnected
    await prisma.webSocketConnection.updateMany({
      where: {
        connection_status: 'active',
        last_activity: {
          lt: fiveMinutesAgo
        }
      },
      data: {
        connection_status: 'expired',
        disconnected_at: new Date()
      }
    });

    console.log('Cleaned up stale WebSocket connections');
  } catch (error) {
    console.error('Failed to cleanup stale connections:', error);
  }
}, 5 * 60 * 1000);

// Auto-save session progress every 30 seconds
setInterval(async () => {
  try {
    for (const [roomId, currentItem] of Object.entries(roomCurrentItems)) {
      if (rooms[roomId] && rooms[roomId].size > 0) {
        await updateSessionProgress(roomId, currentItem);
      }
    }
  } catch (error) {
    console.error('Failed to auto-save session progress:', error);
  }
}, 30 * 1000);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down WebSocket server...');
  
  // Mark all active connections as disconnected
  try {
    await prisma.webSocketConnection.updateMany({
      where: { connection_status: 'active' },
      data: {
        connection_status: 'disconnected',
        disconnected_at: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to cleanup connections on shutdown:', error);
  }
  
  wss.close();
  await prisma.$disconnect();
  process.exit(0);
});

console.log(`🚀 Enhanced WebSocket server running on ws://${host}:${port}`);
console.log(`📊 Database integration: ENABLED`);
console.log(`🔒 Activity logging: ENABLED`);
console.log(`🛡️  Connection tracking: ENABLED`);

// Additional runtime diagnostics to help with LAN connectivity troubleshooting
console.log(`Server detected LAN IP (fallback): ${SERVER_LOCAL_IP ?? 'none'}`);

wss.on('listening', () => {
  try {
    console.log('WebSocketServer: listening event fired');
  } catch (err) {
    console.error('Error in listening handler:', err);
  }
});

wss.on('error', (err) => {
  console.error('WebSocketServer error event:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});