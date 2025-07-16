"use client";

import Image from "next/image";
import { useSocketContext } from "@/context/SocketProvider";
import { Box } from "@mui/joy";

import PatientHeader from "./PatientHeader";

export default function Patient() {
  const { isConnected, qrData } = useSocketContext();

  return (
    <>
      <PatientHeader />
      <Box
        style={{ padding: 6, textAlign: "center", height: "100dvh" }}
        display={"flex"}
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
      >
        {qrData && qrData.qrData && (
          <Box
            style={{ marginTop: "30px" }}
            display={"flex"}
            flexDirection="column"
            alignItems="center"
          >
            <Image
              src={qrData.qrData || ""}
              alt="Session QR Code"
              width={500}
              height={500}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: 2,
                backgroundColor: "#f9f9f9",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            />

            <p style={{ marginTop: "10px", fontSize: "14px", color: "#666" }}>
              Scan this QR code to join the session
            </p>
          </Box>
        )}

        {!qrData && isConnected && (
          <div style={{ marginTop: "30px" }}>
            <p>Waiting for QR code to be generated...</p>
          </div>
        )}
      </Box>
    </>
  );
}
