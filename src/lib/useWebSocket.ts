import { useState, useRef, useEffect } from "react";

export default function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (socketRef.current || typeof window === "undefined") return;

    const hostname = window.location.hostname; // use LAN IP, not localhost
    const port = 8080;
    //const path = "/api/websocket"; // optional path, only if your server uses one

    const wsUrl = `ws://${hostname}:${port}`;
    const webSocket = new WebSocket(wsUrl);

    socketRef.current = webSocket;

    webSocket.onopen = () => setIsConnected(true);
    webSocket.onclose = () => setIsConnected(false);
    webSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    return () => {
      webSocket.close();
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
