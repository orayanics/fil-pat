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
      {qrCode && <Image src={qrCode} alt={qrCode} width={200} height={200} />}

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
        flexGrow={1}
      >
        {qrCode && (
          <div>
            <Typography level="h2" fontSize="lg">
              Generated QR Code
            </Typography>
            <Typography level="body-md" sx={{ mb: 1 }}>
              This QR code is used to access the session by the patient.
            </Typography>
          </div>
        )}

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Button
            variant={qrCode ? "outlined" : "solid"}
            onClick={() => generate("patient")}
          >
            Generate QR Code
          </Button>

          <Box
            sx={{
              display: "flex",
              gap: 2,
            }}
          >
            <Button
              fullWidth
              color="primary"
              onClick={() =>
                handleGoToSession(buildSessionUrl("clinician", sessionId || ""))
              }
              disabled={!sessionId || !qrCode}
            >
              Go to Session
            </Button>

            {/* TODO: Turn into component, use WS to send signal and update state */}
            <Button variant="soft" fullWidth>
              Redirect Patient
            </Button>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
