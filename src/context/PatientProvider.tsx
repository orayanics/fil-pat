"use client";
import {createContext, useContext, useEffect, useState} from "react";
import useWebSocket from "@/lib/useWebSocket";
import {useRouter} from "next/navigation";

interface PatientContextType {
  socket: WebSocket | null;
  qrData: {qrData: string; sessionId: string} | null;
  patient: string;
  setPatient: (message: string) => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export function PatientProvider({children}: {children: React.ReactNode}) {
  const router = useRouter();
  const {socket} = useWebSocket();
  const [patient, setPatient] = useState("");

  const [qrData, setQrData] = useState<{
    qrData: string;
    sessionId: string;
  } | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "patientAdded":
            localStorage.setItem("patientName", data.patientName);
            router.push(`/patient/${data.patientId}`);
            break;
          case "sendQrData":
            setQrData({qrData: data.qrData, sessionId: data.sessionId});
            break;
          default:
            console.warn("Unhandled message type:", data.type);
            break;
        }
      } catch (error) {
        console.error(
          "Error parsing WebSocket message from PatientProvider:",
          error
        );
      }
    };

    socket.addEventListener("message", handleMessage);

    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket, router]);

  return (
    <PatientContext.Provider value={{socket, qrData, patient, setPatient}}>
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  const ctx = useContext(PatientContext);
  if (!ctx) throw new Error("usePatient must be used within PatientProvider");
  return ctx;
}
