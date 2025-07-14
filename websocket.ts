import { WebSocketServer } from "ws";

const port = process.env.WEBSOCKET_PORT
  ? parseInt(process.env.WEBSOCKET_PORT, 10)
  : 8080;
const host = process.env.WEBSOCKET_HOST || "localhost";

const wss = new WebSocketServer({ port, host });

// Counter state
let counter = 0;

// Function to broadcast counter to all connected clients
function broadcastCounter() {
  const message = JSON.stringify({ type: "counter", value: counter });
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Send current counter value to newly connected client
  ws.send(JSON.stringify({ type: "counter", value: counter }));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`Received message:`, data);

      // Handle different message types
      switch (data.type) {
        case "increment":
          counter++;
          broadcastCounter();
          break;
        case "decrement":
          counter--;
          broadcastCounter();
          break;
        case "reset":
          counter = 0;
          broadcastCounter();
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
