"use client";
import React from "react";
import { useSocketContext } from "@/context/SocketProvider";
import { useState } from "react";
import {Box, Button, Modal, Typography} from "@mui/joy";
import getLocalIp from "@/utils/getLocalIp";
import Image from "next/image";
import SessionStatus from "@/components/Status/SessionStatus";

export default function DashboardRooms() {
  const socketContext = useSocketContext();
  const { socket, sendMessage, sessionId, user, setSessionId, connectionStatus } = socketContext;
  const [sessionLoading, setSessionLoading] = useState(false);
  // For demo: use default patient/template (should be selected in real app)
  const defaultPatientId = 1;
  const defaultTemplateId = 1;

  // Listen for sessionCreated response
  React.useEffect(() => {
    if (!socket) return;
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "sessionCreated" && data.sessionId) {
          setSessionId(data.sessionId);
        }
      } catch {}
    };
    socket.addEventListener("message", handler);
    return () => socket.removeEventListener("message", handler);
  }, [socket, setSessionId]);

  // Create session handler
  const handleCreateSession = async () => {
    setSessionLoading(true);
    // Reset sessionId if session failed
    if (connectionStatus === "error") {
      setSessionId(null);
    }
    if (socket && socket.readyState === WebSocket.OPEN && user) {
      const tempSessionId = Math.random().toString(36).substring(2, 15);
      sendMessage({
        type: "createSession",
        clinicianId: user.clinician_id,
        sessionId: tempSessionId,
        patientId: defaultPatientId,
        templateId: defaultTemplateId,
        isKidsMode: false
      });
      // Do not setSessionId here; wait for backend confirmation
    }
    setSessionLoading(false);
  };
  const [qrModal, setQrModal] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);





  const handleGenerateSessionQr = async () => {
    setQrLoading(true);
    const localIp = getLocalIp();
    const url = `${localIp}/session/patient/${sessionId}`;
    try {
      const QRCode = (await import("qrcode")).default;
      const qrDataUri = await QRCode.toDataURL(url, {
        width: 240,
        margin: 1,
        errorCorrectionLevel: "H",
      });
      setQrData(qrDataUri);
      setQrModal(true);
      // Send QR data via websocket for patient connection
      if (socket && socket.readyState === WebSocket.OPEN) {
        sendMessage({ type: "sendQrData", qrData: qrDataUri, sessionId });
      }
    } catch {
      setQrData(null);
      setQrModal(true);
    }
    setQrLoading(false);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Button
          size="sm"
          variant="outlined"
          color="success"
          onClick={handleCreateSession}
          disabled={Boolean(sessionLoading || (sessionId && connectionStatus !== "error"))}
        >
          {sessionLoading ? "Creating Session..." : "Create Session"}
        </Button>
        <Button
          size="sm"
          variant="solid"
          color="primary"
          onClick={handleGenerateSessionQr}
          disabled={Boolean(qrLoading || !sessionId || connectionStatus === "error")}
        >
          {qrLoading ? "Generating QR..." : "Generate Session QR"}
        </Button>
      </Box>
      <SessionStatus />

      {/* QR Modal (closable, regeneratable) */}
      <Modal open={qrModal} onClose={() => setQrModal(false)}>
        <Box
          sx={{
            mt: 4,
            mx: 'auto',
            maxWidth: 420,
            width: '100%',
            p: { xs: 2, sm: 4 },
            bgcolor: 'linear-gradient(135deg, #e0e7ff 0%, #f0fdfa 100%)',
            borderRadius: 4,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontWeight: 700, fontSize: '1.5rem', marginBottom: 8, color: '#1e293b' }}>Session QR Code</h2>
          <Box
            sx={{
              width: { xs: 180, sm: 240 },
              height: { xs: 180, sm: 240 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#fff',
              borderRadius: 3,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              mb: 2,
              mx: 'auto',
              p: 1,
            }}
          >
            {qrData ? (
              <Image
                src={qrData}
                alt="Session QR Code"
                width={240}
                height={240}
                style={{ objectFit: 'contain', borderRadius: 'inherit' }}
              />
            ) : (
              <Typography color="danger">QR generation failed.</Typography>
            )}
          </Box>
          {sessionId && (
            <Box sx={{ mt: 1, mb: 2, fontSize: '0.95rem', color: '#334155', wordBreak: 'break-all' }}>
              <strong>Session ID:</strong> {sessionId}
              <Button
                size="sm"
                variant="soft"
                color="neutral"
                sx={{ ml: 1, fontSize: '0.8rem', px: 1.5, py: 0.5 }}
                onClick={() => navigator.clipboard.writeText(sessionId)}
              >
                Copy
              </Button>
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
            <Button size="sm" variant="outlined" color="neutral" onClick={() => setQrModal(false)}>
              Close
            </Button>
            <Button size="sm" variant="solid" color="primary" onClick={handleGenerateSessionQr} disabled={qrLoading || !sessionId}>
              {qrLoading ? "Regenerating..." : "Regenerate QR"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
