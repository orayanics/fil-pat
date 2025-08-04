let socket: WebSocket | null = null;

export function initWebSocket(): WebSocket {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    const hostname = window.location.hostname;
    const port = 8080;
    const wsUrl = `ws://${hostname}:${port}`;
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    socket.onclose = () => {
      console.log("❌ WebSocket disconnected");
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
