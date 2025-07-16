"use client";

import { Card, Button, Box, Typography } from "@mui/joy";
import Image from "next/image";
import { redirect } from "next/navigation";

import useQr from "./useQr";
import { useSocketContext } from "@/context/SocketProvider";

export default function DashboardQR() {
  const { socket } = useSocketContext();
  const { qrCode, sessionId, buildSessionUrl, generate } = useQr({ socket });

  const handleGoToSession = (link: string | null) => {
    if (link) {
      redirect(link);
    }
  };

  return (
    <Card
      orientation="horizontal"
      sx={{ padding: 2, gap: 2, flexWrap: "wrap" }}
    >
      {qrCode && (
        <>
          <Image src={qrCode} alt={qrCode} width={200} height={200} />
        </>
      )}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flexWrap: "wrap",
        }}
        flexGrow={1}
      >
        {qrCode && (
          <>
            <Typography level="h2" fontSize="lg">
              Generated QR Code
            </Typography>
            <Typography level="body-md" sx={{ mb: 1 }}>
              This QR code is used to access the session by the patient.
            </Typography>
          </>
        )}

        <Button onClick={() => generate("patient")}>Generate QR Code</Button>
        <Button
          onClick={() =>
            handleGoToSession(buildSessionUrl("clinician", sessionId || ""))
          }
          disabled={!sessionId || !qrCode}
        >
          Go to Session
        </Button>
      </Box>
    </Card>
  );
}
