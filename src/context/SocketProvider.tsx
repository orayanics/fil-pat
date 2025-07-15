"use client";
import { createContext, useContext, useState, useEffect } from "react";
import useWebSocket from "@/lib/useWebSocket";
interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sessionId: string | null;
  sendMessage: (message: string) => void;
  currentItem: any | null;
  joinRoom: () => void;
}

import { useParams } from "next/navigation";

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { socket, isConnected } = useWebSocket();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<any | null>(null);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      setSessionId(id as string);
    }
  }, [id]);

  // Central message handling
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "changeAssessmentItem") {
          setCurrentItem(data.item);
        } else if (data.type === "joinedRoom") {
          // TODO: Pop up notification
          setHasJoinedRoom(true);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket]);

  const joinRoom = () => {
    if (
      socket &&
      sessionId &&
      socket.readyState === WebSocket.OPEN &&
      !hasJoinedRoom
    ) {
      socket.send(
        JSON.stringify({
          type: "joinRoom",
          roomId: sessionId,
        })
      );
    }
  };

  // auto-join room
  useEffect(() => {
    joinRoom();
  }, [socket, sessionId, isConnected]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        sessionId,
        currentItem,
        joinRoom,
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
