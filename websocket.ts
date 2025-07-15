import { WebSocketServer } from "ws";

const port = process.env.WEBSOCKET_PORT
  ? parseInt(process.env.WEBSOCKET_PORT, 10)
  : 8080;
const host = process.env.WEBSOCKET_HOST || "localhost";

const wss = new WebSocketServer({ port, host });

// broadcast qrData and sessionId to all connected clients
const broadcastQrData = (qrData: string, sessionId: string) => {
  const message = JSON.stringify({
    type: "sendQrData",
    qrData,
    sessionId,
  });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      // declare message data type here
      switch (data.type) {
        case "sendQrData":
          broadcastQrData(data.qrData, data.sessionId);
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
  });
});

console.log(`WebSocket server running on ws://${host}:${port}`);
