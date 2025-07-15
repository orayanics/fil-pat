"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { useParams } from "next/navigation";

import useWebSocket from "@/lib/useWebSocket";
import type { SocketContextType, AssessmentItem } from "@/models/context";

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { socket, isConnected } = useWebSocket();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentItem, setCurrentItem] = useState<AssessmentItem | null>(null);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [qrData, setQrData] = useState<{
    qrData: string;
    sessionId: string;
  } | null>(null);
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
        switch (data.type) {
          case "sendQrData":
            setQrData({ qrData: data.qrData, sessionId: data.sessionId });
            break;
          case "changeAssessmentItem":
            setCurrentItem(data.item);
            break;
          case "joinedRoom":
            // TODO: Pop up notification
            setHasJoinedRoom(true);
            break;
          default:
            console.warn("Unhandled message type:", data.type);
            break;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, sessionId, isConnected]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        sessionId,
        currentItem,
        qrData,
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
