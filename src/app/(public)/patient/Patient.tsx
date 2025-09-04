"use client";

import {useSocketContext} from "@/context/SocketProvider";

import PatientHeader from "./PatientHeader";
import PatientStatus from "./PatientStatus";

import Image from "next/image";
import {Box} from "@mui/joy";

export default function Patient() {
  const {qrData} = useSocketContext();

  return (
    <>
      <PatientHeader />
      <Box
        style={{padding: 6, textAlign: "center"}}
        display={"flex"}
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height={"90vh"}
      >
        <PatientStatus isQrGenerated={!!qrData} />

        {qrData && qrData.qrData && (
          <Box display={"flex"} flexDirection="column" alignItems="center">
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
          </Box>
        )}
      </Box>
    </>
  );
}
