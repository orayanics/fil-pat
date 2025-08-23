import {useEffect, useState} from "react";
import {initWebSocket, getSocket} from "./websocketClient";

export default function useWebSocket(sessionId?: string) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = initWebSocket(sessionId);

    const handleOpen = () => setIsConnected(true);
    const handleClose = () => setIsConnected(false);
    const handleError = () => setIsConnected(false);

    const checkOpen = () => {
      if (socket.readyState === WebSocket.OPEN) {
        setIsConnected(true);
      } else {
        socket.addEventListener("open", handleOpen);
        socket.addEventListener("close", handleClose);
        socket.addEventListener("error", handleError);
      }
    };

    checkOpen();

    return () => {
      // clean event, but keep socket alive globally
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("close", handleClose);
      socket.removeEventListener("error", handleError);
    };
  }, [sessionId]);

  return {socket: getSocket(), isConnected};
}
