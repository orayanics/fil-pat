"use client";
import React from "react";
import { useSocketContext } from "@/context/SocketProvider";
import { useState, useEffect } from "react";
import {Box, Button, Modal, Typography, Select, Option, FormControl, FormLabel} from "@mui/joy";
import getLocalIp from "@/utils/getLocalIp";
import Image from "next/image";
import SessionStatus from "@/components/Status/SessionStatus";

export default function DashboardRooms() {
  const socketContext = useSocketContext();
  const { socket, sendMessage, sessionId, user, setSessionId, connectionStatus, patientConnected } = socketContext;
  const [sessionLoading, setSessionLoading] = useState(false);
  const [templates, setTemplates] = useState<Array<{template_id: number; name: string}>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  // For demo: use default patient/template (should be selected in real app)
  const defaultTemplateId = 1;

  useEffect(() => {
    let mounted = true;
    const fetchTemplates = async () => {
      try {
        const res = await fetch('/api/templates');
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        // API returns array of templates
        setTemplates(Array.isArray(data) ? data : (data?.templates ?? []));
      } catch {
        // ignore
      }
    };
    fetchTemplates();
    return () => { mounted = false; };
  }, []);
  // Listen for sessionCreated response
  React.useEffect(() => {
    if (!socket) return;
    const handler = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "sessionCreated" && data.sessionId) {
          setSessionId(data.sessionId);
          // store server-provided clinician_ip if available for more reliable QR links
          if (data.sessionInfo && data.sessionInfo.clinician_ip) {
            setServerHostIp(data.sessionInfo.clinician_ip as string);
          }
        }
      } catch {}
    };
    socket.addEventListener("message", handler);
    return () => socket.removeEventListener("message", handler);
  }, [socket, setSessionId]);
  const [serverHostIp, setServerHostIp] = useState<string | null>(null);

  // Create session handler
  const handleCreateSession = async () => {
    setSessionLoading(true);
    // Reset sessionId if session failed
    if (connectionStatus === "error") {
      setSessionId(null);
    }
    if (socket && socket.readyState === WebSocket.OPEN && user) {
      const tempSessionId = Math.random().toString(36).substring(2, 15);
      const templateIdToUse = selectedTemplate ? Number(selectedTemplate) : defaultTemplateId;
      // detect local host IP to pass to server for QR usage
      let hostIp: string | null = null;
      try {
        const detected = await getLocalIp();
        try {
          const u = new URL(detected);
          hostIp = u.hostname;
        } catch {
          hostIp = detected;
        }
      } catch {}

      sendMessage({
        type: "createSession",
        clinicianId: user.clinician_id,
        sessionId: tempSessionId,
        // Do not pass a hardcoded patientId here — let server create a temporary patient if needed
        templateId: templateIdToUse,
        isKidsMode: false,
        hostIp
      });
      // Set sessionId immediately so UI can use it; backend will confirm when ready
      setSessionId(tempSessionId);
    }
    setSessionLoading(false);
  };
  const [qrModal, setQrModal] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);





  const createAndSetSession = async () => {
    if (!socket || socket.readyState !== WebSocket.OPEN || !user) return null;
    const tempSessionId = Math.random().toString(36).substring(2, 15);
    const templateIdToUse = selectedTemplate ? Number(selectedTemplate) : defaultTemplateId;
    // detect local host IP to pass to server
    let hostIp: string | null = null;
    try {
      const detected = await getLocalIp();
      try {
        const u = new URL(detected);
        hostIp = u.hostname;
      } catch {
        hostIp = detected;
      }
    } catch {}

    sendMessage({
      type: 'createSession',
      clinicianId: user.clinician_id,
      sessionId: tempSessionId,
      // omit patientId so server will create a temporary patient if none exists
      templateId: templateIdToUse,
      isKidsMode: false,
      hostIp
    });
    // wait for server confirmation (sessionCreated) to obtain server-provided clinician_ip
    return await new Promise<string | null>((resolve) => {
      let resolved = false;
      const onMessage = (ev: MessageEvent) => {
        try {
          const d = JSON.parse(ev.data);
          if (d.type === 'sessionCreated' && d.sessionId === tempSessionId) {
            // store server-provided ip if present
            if (d.sessionInfo && d.sessionInfo.clinician_ip) {
              setServerHostIp(d.sessionInfo.clinician_ip as string);
            }
            resolved = true;
            socket.removeEventListener('message', onMessage);
            setSessionId(tempSessionId);
            resolve(tempSessionId);
          }
        } catch {}
      };
      socket.addEventListener('message', onMessage);
      // fallback: resolve after timeout even if server didn't respond
      setTimeout(() => {
        if (!resolved) {
          try { socket.removeEventListener('message', onMessage); } catch {}
          setSessionId(tempSessionId);
          resolve(tempSessionId);
        }
      }, 3000);
    });
  };

  const handleGenerateSessionQr = async ({ regenerate = false }: { regenerate?: boolean } = {}) => {
    setQrLoading(true);
    // create new session if none exists or if regenerating
    let useSession = sessionId;
    if (!useSession || regenerate) {
      const created = await createAndSetSession();
      if (created) useSession = created;
    }
    if (!useSession) {
      setQrLoading(false);
      return;
    }

    try {
      // Get the local IP that other devices on the same network can use
      const localIp = await getLocalIp();

      // Construct the URL that the phone will use to connect
      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : '';

      // Use server-provided IP if available (more reliable), otherwise fallback to detected local IP
      const hostToUse = serverHostIp || localIp || window.location.hostname;

      const url = `${protocol}//${hostToUse}${port}/session/patient/${useSession}`;

      console.log('QR Code URL:', url);
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
        sendMessage({ type: "sendQrData", qrData: qrDataUri, sessionId: useSession, qrUrl: url });
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
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
              {patientConnected ? (
                <FormControl sx={{ minWidth: 200 }}>
                  <FormLabel>Template</FormLabel>
                  <Select size="sm" value={selectedTemplate ?? ''} onChange={(_e, value) => setSelectedTemplate(value ?? '')}>
                    <Option value="">Select template (optional)</Option>
                    {templates.map(t => <Option key={t.template_id} value={String(t.template_id)}>{t.name}</Option>)}
                  </Select>
                </FormControl>
              ) : null}

              {patientConnected && selectedTemplate ? (
                <Button
                  size="sm"
                  variant="soft"
                  color="neutral"
                  onClick={() => {
                    if (!sessionId) return;
                    sendMessage({ type: 'assignTemplate', sessionId, templateId: Number(selectedTemplate) });
                  }}
                  sx={{ ml: 1 }}
                >
                  Assign Template
                </Button>
              ) : null}
              {patientConnected ? (
                <Button
                  size="sm"
                  variant="solid"
                  color="success"
                  onClick={() => {
                    if (!sessionId) return;
                    sendMessage({ type: 'startSession', sessionId });
                  }}
                  sx={{ ml: 1 }}
                >
                  Start Session
                </Button>
              ) : null}

              <Button
                size="sm"
                variant="solid"
                color="primary"
                onClick={() => handleGenerateSessionQr()}
                disabled={Boolean(qrLoading || connectionStatus === "error")}
                sx={{ ml: 1 }}
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
            <Button size="sm" variant="solid" color="primary" onClick={() => handleGenerateSessionQr({ regenerate: true })} disabled={qrLoading || !sessionId}>
              {qrLoading ? "Regenerating..." : "Regenerate QR"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}
