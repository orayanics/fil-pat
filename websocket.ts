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
  role?: string;
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

// Session Activity Logging Helper
async function logSessionActivity(sessionUuid: string, activityType: string, details?: any) {
  try {
    const session = await prisma.assessmentSession.findUnique({
      where: { session_uuid: sessionUuid },
      select: { session_id: true, activity_log: true }
    });

    if (!session) {
      console.warn(`[Activity Log] Session ${sessionUuid} not found`);
      return;
    }

    // Parse existing activity log or start new array
    let activities: any[] = [];
    if (session.activity_log) {
      try {
        activities = JSON.parse(session.activity_log);
      } catch (e) {
        console.warn('[Activity Log] Failed to parse existing log, starting fresh');
      }
    }

    // Add new activity
    const newActivity = {
      type: activityType,
      timestamp: new Date().toISOString(),
      ...details
    };
    activities.push(newActivity);

    // Update session with new activity log
    const updateData: any = {
      activity_log: JSON.stringify(activities)
    };

    // Update specific timestamp fields based on activity type
    if (activityType === 'session_paused' || activityType === 'clinician_left') {
      updateData.session_paused_at = new Date();
      if (activityType === 'clinician_left') {
        await prisma.assessmentSession.update({
          where: { session_uuid: sessionUuid },
          data: {
            clinician_left_count: { increment: 1 }
          }
        });
      }
    } else if (activityType === 'session_resumed' || activityType === 'clinician_rejoined') {
      updateData.session_resumed_at = new Date();
      
      // Calculate pause duration if we have a paused_at timestamp
      const sessionWithPause = await prisma.assessmentSession.findUnique({
        where: { session_uuid: sessionUuid },
        select: { session_paused_at: true, total_pause_duration: true }
      });
      
      if (sessionWithPause?.session_paused_at) {
        const pauseDuration = Math.floor(
          (new Date().getTime() - new Date(sessionWithPause.session_paused_at).getTime()) / 1000
        );
        updateData.total_pause_duration = (sessionWithPause.total_pause_duration || 0) + pauseDuration;
      }
    }

    await prisma.assessmentSession.update({
      where: { session_uuid: sessionUuid },
      data: updateData
    });

    console.log(`[Activity Log] ${activityType} logged for session ${sessionUuid}`, details);
  } catch (error) {
    console.error('[Activity Log] Failed to log activity:', error);
  }
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
      role: data.role,
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

    // Get the actual item_id from item_number
    let currentItemId: number | null = null;
    if (itemData.item) {
      const sessionItem = await prisma.sessionItem.findFirst({
        where: {
          template_id: session.template_id,
          item_number: itemData.item
        }
      });
      if (sessionItem) {
        currentItemId = sessionItem.item_id;
      }
    }

    await prisma.assessmentSession.update({
      where: { session_uuid: sessionId },
      data: {
        current_item_id: currentItemId,
        completed_items: itemData.item > 0 ? itemData.item - 1 : 0,
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
  consonantsCorrect?: number;
  vowelsCorrect?: number;
}

async function saveSessionResponse(
  sessionId: string,
  itemData: SessionItemData,
  responseData: ResponseData
): Promise<void> {
  try {
    console.log('[saveSessionResponse] Saving response:', {
      sessionId,
      itemId: itemData.item,
      responseData: {
        response: responseData.response,
        score: responseData.score,
        notes: responseData.notes,
        consonantsCorrect: responseData.consonantsCorrect,
        vowelsCorrect: responseData.vowelsCorrect
      }
    });

    const session = await prisma.assessmentSession.findUnique({
      where: { session_uuid: sessionId },
      include: {
        template: {
          include: {
            session_items: true,
          },
        },
      },
    });

    if (!session) {
      console.warn(`Session not found for UUID: ${sessionId}`);
      return;
    }

    // Find the actual session_item_id from the template based on item_number
    const sessionItem = session.template.session_items.find(
      (item) => item.item_number === itemData.item
    );

    if (!sessionItem) {
      console.error(`[saveSessionResponse] Session item not found for item_number: ${itemData.item}`);
      return;
    }

    console.log('[saveSessionResponse] Found session item:', {
      item_number: itemData.item,
      item_id: sessionItem.item_id,
      question: sessionItem.question
    });

    // Make response saving idempotent: update existing response for the same
    // session_id + session_item_id if present, otherwise create one.
    // Using findFirst() because there may not be a unique constraint in the
    // schema for (session_id, session_item_id).
    const existing = await prisma.sessionResponse.findFirst({
      where: {
        session_id: session.session_id,
        session_item_id: sessionItem.item_id,
      },
    });

    if (existing) {
      const updateData = {
        response_text: responseData.response ?? null,
        response_audio_path: responseData.audioPath ?? null,
        is_correct: responseData.isCorrect ?? null,
        score: responseData.score ?? null,
        max_possible_score: itemData.max_score ?? 1.0,
        time_taken_seconds: responseData.timeTaken ?? null,
        clinician_notes: responseData.notes ?? null,
        consonants_correct: responseData.consonantsCorrect ?? null,
        vowels_correct: responseData.vowelsCorrect ?? null,
      };

      console.log('[saveSessionResponse] Updating existing response:', { response_id: existing.response_id, updateData });

      await prisma.sessionResponse.update({
        where: { response_id: existing.response_id },
        data: updateData,
      });

      await logActivity({
        user_id: session.clinician_id,
        action: "update_response",
        entity_type: "session_response",
        entity_id: session.session_id,
        description: `Updated response for item ${itemData.item}`,
        new_values: {
          item_number: itemData.item,
          item_id: sessionItem.item_id,
          score: responseData.score ?? null,
        },
      });
    } else {
      const createData = {
        session_id: session.session_id,
        session_item_id: sessionItem.item_id,
        response_text: responseData.response ?? null,
        response_audio_path: responseData.audioPath ?? null,
        is_correct: responseData.isCorrect ?? null,
        score: responseData.score ?? null,
        max_possible_score: itemData.max_score ?? 1.0,
        time_taken_seconds: responseData.timeTaken ?? null,
        clinician_notes: responseData.notes ?? null,
        consonants_correct: responseData.consonantsCorrect ?? null,
        vowels_correct: responseData.vowelsCorrect ?? null,
      };

      console.log('[saveSessionResponse] Creating new response:', createData);

      await prisma.sessionResponse.create({
        data: createData,
      });

      await logActivity({
        user_id: session.clinician_id,
        action: "save_response",
        entity_type: "session_response",
        entity_id: session.session_id,
        description: `Response saved for item ${itemData.item}`,
        new_values: {
          item_number: itemData.item,
          item_id: sessionItem.item_id,
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
      // Check if the existing patient connection is still active
      const existingPatientWs = roomPatient[roomId];
      if (existingPatientWs && existingPatientWs.readyState === WebSocket.OPEN) {
        // Notify the joining patient they cannot join
        try {
          ws.send(JSON.stringify({ type: 'patientRejected', message: 'A patient is already connected to this session.' }));
        } catch {}
        return;
      } else {
        // Existing patient disconnected, allow reconnection
        console.log(`[Reconnection] Patient reconnecting to room ${roomId}`);
        roomPatient[roomId] = ws;
        
        // Notify clinician that patient has reconnected
        rooms[roomId].forEach((client) => {
          const conn = connectionMap.get(client as WebSocket);
          if (conn && conn.userType === 'clinician' && client.readyState === WebSocket.OPEN) {
            try {
              client.send(JSON.stringify({ 
                type: 'patientReconnected', 
                sessionId: roomId,
                message: 'Patient has reconnected to the session'
              }));
            } catch {}
          }
        });
      }
    } else {
      // Assign this ws as the patient for the room
      roomPatient[roomId] = ws;
    }
  } else {
    // Not a patient - just add to room
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
    // Send session info to clinician (for resume/continue scenarios)
    try {
      const sessionInfo = await prisma.assessmentSession.findUnique({
        where: { session_uuid: roomId },
        include: {
          template: {
            include: {
              session_items: {
                where: { is_active: true },
                orderBy: { display_order: 'asc' }
              }
            }
          },
          patient: true,
          current_item: true
        }
      });
      
      if (sessionInfo && ws.readyState === WebSocket.OPEN) {
        console.log('[Clinician Join] Sending session info to clinician:', {
          session_uuid: sessionInfo.session_uuid,
          status: sessionInfo.status,
          template_name: sessionInfo.template?.name,
          items_count: sessionInfo.template?.session_items.length
        });

        // Initialize room items if not already set
        const items = sessionInfo.template?.session_items || [];
        if (!roomItemsList[roomId]) {
          roomItemsList[roomId] = items;
        }

        // Set current item (use saved current_item or first item)
        let currentItem = null;
        if (sessionInfo.current_item) {
          currentItem = {
            ...sessionInfo.current_item,
            item: sessionInfo.current_item.item_number || sessionInfo.current_item.item_id,
            question: sessionInfo.current_item.question
          };
          roomCurrentItems[roomId] = currentItem;
        } else if (items.length > 0 && !roomCurrentItems[roomId]) {
          const firstItem = items[0] as Record<string, unknown>;
          currentItem = {
            ...firstItem,
            item: Number(String(firstItem['item_number'] ?? firstItem['item_id'] ?? 1)),
            question: String(firstItem['question'] ?? '')
          };
          roomCurrentItems[roomId] = currentItem;
        } else {
          currentItem = roomCurrentItems[roomId];
        }
        
        ws.send(JSON.stringify({
          type: 'sessionLoaded',
          sessionId: roomId,
          sessionInfo: {
            ...sessionInfo,
            template_name: sessionInfo.template?.name,
            is_for_kids: sessionInfo.template?.is_for_kids,
          },
          templateItems: items,
          currentItem: currentItem,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (err) {
      console.error('[Clinician Join] Failed to send session info to clinician:', err);
    }

    // Notify clinician if a patient is already connected
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
    
    // Send session info to the patient including is_resumed flag
    try {
      const sessionInfo = await prisma.assessmentSession.findUnique({
        where: { session_uuid: roomId },
        include: {
          template: {
            include: {
              session_items: {
                where: { is_active: true },
                orderBy: { display_order: 'asc' }
              }
            }
          },
          patient: true
        }
      });
      
      if (sessionInfo && ws.readyState === WebSocket.OPEN) {
        // Generate patient URL
        const protocol = "http";
        const host = sessionInfo.clinician_ip || SERVER_LOCAL_IP || "localhost";
        const port = process.env.NEXT_PUBLIC_PORT || "3000";
        const patientUrl = `${protocol}://${host}:${port}/session/patient/${roomId}`;
        
        // Log session info
        console.log('Sending session info to patient:', {
          session_uuid: sessionInfo.session_uuid,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          is_resumed: (sessionInfo as any).is_resumed,
          template_name: sessionInfo.template?.name,
          session_name: sessionInfo.session_name
        });
        
        ws.send(JSON.stringify({
          type: 'sessionLoaded',
          sessionId: roomId,
          sessionInfo: {
            ...sessionInfo,
            template_name: sessionInfo.template?.name,
            is_for_kids: sessionInfo.template?.is_for_kids,
            patientUrl
          },
          templateItems: sessionInfo.template?.session_items || [],
          currentItem: roomCurrentItems[roomId] || null,
          timestamp: new Date().toISOString()
        }));
        
        // Auto-start resumed sessions if both clinician and patient are connected
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const isResumed = (sessionInfo as any).is_resumed === true;
        const roomParticipants = rooms[roomId] ? Array.from(rooms[roomId]) : [];
        const hasClinicianAndPatient = roomParticipants.length >= 2;
        
        if (isResumed && hasClinicianAndPatient && sessionInfo.status !== 'In Progress') {
          console.log('[Auto-start] Both parties connected for resumed session, starting automatically');
          
          // Update session status to In Progress
          await prisma.assessmentSession.update({
            where: { session_id: sessionInfo.session_id },
            data: { status: 'In Progress' }
          });

          // Initialize room with session items
          const items = sessionInfo.template?.session_items || [];
          roomItemsList[roomId] = items;

          // Set first item as current
          if (items.length > 0) {
            const firstItem = items[0] as Record<string, unknown>;
            roomCurrentItems[roomId] = {
              ...firstItem,
              item: Number(String(firstItem['item_number'] ?? firstItem['item_id'] ?? 1)),
              question: String(firstItem['question'] ?? '')
            };
          }

          // Broadcast session started to room
          const startMsg = JSON.stringify({
            type: 'sessionStarted',
            sessionId: roomId,
            currentItem: roomCurrentItems[roomId],
            timestamp: new Date().toISOString()
          });
          broadcastToRoom(roomId, startMsg);
        }
      }
    } catch (err) {
      console.error('Failed to send session info to patient:', err);
    }
    
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
    
    // Check if this ws was a clinician or the assigned patient
    const connInfo = connectionMap.get(ws);
    const isClinician = connInfo?.userType === 'clinician' || connInfo?.role === 'clinician';
    const wasPatient = roomPatient[roomId] === ws;
    
    // Log clinician leaving the session
    if (isClinician) {
      console.log(`[Clinician Left] Clinician left room ${roomId}`);
      await logSessionActivity(roomId, 'clinician_left', {
        clinician_id: connInfo?.userId,
        reason: 'disconnected'
      });
      
      // Notify other participants that clinician left
      broadcastToRoom(roomId, JSON.stringify({ 
        type: 'clinicianLeft', 
        sessionId: roomId,
        message: 'Clinician has left the session',
        timestamp: new Date().toISOString()
      }));
    }
    
    // If this ws was the assigned patient
    
    // If this ws was the assigned patient, notify but DON'T clear assignment yet
    // This allows for reconnection
    if (wasPatient) {
      console.log(`[Patient Left] Patient disconnected from room ${roomId}, waiting for reconnection...`);
      
      // Notify clinicians that patient left
      broadcastToRoom(roomId, JSON.stringify({ 
        type: 'patientDisconnected', 
        sessionId: roomId,
        message: 'Patient disconnected - they may reconnect'
      }));
      
      // Set a timeout to clear the patient assignment if they don't reconnect
      setTimeout(() => {
        // Only clear if the same WebSocket is still assigned (not reconnected)
        if (roomPatient[roomId] === ws) {
          console.log(`[Patient Left] Patient did not reconnect to room ${roomId}, clearing assignment`);
          roomPatient[roomId] = null;
          broadcastToRoom(roomId, JSON.stringify({ 
            type: 'patientLeft', 
            sessionId: roomId,
            message: 'Patient left the session'
          }));
        }
      }, 30000); // 30 second grace period for reconnection
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
          // Allow templateId to be optional; fallback to default template if not provided.
          if (!data.clinicianId || !data.sessionId) {
            ws.send(JSON.stringify({
              type: "error",
              message: "Missing clinicianId or sessionId for createSession"
            }));
            break;
          }
          const sessionName = data.sessionName || null;
          const patientId = data.patientId || null;
          try {
            // Don't create temp patient - will be set later via setSessionPatient
            // Resolve template ID: use provided templateId or fall back to default template
            let templateIdToUse: number | null = null;
            if (data.templateId) {
              templateIdToUse = Number(data.templateId);
            } else {
              const defaultTemplate = await prisma.assessmentTemplate.findFirst({ where: { is_default: true } });
              if (defaultTemplate) templateIdToUse = defaultTemplate.template_id; else {
                // fallback: pick ANY template if no default
                const anyTemplate = await prisma.assessmentTemplate.findFirst();
                if (anyTemplate) templateIdToUse = anyTemplate.template_id;
              }
            }
            if (!templateIdToUse) {
              ws.send(JSON.stringify({ type: 'error', message: 'No template available to create session' }));
              break;
            }

            const clinicianIpToUse = data.hostIp ?? connectionData?.ipAddress ?? SERVER_LOCAL_IP ?? null;
            const session = await prisma.assessmentSession.create({
              data: {
                session_uuid: data.sessionId,
                session_name: sessionName,
                clinician_id: data.clinicianId,
                patient_id: patientId,
                template_id: templateIdToUse,
                clinician_ip: clinicianIpToUse,
                session_date: new Date(),
                status: 'Scheduled',
                session_mode: data.isKidsMode ? 'Kids' : 'Standard',
                is_practice_session: false
              }
            });
            
            // Generate patient URL using actual IP
            const protocol = "http";
            // Use the clinician's IP if available, otherwise use server IP or localhost
            const host = clinicianIpToUse || SERVER_LOCAL_IP || "localhost";
            const port = process.env.NEXT_PUBLIC_PORT || "3000";
            const patientUrl = `${protocol}://${host}:${port}/session/patient/${session.session_uuid}`;
            
            ws.send(JSON.stringify({
              type: "sessionCreated",
              sessionId: session.session_uuid,
              sessionInfo: {
                ...session,
                clinician_ip: clinicianIpToUse,
                patientUrl
              }
            }));
            await logActivity({
              user_id: data.clinicianId,
              action: 'create_assessment_session',
              entity_type: 'assessment_session',
              entity_id: session.session_id,
              description: `Created assessment session: ${session.session_uuid}`,
              new_values: { ...data, template_id: templateIdToUse }
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
        case "loadSession": {
          try {
            if (!data.sessionId) {
              ws.send(JSON.stringify({ type: "error", message: "Missing sessionId" }));
              break;
            }

            const session = await prisma.assessmentSession.findUnique({
              where: { session_uuid: data.sessionId },
              include: {
                template: {
                  include: { session_items: { orderBy: { item_number: 'asc' } } }
                },
                patient: true,
                responses: {
                  include: {
                    session_item: true
                  },
                  orderBy: { response_id: 'asc' }
                }
              }
            });

            if (!session) {
              console.error(`Session not found for UUID: ${data.sessionId}`);
              ws.send(JSON.stringify({ type: "error", message: "Session not found", details: `No session found with UUID: ${data.sessionId}`, keepAlive: true }));
              // Don't break - keep connection alive
              break;
            }

            // Initialize room with session items
            const roomId = data.sessionId;
            const items = session.template?.session_items || [];
            roomItemsList[roomId] = items;

            // Calculate completion
            const totalItems = items.length;
            const completedItems = session.responses?.length || 0;
            const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

            // Find current item (last completed + 1, or first item)
            const currentItemIndex = Math.min(completedItems, items.length - 1);
            if (items.length > 0) {
              const currentItemData = items[currentItemIndex] as Record<string, unknown>;
              roomCurrentItems[roomId] = {
                ...currentItemData,
                item: Number(String(currentItemData['item_number'] ?? currentItemData['item_id'] ?? 1)),
                question: String(currentItemData['question'] ?? '')
              };
            }

            // Generate patient URL for session
            const protocol = "http";
            const connectionData = connectionMap.get(ws);
            const clinicianIpToUse = session.clinician_ip || connectionData?.ipAddress || SERVER_LOCAL_IP || "localhost";
            const port = process.env.NEXT_PUBLIC_PORT || "3000";
            const patientUrl = `${protocol}://${clinicianIpToUse}:${port}/session/patient/${roomId}`;

            // Send session info to client
            ws.send(JSON.stringify({
              type: 'sessionLoaded',
              sessionId: roomId,
              sessionInfo: {
                ...session,
                total_items: totalItems,
                completed_items: completedItems,
                completion_percentage: completionPercentage,
                patientUrl
              },
              templateItems: items,
              currentItem: roomCurrentItems[roomId],
              timestamp: new Date().toISOString()
            }));

            await logActivity({
              user_id: session.clinician_id,
              action: 'load_assessment_session',
              entity_type: 'assessment_session',
              entity_id: session.session_id,
              description: `Loaded assessment session: ${data.sessionId}`
            });
          } catch (error) {
            console.error('Failed to load session:', error);
            ws.send(JSON.stringify({ type: "error", message: "Failed to load session" }));
          }
          break;
        }
        case "generateSessionLink": {
          try {
            if (!data.sessionId) {
              ws.send(JSON.stringify({ type: "error", message: "Missing sessionId" }));
              break;
            }

            // Find the existing session
            const existingSession = await prisma.assessmentSession.findFirst({
              where: { session_uuid: data.sessionId },
              include: { template: true }
            });

            if (!existingSession) {
              ws.send(JSON.stringify({ type: "error", message: "Session not found" }));
              break;
            }

            // Generate new session UUID for patient reconnection
            const newSessionUuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            
            // Get clinician IP
            const connectionData = connectionMap.get(ws);
            const clinicianIpToUse = data.hostIp ?? connectionData?.ipAddress ?? SERVER_LOCAL_IP ?? null;
            
            // Use provided session name or generate default
            const sessionName = data.sessionName || existingSession.session_name || `Continuation of ${data.sessionId}`;
            
            console.log('[generateSessionLink] Creating resumed session with name:', sessionName);
            
            // Create new session linked to same patient and template
            const newSession = await prisma.assessmentSession.create({
              data: {
                session_uuid: newSessionUuid,
                session_name: sessionName,
                clinician_id: existingSession.clinician_id,
                patient_id: existingSession.patient_id,
                template_id: existingSession.template_id,
                clinician_ip: clinicianIpToUse,
                session_date: new Date(),
                status: 'Scheduled',
                session_mode: existingSession.session_mode,
                is_practice_session: existingSession.is_practice_session,
                is_resumed: true // Added in recent schema update
              }
            });

            // Generate patient URL
            const protocol = "http";
            const host = clinicianIpToUse || SERVER_LOCAL_IP || "localhost";
            const port = process.env.NEXT_PUBLIC_PORT || "3000";
            const patientUrl = `${protocol}://${host}:${port}/session/patient/${newSessionUuid}`;

            ws.send(JSON.stringify({
              type: "sessionLinkGenerated",
              originalSessionId: data.sessionId,
              newSessionId: newSessionUuid,
              patientUrl,
              sessionInfo: newSession,
              timestamp: new Date().toISOString()
            }));

            await logActivity({
              user_id: existingSession.clinician_id,
              action: 'generate_session_link',
              entity_type: 'assessment_session',
              entity_id: newSession.session_id,
              description: `Generated new session link for ${data.sessionId}: ${newSessionUuid}`
            });
          } catch (error) {
            console.error('Failed to generate session link:', error);
            ws.send(JSON.stringify({ type: "error", message: "Failed to generate session link" }));
          }
          break;
        }
        case "setSessionPatient": {
          try {
            if (!data.sessionId) {
              ws.send(JSON.stringify({ type: "error", message: "Missing sessionId" }));
              break;
            }

            const session = await prisma.assessmentSession.findFirst({
              where: { session_uuid: data.sessionId }
            });

            if (!session) {
              ws.send(JSON.stringify({ type: "error", message: "Session not found" }));
              break;
            }

            let patientId = data.patient_id;

            // If patient_id not provided, create new patient
            if (!patientId && data.first_name && data.last_name) {
              const newPatient = await prisma.patient.create({
                data: {
                  first_name: data.first_name,
                  last_name: data.last_name,
                  date_of_birth: new Date(2000, 0, 1), // Default date
                  is_active: true,
                  assigned_clinician_id: session.clinician_id
                }
              });
              patientId = newPatient.patient_id;
            }

            // Update session with patient
            if (patientId) {
              await prisma.assessmentSession.update({
                where: { session_id: session.session_id },
                data: { patient_id: patientId }
              });

              ws.send(JSON.stringify({
                type: "patientSet",
                sessionId: data.sessionId,
                patientId
              }));

              await logActivity({
                user_id: session.clinician_id,
                action: 'set_session_patient',
                entity_type: 'assessment_session',
                entity_id: session.session_id,
                description: `Set patient ${patientId} for session ${data.sessionId}`
              });
            }
          } catch (error) {
            console.error('Failed to set session patient:', error);
            ws.send(JSON.stringify({ type: "error", message: "Failed to set session patient" }));
          }
          break;
        }
        case "startSession": {
          try {
            const roomId = data.sessionId;
            
            if (!roomId) {
              ws.send(JSON.stringify({ type: "error", message: "Missing sessionId" }));
              break;
            }

            const session = await prisma.assessmentSession.findFirst({
              where: { session_uuid: roomId },
              include: {
                template: {
                  include: { 
                    session_items: { 
                      where: { is_active: true },
                      orderBy: { display_order: 'asc' } 
                    } 
                  }
                },
                patient: true
              }
            });

            if (!session) {
              ws.send(JSON.stringify({ type: "error", message: "Session not found" }));
              break;
            }

            // Update session status to In Progress
            await prisma.assessmentSession.update({
              where: { session_id: session.session_id },
              data: { status: 'In Progress' }
            });

            // Log session start activity
            await logSessionActivity(roomId, 'session_started', {
              clinician_id: session.clinician_id,
              patient_id: session.patient_id,
              session_name: session.session_name,
              template_name: session.template?.name
            });

            // Initialize room with session items (only if not already loaded)
            const items = session.template?.session_items || [];
            
            // Only set items if not already loaded from assignTemplate
            if (!roomItemsList[roomId] || roomItemsList[roomId].length === 0) {
              roomItemsList[roomId] = items;
            } else {
              console.log(`[startSession] Using existing roomItemsList for ${roomId}, count: ${roomItemsList[roomId].length}`);
            }

            // Set first item as current (only if not already set)
            if (!roomCurrentItems[roomId] && items.length > 0) {
              const firstItem = items[0] as Record<string, unknown>;
              roomCurrentItems[roomId] = {
                ...firstItem,
                item: Number(String(firstItem['item_number'] ?? firstItem['item_id'] ?? 1)),
                question: String(firstItem['question'] ?? '')
              };
            }

            // Broadcast session started to room with the correct items from roomItemsList
            const msg = JSON.stringify({
              type: 'sessionStarted',
              sessionId: roomId,
              sessionInfo: session,
              templateItems: roomItemsList[roomId] || items, // Use cached items if available
              currentItem: roomCurrentItems[roomId],
              timestamp: new Date().toISOString()
            });
            broadcastToRoom(roomId, msg);

            await logActivity({
              user_id: session.clinician_id,
              action: 'start_assessment_session',
              entity_type: 'assessment_session',
              entity_id: session.session_id,
              description: `Started assessment session: ${data.sessionId}`
            });
          } catch (error) {
            console.error('Failed to start session:', error);
            ws.send(JSON.stringify({ type: "error", message: "Failed to start session" }));
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
            // Store full item data including image_url and all properties
            roomCurrentItems[roomId] = {
              ...nextItemRecord,
              item: nextItemId,
              question: nextQuestion
            };
            // Broadcast the full item object with all properties
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
            // Store full item data including image_url and all properties
            roomCurrentItems[roomId] = {
              ...prevItemRecord,
              item: prevItemId,
              question: prevQuestion
            };
            // Broadcast the full item object with all properties
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
          
          // Check if this is an existing session with saved state
          try {
            const existingSession = await prisma.assessmentSession.findUnique({
              where: { session_uuid: data.roomId },
              include: {
                template: {
                  include: {
                    session_items: {
                      where: { is_active: true },
                      orderBy: { display_order: 'asc' }
                    }
                  }
                },
                current_item: true,
                patient: true
              }
            });

            if (existingSession && existingSession.template) {
              // This is a resumed/existing session - load template items
              const items = existingSession.template.session_items || [];
              
              // Initialize room items if not already set
              if (!roomItemsList[data.roomId] || roomItemsList[data.roomId].length === 0) {
                roomItemsList[data.roomId] = items;
              }

              // Restore current item from database if available
              if (existingSession.current_item && !roomCurrentItems[data.roomId]) {
                roomCurrentItems[data.roomId] = {
                  ...existingSession.current_item,
                  item: existingSession.current_item.item_number || existingSession.current_item.item_id,
                  question: existingSession.current_item.question
                };
              } else if (items.length > 0 && !roomCurrentItems[data.roomId]) {
                // Fallback to first item if no current item saved
                const firstItem = items[0] as Record<string, unknown>;
                roomCurrentItems[data.roomId] = {
                  ...firstItem,
                  item: Number(String(firstItem['item_number'] ?? firstItem['item_id'] ?? 1)),
                  question: String(firstItem['question'] ?? '')
                };
              }

              // Send full session state to clinician rejoining
              if (data.role === 'clinician') {
                // Log clinician rejoin activity
                await logSessionActivity(data.roomId, 'clinician_rejoined', {
                  clinician_id: data.clinicianId,
                  session_name: existingSession.session_name
                });

                ws.send(JSON.stringify({
                  type: "sessionResumed",
                  sessionId: data.roomId,
                  sessionInfo: {
                    ...existingSession,
                    template_id: existingSession.template_id,
                    template_name: existingSession.template.name,
                    is_for_kids: existingSession.template.is_for_kids,
                    patient_name: existingSession.patient ? `${existingSession.patient.first_name} ${existingSession.patient.last_name}` : 'Unknown'
                  },
                  templateItems: items,
                  currentItem: roomCurrentItems[data.roomId],
                  timestamp: new Date().toISOString()
                }));
                console.log(`[Rejoin] Clinician rejoined session ${data.roomId} - sent full session state`);
              } else {
                // Patient rejoining active session - send sessionResumed to set sessionStarted flag
                ws.send(JSON.stringify({
                  type: "sessionResumed",
                  sessionInfo: {
                    session_uuid: existingSession.session_uuid,
                    session_name: existingSession.session_name,
                    status: existingSession.status,
                    clinician_id: existingSession.clinician_id,
                    patient_id: existingSession.patient_id,
                    is_resumed: true,
                    ...existingSession,
                    template_id: existingSession.template_id,
                    template_name: existingSession.template.name,
                    is_for_kids: existingSession.template.is_for_kids,
                    patient_name: existingSession.patient ? `${existingSession.patient.first_name} ${existingSession.patient.last_name}` : 'Unknown'
                  },
                  templateItems: items,
                  currentItem: roomCurrentItems[data.roomId],
                  timestamp: new Date().toISOString()
                }));
                console.log(`[Rejoin] Patient rejoined session ${data.roomId} - sent session resumed state`);
              }
            } else {
              // New session - just send joinedRoom
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
            }
          } catch (error) {
            console.error('Error loading session state on rejoin:', error);
            // Fallback to basic joinedRoom
            ws.send(JSON.stringify({ 
              type: "joinedRoom", 
              roomId: data.roomId,
              timestamp: new Date().toISOString()
            }));
            
            if (roomCurrentItems[data.roomId]) {
              ws.send(JSON.stringify({
                type: "changeAssessmentItem",
                item: roomCurrentItems[data.roomId],
                sessionId: data.roomId,
                timestamp: new Date().toISOString()
              }));
            }
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

            // Fetch template details including items to broadcast to all participants
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
              templateItems: template?.session_items ?? null,
              is_for_kids: template?.is_for_kids ?? false
            });

            // Notify room participants (clinician + patient)
            broadcastToRoom(data.sessionId, msg);

            // Immediately broadcast the first item so the client can render image_url before session start
            if (roomCurrentItems[data.sessionId]) {
              try {
                const initialItemMsg = JSON.stringify({
                  type: 'changeAssessmentItem',
                  item: roomCurrentItems[data.sessionId],
                  sessionId: data.sessionId,
                  timestamp: new Date().toISOString()
                });
                broadcastToRoom(data.sessionId, initialItemMsg);
              } catch (err) {
                console.warn('Failed to broadcast initial item after template assignment:', err);
              }
            }
          } catch (err) {
            console.error('Failed to assign template:', err);
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to assign template' }));
          }
          break;

        case 'setSessionPatient':
          try {
            if (!data.sessionId || !data.first_name || !data.last_name) {
              ws.send(JSON.stringify({ type: 'error', message: 'Missing required fields for setSessionPatient' }));
              break;
            }

            const session = await prisma.assessmentSession.findUnique({ 
              where: { session_uuid: data.sessionId } 
            });

            if (!session) {
              ws.send(JSON.stringify({ type: 'error', message: 'Session not found' }));
              break;
            }

            let patientId = data.patient_id ? Number(data.patient_id) : null;

            // If patient_id provided and it's an existing patient, just link it
            if (patientId && data.is_existing) {
              await prisma.assessmentSession.updateMany({
                where: { session_uuid: data.sessionId },
                data: { patient_id: patientId }
              });

              const patient = await prisma.patient.findUnique({ 
                where: { patient_id: patientId } 
              });

              if (patient) {
                broadcastToRoom(data.sessionId, JSON.stringify({
                  type: 'patientSet',
                  sessionId: data.sessionId,
                  patient: {
                    patient_id: patient.patient_id,
                    first_name: patient.first_name,
                    last_name: patient.last_name,
                    age: patient.age,
                    gender: patient.gender,
                  },
                }));
              }
            } else {
              // Create a temporary patient record (will be updated after session completion)
              const dob = new Date();
              dob.setFullYear(dob.getFullYear() - 30); // Default age

              const newPatient = await prisma.patient.create({
                data: {
                  first_name: String(data.first_name),
                  last_name: String(data.last_name),
                  date_of_birth: dob,
                  assigned_clinician_id: session.clinician_id,
                  is_active: true,
                  notes: `Temp record - Session ${data.sessionId}`,
                }
              });

              patientId = newPatient.patient_id;

              await prisma.assessmentSession.updateMany({
                where: { session_uuid: data.sessionId },
                data: { patient_id: patientId }
              });

              broadcastToRoom(data.sessionId, JSON.stringify({
                type: 'patientSet',
                sessionId: data.sessionId,
                patient: {
                  patient_id: newPatient.patient_id,
                  first_name: newPatient.first_name,
                  last_name: newPatient.last_name,
                },
              }));
            }

            await logActivity({
              user_id: session.clinician_id,
              action: 'set_session_patient',
              entity_type: 'session',
              entity_id: session.session_id,
              description: `Patient ${data.first_name} ${data.last_name} associated with session ${data.sessionId}`,
            });
          } catch (err) {
            console.error('Failed to set session patient:', err);
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to set session patient' }));
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

        case 'completeSession': {
          try {
            if (!data.sessionId) {
              ws.send(JSON.stringify({ type: 'error', message: 'Missing sessionId for completeSession' }));
              break;
            }
            await prisma.assessmentSession.updateMany({
              where: { session_uuid: data.sessionId },
              data: { status: 'Completed', end_time: new Date() }
            });
            const msg = JSON.stringify({ type: 'sessionCompleted', sessionId: data.sessionId, timestamp: new Date().toISOString() });
            broadcastToRoom(data.sessionId, msg);
          } catch (err) {
            console.error('Failed to complete session:', err);
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to complete session' }));
          }
          break;
        }
        case 'finalizePatient': {
          try {
            console.log('[finalizePatient] Received data:', { 
              sessionId: data.sessionId, 
              first_name: data.first_name, 
              last_name: data.last_name,
              age: data.age,
              gender: data.gender
            });
            
            if (!data.sessionId || !data.first_name || !data.last_name) {
              console.log('[finalizePatient] Missing required fields');
              ws.send(JSON.stringify({ type: 'error', message: 'Missing fields for finalizePatient' }));
              break;
            }
            
            const session = await prisma.assessmentSession.findUnique({ where: { session_uuid: data.sessionId } });
            if (!session) { 
              console.log('[finalizePatient] Session not found:', data.sessionId);
              ws.send(JSON.stringify({ type: 'error', message: 'Session not found' })); 
              break; 
            }
            
            console.log('[finalizePatient] Found session:', { 
              session_id: session.session_id, 
              clinician_id: session.clinician_id,
              existing_patient_id: session.patient_id 
            });
            
            let patientId = session.patient_id;
            
            // Calculate date_of_birth from age if provided, otherwise use a reasonable default
            let dob = new Date();
            if (data.age && Number(data.age) > 0) {
              const age = Number(data.age);
              dob = new Date();
              dob.setFullYear(dob.getFullYear() - age);
            } else {
              // Default to 30 years ago if no age provided
              dob.setFullYear(dob.getFullYear() - 30);
            }
            
            if (!patientId) {
              console.log('[finalizePatient] Creating new patient record');
              // create new patient record
              const newPatient = await prisma.patient.create({
                data: {
                  first_name: String(data.first_name),
                  last_name: String(data.last_name),
                  date_of_birth: dob,
                  age: data.age ? Number(data.age) : null,
                  gender: data.gender ? String(data.gender) : null,
                  notes: data.notes ? String(data.notes) : null,
                  assigned_clinician_id: session.clinician_id,
                  is_active: true
                }
              });
              patientId = newPatient.patient_id;
              console.log('[finalizePatient] Created patient:', { patient_id: patientId });
              
              await prisma.assessmentSession.update({
                where: { session_uuid: data.sessionId },
                data: { patient_id: patientId }
              });
              console.log('[finalizePatient] Updated session with patient_id');
            } else {
              console.log('[finalizePatient] Updating existing patient:', patientId);
              // update existing temp patient
              await prisma.patient.update({
                where: { patient_id: patientId },
                data: {
                  first_name: String(data.first_name),
                  last_name: String(data.last_name),
                  date_of_birth: dob,
                  age: data.age ? Number(data.age) : null,
                  gender: data.gender ? String(data.gender) : null,
                  notes: data.notes ? String(data.notes) : null,
                  assigned_clinician_id: session.clinician_id,
                  is_active: true
                }
              });
              console.log('[finalizePatient] Patient updated successfully');
            }
            
            const patientInfo = await prisma.patient.findUnique({ where: { patient_id: patientId } });
            console.log('[finalizePatient] Final patient info:', { 
              patient_id: patientInfo?.patient_id,
              name: `${patientInfo?.first_name} ${patientInfo?.last_name}`,
              assigned_clinician_id: patientInfo?.assigned_clinician_id
            });
            
            // Broadcast to entire room so clinician also receives the update
            const finalizeMessage = JSON.stringify({ 
              type: 'patientFinalized', 
              patientInfo,
              sessionId: data.sessionId
            });
            broadcastToRoom(data.sessionId, finalizeMessage);
            console.log('[finalizePatient] Broadcasted patientFinalized message');
            
            await logActivity({
              user_id: session.clinician_id,
              action: 'finalize_patient',
              entity_type: 'patient',
              entity_id: patientId,
              description: `Patient finalized: ${data.first_name} ${data.last_name} for session ${data.sessionId}`
            });
          } catch (err) {
            console.error('[finalizePatient] ERROR:', err);
            ws.send(JSON.stringify({ type: 'error', message: 'Failed to finalize patient' }));
          }
          break;
        }
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
          try {
            console.log('[submitResponse] Received response submission:', {
              sessionId: data.sessionId,
              itemId: data.item?.item,
              response: data.response
            });

            const session = await prisma.assessmentSession.findUnique({
              where: { session_uuid: data.sessionId }
            });
            
            if (!session) {
              console.error('[submitResponse] Session not found:', data.sessionId);
              ws.send(JSON.stringify({ 
                type: 'error', 
                message: 'Session not found',
                details: 'Cannot save response - session does not exist'
              }));
              break;
            }
            
            await saveSessionResponse(data.sessionId, data.item, data.response);
            
            console.log('[submitResponse] Response saved successfully for item:', data.item?.item);
            
            // Notify clinician of response submission
            const responseMessage = JSON.stringify({
              type: "responseSubmitted",
              sessionId: data.sessionId,
              itemId: data.item.item,
              response: data.response,
              timestamp: new Date().toISOString()
            });
            
            broadcastToRoom(data.sessionId, responseMessage, ws);
          } catch (error) {
            console.error('Failed to submit response:', error);
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Failed to save response',
              details: error instanceof Error ? error.message : 'Unknown error'
            }));
          }
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
            // Get session with template items
            const session = await prisma.assessmentSession.findUnique({
              where: { session_uuid: data.sessionId },
              include: {
                template: {
                  include: {
                    session_items: {
                      where: { is_active: true },
                      orderBy: { display_order: 'asc' }
                    }
                  }
                },
                current_item: true
              }
            });

            if (!session) {
              console.error('Session not found for resume:', data.sessionId);
              break;
            }

            // Update session status
            await prisma.assessmentSession.update({
              where: { session_uuid: data.sessionId },
              data: { status: 'In Progress' }
            });

            // Initialize room items if not already set
            const items = session.template?.session_items || [];
            if (!roomItemsList[data.sessionId]) {
              roomItemsList[data.sessionId] = items;
            }

            // Set current item (use saved current_item or first item)
            let currentItem = null;
            if (session.current_item) {
              currentItem = {
                ...session.current_item,
                item: session.current_item.item_number || session.current_item.item_id,
                question: session.current_item.question
              };
              roomCurrentItems[data.sessionId] = currentItem;
            } else if (items.length > 0) {
              const firstItem = items[0] as Record<string, unknown>;
              currentItem = {
                ...firstItem,
                item: Number(String(firstItem['item_number'] ?? firstItem['item_id'] ?? 1)),
                question: String(firstItem['question'] ?? '')
              };
              roomCurrentItems[data.sessionId] = currentItem;
            }

            const resumeMessage = JSON.stringify({
              type: "sessionResumed",
              sessionId: data.sessionId,
              sessionInfo: session,
              templateItems: items,
              currentItem: currentItem,
              timestamp: new Date().toISOString()
            });
            
            broadcastToRoom(data.sessionId, resumeMessage);
          } catch (error) {
            console.error('Failed to resume session:', error);
          }
          break;

        case "endSession":
          try {
            const session = await prisma.assessmentSession.updateMany({
              where: { session_uuid: data.sessionId },
              data: { 
                status: 'Completed',
                end_time: new Date(),
                post_session_notes: data.notes,
                session_summary: data.summary
              }
            });

            // Get the session details for logging
            const sessionDetails = await prisma.assessmentSession.findFirst({
              where: { session_uuid: data.sessionId }
            });

            console.log(`[endSession] Session ${data.sessionId} marked as Completed`);

            // Log session end activity
            await logSessionActivity(data.sessionId, 'session_ended', {
              clinician_id: sessionDetails?.clinician_id,
              end_time: new Date().toISOString(),
              has_notes: !!data.notes,
              has_summary: !!data.summary
            });

            // Broadcast both sessionEnded (for clinician) and sessionCompleted (for patient)
            const endMessage = JSON.stringify({
              type: "sessionEnded",
              sessionId: data.sessionId,
              summary: data.summary,
              timestamp: new Date().toISOString()
            });
            
            const completedMessage = JSON.stringify({
              type: "sessionCompleted",
              sessionId: data.sessionId,
              timestamp: new Date().toISOString()
            });
            
            broadcastToRoom(data.sessionId, endMessage);
            broadcastToRoom(data.sessionId, completedMessage);

            if (sessionDetails) {
              await logActivity({
                user_id: sessionDetails.clinician_id,
                action: 'end_session',
                entity_type: 'assessment_session',
                entity_id: sessionDetails.session_id,
                description: `Assessment session completed: ${data.sessionId}`
              });
            }
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