import { WebSocketServer, WebSocket } from "ws";

const port = process.env.WEBSOCKET_PORT
  ? parseInt(process.env.WEBSOCKET_PORT, 10)
  : 8080;
const host = process.env.WEBSOCKET_HOST || "localhost";

const wss = new WebSocketServer({ port, host });

const rooms: Record<string, Set<WebSocket>> = {};
const roomCurrentItems: Record<string, unknown> = {};

// Broadcast message to all clients in a specific room
const broadcastToRoom = (roomId: string, message: string) => {
  const clients = rooms[roomId];
  if (clients) {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        console.log(`Broadcasting to room ${roomId}:`, message);
        client.send(message);
      }
    });
  }
};

// Broadcast qrData and sessionId to all connected clients in a room
const broadcastQrData = (qrData: string, sessionId: string) => {
  const message = JSON.stringify({
    type: "sendQrData",
    qrData,
    sessionId,
  });

  broadcastToRoom(sessionId, message);
};

// Broadcast assessment item changes to all connected clients in a room
const broadcastAssessmentItemChange = (item: unknown, sessionId: string) => {
  console.log("Broadcasting assessment item change:", {
    item,
    sessionId,
  });
  roomCurrentItems[sessionId] = item;

  const message = JSON.stringify({
    type: "changeAssessmentItem",
    item,
    sessionId,
  });

  broadcastToRoom(sessionId, message);
};

// Room Management
const joinRoom = (ws: WebSocket, roomId: string) => {
  if (!rooms[roomId]) {
    rooms[roomId] = new Set();
  }
  rooms[roomId].add(ws);
  console.log(`Client joined room: ${roomId}`);
};

const leaveRoom = (ws: WebSocket, roomId: string) => {
  const clients = rooms[roomId];
  if (clients) {
    clients.delete(ws);
    console.log(`Client left room: ${roomId}`);
    if (clients.size === 0) {
      delete rooms[roomId];
      delete roomCurrentItems[roomId];
      console.log(`Room ${roomId} has been deleted due to no clients.`);
    }
  }
};

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case "joinRoom":
          joinRoom(ws, data.roomId);
          ws.send(JSON.stringify({ type: "joinedRoom", roomId: data.roomId }));
          if (roomCurrentItems[data.roomId]) {
            console.log(
              `Sending current item to new client in room ${data.roomId}:`,
              roomCurrentItems[data.roomId]
            );
            ws.send(
              JSON.stringify({
                type: "changeAssessmentItem",
                item: roomCurrentItems[data.roomId],
                sessionId: data.roomId,
              })
            );
          }
          break;
        case "leaveRoom":
          leaveRoom(ws, data.roomId);
          ws.send(JSON.stringify({ type: "leftRoom", roomId: data.roomId }));
          break;
        case "sendQrData":
          broadcastQrData(data.qrData, data.sessionId);
          break;
        case "changeAssessmentItem":
          broadcastAssessmentItemChange(data.item, data.sessionId);
          break;

        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    // Remove client from all rooms
    for (const roomId in rooms) {
      if (rooms[roomId].has(ws)) {
        leaveRoom(ws, roomId);
      }
    }
  });
});

console.log(`WebSocket server running on ws://${host}:${port}`);
