"use client";

import { Button } from "@mui/joy";
import Image from "next/image";
import { redirect } from "next/navigation";

import useQr from "./useQr";
import { useSocketContext } from "@/context/SocketProvider";

export default function DashboardQR() {
  const { socket, isConnected } = useSocketContext();
  const { qrCode, sessionId, buildSessionUrl, generate } = useQr({ socket });

  const handleGoToSession = (link: string | null) => {
    if (link) {
      redirect(link);
    }
  };

  return (
    <>
      <div style={{ marginTop: "20px" }}>
        <p>WebSocket Status: {isConnected ? "Connected" : "Disconnected"}</p>
      </div>

      <Button onClick={() => generate("patient")}>Generate QR Code</Button>
      {qrCode && (
        <>
          <Image src={qrCode} alt={qrCode} width={200} height={200} />
          <Button
            onClick={() =>
              handleGoToSession(buildSessionUrl("clinician", sessionId || ""))
            }
          >
            Go to Session
          </Button>
        </>
      )}
    </>
  );
}
