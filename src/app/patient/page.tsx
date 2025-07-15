"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSocketContext } from "@/context/SocketProvider";

type WebSocketData = {
  qrData: string;
  sessionId: string;
};

export default function Patient() {
  const { socket, isConnected } = useSocketContext();
  const [qrData, setQrData] = useState<WebSocketData | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "sendQrData") {
          setQrData({ qrData: data.qrData, sessionId: data.sessionId });
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

  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Patient Page</h1>

      <div style={{ marginTop: "20px" }}>
        <p>WebSocket Status: {isConnected ? "Connected" : "Disconnected"}</p>
      </div>

      {qrData && qrData.qrData && (
        <div style={{ marginTop: "30px" }}>
          <h2>Session QR Code</h2>
          <p>Session ID: {qrData.sessionId}</p>
          <Image
            src={qrData.qrData || ""}
            alt="Session QR Code"
            width={200}
            height={200}
            style={{ border: "1px solid #ddd", borderRadius: "8px" }}
          />
          <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
            Scan this QR code to join the session
          </p>
        </div>
      )}

      {!qrData && isConnected && (
        <div style={{ marginTop: "30px" }}>
          <p>Waiting for QR code to be generated...</p>
        </div>
      )}
    </div>
  );
}
