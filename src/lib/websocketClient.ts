let socket: WebSocket | null = null;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const reconnectDelay = 1000;

export function initWebSocket(): WebSocket {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    const hostname = window.location.hostname;
    const port = 8080;
    const wsUrl = `ws://${hostname}:${port}`;
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      reconnectAttempts = 0;
    };

    socket.onclose = () => {
      // reconnect attemp
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(
          `🔄 Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts})...`
        );
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
