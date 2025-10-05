import { WebSocketServer, WebSocket } from "ws";
import { prisma } from "./src/lib/database/client";
import { logActivity } from "./src/lib/auth/auth";
import QRCode from "qrcode";

const port = process.env.WEBSOCKET_PORT
  ? parseInt(process.env.WEBSOCKET_PORT, 10)
  : 8080;
const host = process.env.WEBSOCKET_HOST || "localhost";
const BASE_URL = process.env.NEXT_PUBLIC_ASSESSMENT_BASE_URL || "http://localhost:3000";

const wss = new WebSocketServer({ port, host });

// Enhanced room management with database tracking
const rooms: Record<string, Set<WebSocket>> = {};
const roomCurrentItems: Record<string, any> = {};
const connectionMap: Map<WebSocket, { 
  connectionId: string;
  userId?: number;
  userType: string;
  sessionId?: string;
  roomId?: string;
  ipAddress?: string;
}> = new Map();

// =============================================
// DATABASE HELPERS
// =============================================

async function createWebSocketConnection(ws: WebSocket, data: any) {
  try {
    const connectionId = Math.random().toString(36).substring(2, 15);
    
    const connection = await prisma.webSocketConnection.create({
      data: {
        connection_uuid: connectionId,
        session_id: data.sessionId ? parseInt(data.sessionId) : null,
        user_id: data.userId || null,
        user_type: data.userType || 'clinician',
        ip_address: data.ipAddress,
        user_agent: data.userAgent,
        room_id: data.roomId,
        role_in_session: data.role || 'participant'
      }
    });

    connectionMap.set(ws, {
      connectionId,
      userId: data.userId,
      userType: data.userType || 'clinician',
      sessionId: data.sessionId,
      roomId: data.roomId,
      ipAddress: data.ipAddress
    });

    await logActivity({
      user_id: data.userId,
      action: 'websocket_connect',
      description: `WebSocket connection established for ${data.userType}`,
      session_uuid: connectionId,
      ip_address: data.ipAddress
    });

    return connection;
  } catch (error) {
    console.error('Failed to create WebSocket connection record:', error);
  }
}

