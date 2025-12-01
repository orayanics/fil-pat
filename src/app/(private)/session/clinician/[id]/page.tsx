"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useSocketContext } from "@/context/SocketProvider";
import Session from "@/modules/session/clinician";

export default function SessionPage() {
  const params = useParams();
  const sessionIdFromUrl = params?.id as string;
  const { sessionId, setSessionId, joinRoom, hasJoinedRoom, isConnected, user } = useSocketContext();

  // Sync URL session ID with context
  useEffect(() => {
    if (sessionIdFromUrl && sessionIdFromUrl !== sessionId) {
      console.log('[SessionPage] Syncing sessionId from URL:', sessionIdFromUrl);
      setSessionId(sessionIdFromUrl);
    }
  }, [sessionIdFromUrl, sessionId, setSessionId]);

  // Join the room when URL changes and we're not already in it
  useEffect(() => {
    if (sessionIdFromUrl && isConnected && !hasJoinedRoom) {
      console.log('[SessionPage] Joining room from URL:', sessionIdFromUrl);
      const role = user ? 'clinician' : 'patient';
      joinRoom(sessionIdFromUrl, role);
    }
  }, [sessionIdFromUrl, isConnected, hasJoinedRoom, joinRoom, user]);

  return <Session />;
}
