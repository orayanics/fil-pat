import {WebSocketServer, WebSocket} from "ws";
import {sampleData} from "./src/data/data";

const port = process.env.WEBSOCKET_PORT
  ? parseInt(process.env.WEBSOCKET_PORT, 10)
  : 8080;
const host = process.env.WEBSOCKET_HOST || "0.0.0.0";

const wss = new WebSocketServer({port, host});

// room helpers
const rooms: Record<string, Set<WebSocket>> = {};
const roomDeletionTimers: Record<string, NodeJS.Timeout> = {};
const ROOM_GRACE_PERIOD = 5 * 60 * 1000;

// patient list as a record for reliable lookup and removal
const patientList: Record<string, {patientId: string; patientName: string}> =
  {};
const patientMap: Record<string, Set<WebSocket>> = {};

// session room data
const roomCurrentItems: Record<string, unknown> = {};
const roomFormData: Record<string, unknown> = {};

// message to all clients in a specific room
const broadcastToRoom = (roomId: string, message: string) => {
  const clients = rooms[roomId];
  if (clients) {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
};

// qrData and sessionId to all connected clients in a room
const broadcastQrData = (qrData: string, sessionId: string) => {
  const message = JSON.stringify({
    type: "sendQrData",
    qrData,
    sessionId,
  });

  broadcastToRoom(sessionId, message);
};

// assessment item changes to all connected clients in a room
const broadcastAssessmentItemChange = (item: unknown, sessionId: string) => {
  roomCurrentItems[sessionId] = item;

  const message = JSON.stringify({
    type: "changeAssessmentItem",
    item,
    sessionId,
  });

  broadcastToRoom(sessionId, message);
};

// form data changes to all connected clients in a room
const broadcastFormDataChange = (formData: unknown, sessionId: string) => {
  roomFormData[sessionId] = formData;

  const message = JSON.stringify({
    type: "updateFormData",
    formData,
    sessionId,
  });

  broadcastToRoom(sessionId, message);
};

const sendRoomState = (ws: WebSocket, roomId: string) => {
  // current item and form data if exists
  // session persistence
  if (roomCurrentItems[roomId]) {
    ws.send(
      JSON.stringify({
        type: "changeAssessmentItem",
        item: roomCurrentItems[roomId],
        sessionId: roomId,
      })
    );
  }

  if (roomFormData[roomId]) {
    ws.send(
      JSON.stringify({
        type: "updateFormData",
        formData: roomFormData[roomId],
        sessionId: roomId,
      })
    );
  }
};

// Room Management
const joinRoom = (ws: WebSocket, roomId: string) => {
  const isNewRoom = !rooms[roomId];

  if (roomDeletionTimers[roomId]) {
    clearTimeout(roomDeletionTimers[roomId]);
    delete roomDeletionTimers[roomId];
  }

  if (isNewRoom) {
    rooms[roomId] = new Set<WebSocket>();
    // set data if room is new (no existing data)
    if (!roomCurrentItems[roomId]) {
      roomCurrentItems[roomId] = {item: sampleData[0], sessionId: roomId};
    }
    if (!roomFormData[roomId]) {
      roomFormData[roomId] = {};
    }
  }

  rooms[roomId].add(ws);
  console.log(
    `Client joined room: ${roomId}, total clients: ${rooms[roomId].size}`
  );
};

const leaveRoom = (ws: WebSocket, roomId: string) => {
  const clients = rooms[roomId];
  if (clients) {
    clients.delete(ws);

    if (clients.size === 0) {
      // grace period timer start
      roomDeletionTimers[roomId] = setTimeout(() => {
        // verify room is empty before deletion
        if (!rooms[roomId] || rooms[roomId].size === 0) {
          delete rooms[roomId];
          delete roomCurrentItems[roomId];
          delete roomFormData[roomId];
          delete roomDeletionTimers[roomId];
          console.log(`Room ${roomId} deleted after grace period`);
        }
      }, ROOM_GRACE_PERIOD);
    }
  }
};

// Patient List Management
function joinPatient(ws: WebSocket, patientId: string, patientName: string) {
  patientList[patientId] = {patientId, patientName};

  if (!patientMap[patientId]) {
    patientMap[patientId] = new Set();
  }

  patientMap[patientId].add(ws);

  return {
    patientId,
    patientName,
  };
}

function leavePatient(ws: WebSocket) {
  for (const [patientId, sockets] of Object.entries(patientMap)) {
    if (sockets.has(ws)) {
      sockets.delete(ws);

      if (sockets.size === 0) {
        delete patientMap[patientId];
        delete patientList[patientId];
      }
      break;
    }
  }
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case "addPatient": {
          const {patientName, patientId} = data;
          const isReconnect = patientMap[patientId]?.size > 0;

          joinPatient(ws, patientId, patientName);
          joinRoom(ws, patientId);

          ws.send(
            JSON.stringify({
              type: isReconnect ? "patientRejoined" : "patientAdded",
              patientId,
              patientName,
            })
          );
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(
                JSON.stringify({type: "updatePatientList", patientList})
              );
            }
          });
          break;
        }
        case "joinRoom":
          joinRoom(ws, data.roomId);
          ws.send(JSON.stringify({type: "joinedRoom", roomId: data.roomId}));
          sendRoomState(ws, data.roomId);
          break;
        case "sendQrData":
          broadcastQrData(data.qrData, data.sessionId);
          break;
        case "changeAssessmentItem":
          broadcastAssessmentItemChange(data.item, data.sessionId);
          break;
        case "updateFormData":
          broadcastFormDataChange(data.formData, data.sessionId);
          break;
        case "requestRoomState":
          sendRoomState(ws, data.roomId);
          break;
        case "requestPatientList": {
          ws.send(JSON.stringify({type: "updatePatientList", patientList}));
          break;
        }
        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    for (const roomId in rooms) {
      if (rooms[roomId].has(ws)) {
        leaveRoom(ws, roomId);
      }
    }

    leavePatient(ws);

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            type: "updatePatientList",
            patientList,
          })
        );
      }
    });
  });
});

console.log(`WebSocket server running on ws://${host}:${port}`);
