import { useEffect, useState } from "react";
import { initWebSocket, getSocket } from "./websocketClient";

export default function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = initWebSocket();

    const checkOpen = () => {
      if (socket.readyState === WebSocket.OPEN) {
        setIsConnected(true);
      } else {
        socket.addEventListener("open", () => setIsConnected(true));
      }
    };

    checkOpen();

    return () => {
      // Don't close the socket here to keep it alive globally
    };
  }, []);

  return { socket: getSocket(), isConnected };
}
