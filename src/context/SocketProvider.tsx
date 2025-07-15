"use client";
import { createContext, useContext } from "react";
import useWebSocket from "@/lib/useWebSocket";
interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (message: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { socket, isConnected } = useWebSocket();

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        sendMessage: (message) => socket?.send(message),
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within a SocketProvider");
  }
  return context;
}
