"use client";

import {createContext, useContext, useState, useEffect} from "react";
import {useParams} from "next/navigation";
import {AlertFail} from "@/components/Alert";

import {
  persistSessionData,
  loadSessionData,
  cleanupOldSessions,
} from "@/lib/sessionPersistence";
import useWebSocket from "@/lib/useWebSocket";

import type {
  SocketDispatch,
  SocketState,
  AssessmentItem,
} from "@/models/context";

// split context to avoid unnecessary re-renders
const SocketStateContext = createContext<SocketState | undefined>(undefined);
const SocketDispatchContext = createContext<SocketDispatch | undefined>(
  undefined
);

// const SocketContext = createContext<SocketContextType | undefined>(undefined);

export default function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {id} = useParams();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const {socket, isConnected} = useWebSocket(sessionId || undefined);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);

  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [currentItem, setCurrentItem] = useState<AssessmentItem | null>(null);
  const [qrData, setQrData] = useState<{
    qrData: string;
    sessionId: string;
  } | null>(null);
  const [patientList, setPatientList] = useState<
    Record<string, {patientId: string; patientName: string}>
  >({});

  const [pendingFormData, setPendingFormData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [pendingItem, setPendingItem] = useState<AssessmentItem | null>(null);
  const [isPersisting, setIsPersisting] = useState(false);

  useEffect(() => {
    cleanupOldSessions();
  }, []);

  useEffect(() => {
    if (sessionId) {
      try {
        const persistedCurrentItem = loadSessionData(sessionId, "currentItem");
        const persistedFormData = loadSessionData(sessionId, "formData");

        if (persistedCurrentItem) {
          setCurrentItem(persistedCurrentItem);
        }
        if (persistedFormData) {
          setFormData(persistedFormData);
        }
      } catch (error) {
        console.error("Error loading persisted session data:", error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isConnected) {
      setHasJoinedRoom(false);
    }
  }, [isConnected]);

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
            setQrData({qrData: data.qrData, sessionId: data.sessionId});
            break;
          case "changeAssessmentItem":
            setCurrentItem(data.item);
            break;
          case "updateFormData":
            setFormData(data.formData || {});
            break;
          case "updatePatientList":
            if (data.patientList && typeof data.patientList === "object") {
              setPatientList(data.patientList);
            }
            break;
          case "joinedRoom":
            setHasJoinedRoom(true);
            socket.send(
              JSON.stringify({
                type: "requestRoomState",
                roomId: sessionId,
              })
            );
            break;
          default:
            console.warn("Unhandled message type:", data.type);
            break;
        }
      } catch (error) {
        console.error(
          "Error parsing WebSocket message from SocketProvider:",
          error
        );
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, sessionId]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (pendingFormData || pendingItem) {
        setIsPersisting(true);
        try {
          if (sessionId && pendingFormData) {
            persistSessionData(sessionId, "formData", pendingFormData);
            setPendingFormData(null);
          }
          if (sessionId && pendingItem) {
            persistSessionData(sessionId, "currentItem", pendingItem);
            setPendingItem(null);
          }
        } finally {
          setTimeout(() => setIsPersisting(false), 500);
        }
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [sessionId, pendingFormData, pendingItem]);

  useEffect(() => {
    if (isConnected && hasJoinedRoom && sessionId) {
      const timeoutId = setTimeout(() => {
        if (socket && sessionId && socket.readyState === WebSocket.OPEN) {
          if (currentItem) {
            socket.send(
              JSON.stringify({
                type: "changeAssessmentItem",
                item: currentItem,
                sessionId,
              })
            );
          }

          if (Object.keys(formData).length > 0) {
            socket.send(
              JSON.stringify({
                type: "updateFormData",
                formData,
                sessionId,
              })
            );
          }
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, hasJoinedRoom, sessionId, socket, currentItem, formData]);

  // auto-join room
  useEffect(() => {
    if (socket && sessionId && isConnected && !hasJoinedRoom) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "joinRoom",
            roomId: sessionId,
          })
        );
      }
    }
  }, [socket, sessionId, isConnected, hasJoinedRoom]);

  const updateFormData = (newFormData: Record<string, unknown>) => {
    setFormData(newFormData);
    setPendingFormData(newFormData);

    if (socket && sessionId && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "updateFormData",
          formData: newFormData,
          sessionId,
        })
      );
    }
  };

  const updateCurrentItem = (newItem: AssessmentItem) => {
    setCurrentItem(newItem);
    setPendingItem(newItem);

    if (socket && sessionId && socket.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "changeAssessmentItem",
          item: newItem,
          sessionId,
        })
      );
    }
  };

  // Manual save function for user-triggered saves
  const saveSessionManually = () => {
    if (!sessionId) return;

    setIsPersisting(true);
    try {
      // Save current item if exists
      if (currentItem) {
        persistSessionData(sessionId, "currentItem", currentItem);
      }

      // Save form data if exists
      if (formData && Object.keys(formData).length > 0) {
        persistSessionData(sessionId, "formData", formData);
      }

      // Clear any pending data since we just saved everything
      setPendingFormData(null);
      setPendingItem(null);
    } finally {
      // Small delay to show the save indicator
      setTimeout(() => setIsPersisting(false), 1000);
    }
  };

  const sendMessage = (message: string) => {
    socket?.send(message);
  };

  return (
    <SocketStateContext.Provider
      value={{
        socket,
        isConnected,
        sessionId,
        currentItem,
        formData,
        qrData,
        patientList: patientList as Record<
          string,
          {patientId: string; patientName: string}
        >,
        isPersisting,
      }}
    >
      <SocketDispatchContext.Provider
        value={{
          updateFormData,
          updateCurrentItem,
          saveSessionManually,
          sendMessage,
        }}
      >
        {!isConnected && <AlertFail isConnected={!isConnected} />}

        {children}
      </SocketDispatchContext.Provider>
    </SocketStateContext.Provider>
  );
}

export function useSocketState() {
  const ctx = useContext(SocketStateContext);
  if (!ctx)
    throw new Error("useSocketState must be used within SocketProvider");
  return ctx;
}

export function useSocketDispatch() {
  const ctx = useContext(SocketDispatchContext);
  if (!ctx)
    throw new Error("useSocketDispatch must be used within SocketProvider");
  return ctx;
}
