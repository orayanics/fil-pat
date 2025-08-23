let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 1000;
let currentSessionId: string | null = null;

export function initWebSocket(sessionId?: string): WebSocket {
  if (sessionId) {
    currentSessionId = sessionId;
  }

  if (!socket || socket.readyState === WebSocket.CLOSED) {
    const hostname = window.location.hostname;
    const port = 8080;
    const wsUrl = `ws://${hostname}:${port}`;
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
      reconnectAttempts = 0;

      if (currentSessionId) {
        socket?.send(
          JSON.stringify({
            type: "joinRoom",
            roomId: currentSessionId,
          })
        );
      }
    };

    socket.onclose = () => {
      console.log("❌ WebSocket disconnected");
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        setTimeout(() => {
          initWebSocket();
        }, reconnectDelay * reconnectAttempts);
      }
    };

    socket.onerror = (err) => {
      console.error("WebSocket error:", err);
    };
  }
  return socket;
}

export function getSocket(): WebSocket | null {
  return socket;
}

export function disconnectWebSocket() {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.close();
    socket = null;
  }
}
