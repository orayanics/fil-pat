"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useSocketContext } from "@/context/SocketProvider";
import Session from "@/modules/session/patient";

export default function SessionPage() {
  const params = useParams();
  const sessionIdFromUrl = params?.id as string;
  const { sessionId, setSessionId, joinRoom, hasJoinedRoom, isConnected } = useSocketContext();

  // Sync URL session ID with context
  useEffect(() => {
    if (sessionIdFromUrl && sessionIdFromUrl !== sessionId) {
      console.log('[PatientPage] Syncing sessionId from URL:', sessionIdFromUrl);
      setSessionId(sessionIdFromUrl);
    }
  }, [sessionIdFromUrl, sessionId, setSessionId]);

  // Join the room when URL changes and we're not already in it
  useEffect(() => {
    if (sessionIdFromUrl && isConnected && !hasJoinedRoom) {
      console.log('[PatientPage] Joining room from URL:', sessionIdFromUrl);
      joinRoom(sessionIdFromUrl, 'patient');
    }
  }, [sessionIdFromUrl, isConnected, hasJoinedRoom, joinRoom]);

  return <Session />;
}