async function updateWebSocketConnection(ws: WebSocket, updates: any) {
  try {
    const connectionData = connectionMap.get(ws);
    if (!connectionData) return;

    await prisma.webSocketConnection.update({
      where: { connection_uuid: connectionData.connectionId },
      data: {
        ...updates,
        last_activity: new Date()
      }
    });

    // Update local connection map
    connectionMap.set(ws, {
      ...connectionData,
      ...updates
    });
  } catch (error) {
    console.error('Failed to update WebSocket connection:', error);
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

async function createOrUpdateAssessmentSession(data: any) {
  try {
    // Check if session already exists
    let session = await prisma.assessmentSession.findUnique({
      where: { session_uuid: data.sessionId }
    });

    if (!session) {
      // Get default template
      const template = await prisma.assessmentTemplate.findFirst({
        where: { is_default: true },
        include: { session_items: true }
      });

      if (!template) {
        throw new Error('No default template found');
      }

      session = await prisma.assessmentSession.create({
        data: {
          session_uuid: data.sessionId,
          patient_id: data.patientId || 1, // Temporary - will be updated when patient joins
          clinician_id: data.clinicianId || 1,
          template_id: template.template_id,
          session_name: `Session ${data.sessionId}`,
          session_date: new Date(),
          session_mode: data.isKidsMode ? 'Kids' : 'Standard',
          status: 'Scheduled',
          total_items: template.session_items.length,
          websocket_room_id: data.roomId
        }
      });

      await logActivity({
        user_id: data.clinicianId,
        action: 'create_session',
        entity_type: 'assessment_session',
        entity_id: session.session_id,
        description: `Created new assessment session: ${session.session_uuid}`,
        new_values: { session_uuid: session.session_uuid, template_id: template.template_id }
      });
    }

    return session;
  } catch (error) {
    console.error('Failed to create/update assessment session:', error);
    return null;
  }
}

async function updateSessionProgress(sessionId: string, itemData: any) {
  try {
    const session = await prisma.assessmentSession.findUnique({
      where: { session_uuid: sessionId }
    });

    if (!session) return;

    await prisma.assessmentSession.update({
      where: { session_uuid: sessionId },
      data: {
        current_item_id: itemData.item,
        completed_items: itemData.item - 1, // Assuming sequential progression
        status: 'In Progress'
      }
    });

    await logActivity({
      user_id: session.clinician_id,
      action: 'update_session_progress',
      entity_type: 'assessment_session',
      entity_id: session.session_id,
      description: `Session progress updated to item ${itemData.item}`,
      new_values: { current_item: itemData.item }
    });
  } catch (error) {
    console.error('Failed to update session progress:', error);
  }
}

async function saveSessionResponse(sessionId: string, itemData: any, responseData: any) {
  try {
    const session = await prisma.assessmentSession.findUnique({
      where: { session_uuid: sessionId }
    });

    if (!session) return;

    await prisma.sessionResponse.create({
      data: {
        session_id: session.session_id,
        session_item_id: itemData.item,
        response_text: responseData.response,
        response_audio_path: responseData.audioPath,
        is_correct: responseData.isCorrect,
        score: responseData.score,
        max_possible_score: itemData.max_score || 1.0,
        time_taken_seconds: responseData.timeTaken,
        clinician_notes: responseData.notes
      }
    });

    await logActivity({
      user_id: session.clinician_id,
      action: 'save_response',
      entity_type: 'session_response',
      entity_id: session.session_id,
      description: `Response saved for item ${itemData.item}`,
      new_values: { item_id: itemData.item, score: responseData.score }
    });
  } catch (error) {
    console.error('Failed to save session response:', error);
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

const broadcastAssessmentItemChange = async (item: any, sessionId: string) => {
  roomCurrentItems[sessionId] = item;

  const message = JSON.stringify({
    type: "changeAssessmentItem",
    item,
    sessionId,
    timestamp: new Date().toISOString()
  });

  broadcastToRoom(sessionId, message);

  // Update session progress in database
  await updateSessionProgress(sessionId, item);
};

// =============================================
// ENHANCED ROOM MANAGEMENT
// =============================================

const joinRoom = async (ws: WebSocket, roomId: string, userData?: any) => {
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
        roomCurrentItems[roomId] = template.session_items[0];
      }
    } catch (error) {
      console.error('Failed to load default session items:', error);
      // Fallback to hardcoded data if database fails
      roomCurrentItems[roomId] = { item: 1, question: "Starting session..." };
    }

    // Create session record
    await createOrUpdateAssessmentSession({
      sessionId: roomId,
      roomId: roomId,
      clinicianId: userData?.clinicianId,
      patientId: userData?.patientId,
      isKidsMode: userData?.isKidsMode || false
    });
  }

  rooms[roomId].add(ws);
  
  // Update connection record
  await updateWebSocketConnection(ws, {
    room_id: roomId,
    role_in_session: userData?.role || 'participant'
  });

  console.log(`Client joined room: ${roomId}, total clients: ${rooms[roomId].size}`);
};

const leaveRoom = async (ws: WebSocket, roomId: string) => {
  const clients = rooms[roomId];
  if (clients) {
    clients.delete(ws);
    console.log(`Client left room: ${roomId}`);
    
    if (clients.size === 0) {
      delete rooms[roomId];
      delete roomCurrentItems[roomId];
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
  }
};

// =============================================
// WEBSOCKET CONNECTION HANDLING
// =============================================

wss.on("connection", async (ws, request) => {
  const clientIP = request.socket.remoteAddress;
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
            userId: data.userId,
            userType: data.userType,
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

        case "joinRoom":
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