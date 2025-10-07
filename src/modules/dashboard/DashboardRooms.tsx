"use client";
import { useSocketContext } from "@/context/SocketProvider";
import { useState } from "react";
import {Box, Button, Modal} from "@mui/joy";
import getLocalIp from "@/utils/getLocalIp";
import SessionStatus from "@/components/Status/SessionStatus";

export default function DashboardRooms() {

  const socketContext = useSocketContext();
  const { socket, sendMessage, sessionId, user, setSessionId } = socketContext;
  const [sessionLoading, setSessionLoading] = useState(false);
  // Create session handler
  const handleCreateSession = async () => {
    setSessionLoading(true);
    // Example: send a websocket message to create a session
    if (socket && socket.readyState === WebSocket.OPEN && user) {
      const tempSessionId = Math.random().toString(36).substring(2, 15); // Replace with backend-generated ID
      sendMessage({
        type: "createSession",
        clinicianId: user.clinician_id,
        sessionId: tempSessionId,
        isKidsMode: false
      });
      setSessionId(tempSessionId); // In real flow, set from backend response
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
          disabled={sessionLoading || !!sessionId}
        >
          {sessionLoading ? "Creating Session..." : "Create Session"}
        </Button>
        <Button
          size="sm"
          variant="solid"
          color="primary"
          onClick={handleGenerateSessionQr}
          disabled={qrLoading || !sessionId}
        >
          {qrLoading ? "Generating QR..." : "Generate Session QR"}
        </Button>
      </Box>
      <SessionStatus />

      {/* Persistent QR Card */}
      {qrData && (
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
            <img
              src={qrData}
              alt="Session QR Code"
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 'inherit' }}
            />
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
        </Box>
      )}
    </Box>
  );
}
