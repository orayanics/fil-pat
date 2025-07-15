import { useState, useRef, useEffect } from "react";

export default function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (socketRef.current) return;
    const webSocket = new WebSocket("ws://localhost:8080");
    socketRef.current = webSocket;

    socketRef.current.onopen = () => setIsConnected(true);
    socketRef.current.onclose = () => setIsConnected(false);
    socketRef.current.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };
    return () => {
      socketRef.current?.close();
    };
  }, []);

  return { socket: socketRef.current, isConnected };
}
