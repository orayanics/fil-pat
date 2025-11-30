"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Modal,
  Typography,
  Card,
  Select,
  Option,
  Sheet,
  Stack,
  Chip,
  Divider,
  Input,
  FormControl,
  FormLabel,
} from "@mui/joy";
import getLocalIp from "@/utils/getLocalIp";
import QRCodeLib from "qrcode";
import { useSocketContext } from "@/context/SocketProvider";
import RoomsList from "./RoomsList";
import PatientNamePrompt from "@/components/session/PatientNamePrompt";

type DashboardRoomsProps = {
  qrGenerateQrData?: (url: string) => Promise<string>;
};

export default function DashboardRooms({ qrGenerateQrData }: DashboardRoomsProps) {
  const {
    sendMessage,
    socket,
    sessionId,
    setSessionId,
    connectionStatus,
    patientConnected,
    user,
    patientList,
    joinRoom,
  } = useSocketContext();

  const [sessionLoading, setSessionLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrLink, setQrLink] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [templates, setTemplates] = useState<Array<{ template_id: number; name: string }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [patientPromptOpen, setPatientPromptOpen] = useState(false);
  const [sessionName, setSessionName] = useState<string>('');

  const handleCreateSession = async () => {
    setSessionLoading(true);
    if (connectionStatus === "error") setSessionId(null);
    
    if (!user || !user.clinician_id) {
      setErrorMessage('Please log in to create a session');
      setSessionLoading(false);
      return;
    }
    
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setErrorMessage('WebSocket connection not available');
      setSessionLoading(false);
      return;
    }
    
    try {
      const tempSessionId = Math.random().toString(36).substring(2, 15);
      // Include selectedTemplate if already chosen; server will fallback to default if absent
      const templateIdNum = selectedTemplate ? Number(selectedTemplate) : undefined;
      const sessionNameToSend = sessionName.trim() || null;
      sendMessage({ type: "createSession", clinicianId: user.clinician_id, sessionId: tempSessionId, templateId: templateIdNum, sessionName: sessionNameToSend });
      setSessionId(tempSessionId);
    } catch (err) {
      console.error("Failed to create session:", err);
      setErrorMessage('Failed to create session');
    }
    setSessionLoading(false);
  };

  const handleGenerateQr = async (forceNew = false) => {
    setQrLoading(true);
    let useSession = sessionId;
    if (forceNew || !useSession) {
      if (!user || !user.clinician_id) {
        setErrorMessage('Please log in to generate QR code');
        setQrLoading(false);
        return;
      }
      
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        setErrorMessage('WebSocket connection not available');
        setQrLoading(false);
        return;
      }
      
      try {
        const createdId = Math.random().toString(36).substring(2, 15);
        const templateIdNum = selectedTemplate ? Number(selectedTemplate) : undefined;
        const sessionNameToSend = sessionName.trim() || null;
        sendMessage({ type: "createSession", clinicianId: user.clinician_id, sessionId: createdId, templateId: templateIdNum, sessionName: sessionNameToSend });
        setSessionId(createdId);
        useSession = createdId;
      } catch (err) {
        console.error("Failed to create session before QR:", err);
        setErrorMessage('Failed to create session before generating QR');
        setQrLoading(false);
        return;
      }
    }

    try {
      const localIp = await getLocalIp();
      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : "";
      const hostToUse = window.location.hostname || localIp || "localhost";
      const url = `${protocol}//${hostToUse}${port}/session/patient/${useSession}`;
      const dataUrl = qrGenerateQrData
        ? await qrGenerateQrData(url)
        : await QRCodeLib.toDataURL(url, { width: 240, margin: 1 });
      setQrData(dataUrl);
      setQrLink(url);
      setQrModalOpen(true);
      
      if (socket && socket.readyState === WebSocket.OPEN) {
        sendMessage({ type: "sendQrData", qrData: dataUrl, sessionId: useSession, qrUrl: url });
      }
    } catch (err) {
      console.error("Failed to create QR", err);
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (patientConnected) setQrModalOpen(false);
  }, [patientConnected]);

  // Listen for WebSocket error messages
  useEffect(() => {
    if (!socket) return;
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'error') {
          setErrorMessage(data.message || 'An error occurred');
          setSessionLoading(false);
          setQrLoading(false);
        }
      } catch (err) {
        console.error('Error parsing message:', err);
      }
    };
    
    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket]);

  // Fetch templates
  useEffect(() => {
    let mounted = true;
    const fetchTemplates = async () => {
      try {
        const res = await fetch("/api/templates", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        if (Array.isArray(data)) {
              const mapped = (data as unknown[])
                .map((t) => (typeof t === "object" && t !== null ? (t as Record<string, unknown>) : null))
                .filter(Boolean)
                .map((t) => ({
                  template_id: Number((t as Record<string, unknown>)["template_id"]),
                  name: String((t as Record<string, unknown>)["name"] || "Untitled"),
                }));
              setTemplates(mapped);
              if (mapped.length > 0) setSelectedTemplate(String(mapped[0].template_id));
            }
      } catch (err) {
        console.error("Failed to fetch templates", err);
      }
    };
    fetchTemplates();
    return () => {
      mounted = false;
    };
  }, []);

  const handleJoinRoom = (patientId: string) => {
    try {
      if (joinRoom) joinRoom(patientId, "clinician");
      else if (socket && socket.readyState === WebSocket.OPEN) {
        sendMessage({ type: "joinRoom", roomId: patientId, role: "clinician" });
      }
    } catch (err) {
      console.error("Failed to join room", err);
    }
  };

  const handleAssignTemplate = async () => {
    if (!sessionId || selectedTemplate == null) return;
    try {
      const templateIdNum = Number(selectedTemplate);
      if (Number.isNaN(templateIdNum)) return;
      sendMessage({ type: "assignTemplate", sessionId, templateId: templateIdNum });
    } catch (err) {
      console.error("Failed to assign template", err);
    }
  };

  const handleStartSession = () => {
    // Open patient name prompt before starting session
    setPatientPromptOpen(true);
  };

  const handlePatientConfirm = async (patientData: {
    patient_id?: number;
    first_name: string;
    last_name: string;
    is_existing: boolean;
  }) => {
    if (!sessionId) return;

    setPatientPromptOpen(false);

    // Send patient info to server to associate with session
    try {
      sendMessage({
        type: "setSessionPatient",
        sessionId,
        patient_id: patientData.patient_id,
        first_name: patientData.first_name,
        last_name: patientData.last_name,
        is_existing: patientData.is_existing,
      });

      // Start the session
      setTimeout(() => {
        sendMessage({ type: "startSession", sessionId });
      }, 500);
    } catch (err) {
      console.error("Failed to set patient for session:", err);
      setErrorMessage("Failed to set patient for session");
    }
  };

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
      {/* User not authenticated warning */}
      {!user && (
        <Sheet
          variant="soft"
          color="warning"
          sx={{ p: 2, borderRadius: 'md' }}
        >
          <Typography level="body-sm">
            <strong>Not logged in:</strong> Please log in to create sessions and generate QR codes.
          </Typography>
        </Sheet>
      )}
      
      {/* Error Alert */}
      {errorMessage && (
        <Sheet
          variant="soft"
          color="danger"
          sx={{ p: 2, borderRadius: 'md' }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography level="body-sm" sx={{ fontWeight: 'bold' }}>
              Error:
            </Typography>
            <Typography level="body-sm">{errorMessage}</Typography>
            <Button
              size="sm"
              variant="plain"
              color="danger"
              onClick={() => setErrorMessage('')}
              sx={{ ml: 'auto' }}
            >
              Dismiss
            </Button>
          </Stack>
        </Sheet>
      )}
      
      {/* Connected Patients Section */}
      <Card
        variant="outlined"
        sx={{
          p: 3,
          borderRadius: "lg",
          boxShadow: "sm",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography level="title-md">Connected Patients</Typography>
          <Chip
            size="sm"
            color={connectionStatus === "connected" ? "success" : "neutral"}
            variant="soft"
          >
            {connectionStatus === "connected" ? "Online" : "Offline"}
          </Chip>
        </Stack>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.9rem",
            }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ textAlign: "left", padding: "10px" }}>Name</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Patient ID</th>
                <th style={{ textAlign: "left", padding: "10px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <RoomsList patientList={patientList || {}} handleJoinRoom={handleJoinRoom} />
            </tbody>
          </table>
        </Box>
      </Card>

      {/* Controls */}
      <Card variant="outlined" sx={{ p: 3, borderRadius: "lg", boxShadow: "sm" }}>
        <Stack spacing={2}>
          {/* Session Name Input */}
          <FormControl>
            <FormLabel>Session Name (Optional)</FormLabel>
            <Input
              placeholder="e.g., Morning Assessment, Follow-up Session"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              size="md"
            />
          </FormControl>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Button
              size="md"
              variant="solid"
              color="primary"
              onClick={handleCreateSession}
              disabled={!user || sessionLoading || (!!sessionId && connectionStatus !== "error")}
            >
              {sessionLoading ? "Creating..." : "Create Session"}
            </Button>

            <Button
              size="md"
              variant="outlined"
              color="neutral"
              onClick={() => handleGenerateQr(false)}
              disabled={!user || qrLoading || connectionStatus === "error"}
            >
              {qrLoading ? "Generating QR..." : "Generate Session QR"}
            </Button>
          </Stack>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems="center"
            justifyContent="flex-start"
          >
            <Typography level="title-sm" sx={{ minWidth: 80 }}>
              Template
            </Typography>
            <Select
              size="sm"
              value={selectedTemplate ?? ""}
              onChange={(e, v) => setSelectedTemplate(v || null)}
              sx={{ minWidth: 220 }}
            >
              {templates.map((t) => (
                <Option key={t.template_id} value={String(t.template_id)}>
                  {t.name}
                </Option>
              ))}
            </Select>
            <Button
              size="sm"
              variant="soft"
              color="primary"
              onClick={handleAssignTemplate}
              disabled={!sessionId || selectedTemplate == null}
            >
              Assign
            </Button>
            <Button
              size="sm"
              variant="solid"
              color="primary"
              sx={{ fontWeight: 600 }}
              onClick={handleStartSession}
              disabled={!sessionId || selectedTemplate == null}
            >
              Start Session
            </Button>
          </Stack>
        </Stack>
      </Card>

      {/* QR Modal */}
      <Modal open={qrModalOpen} onClose={() => setQrModalOpen(false)}>
        <Sheet
          variant="outlined"
          sx={{
            maxWidth: 420,
            mx: "auto",
            mt: "10vh",
            p: 4,
            borderRadius: "xl",
            textAlign: "center",
            boxShadow: "lg",
            bgcolor: "background.surface",
          }}
        >
          <Typography level="title-md" mb={1}>
            Session QR Code
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box
            sx={{
              width: { xs: 180, sm: 240 },
              height: { xs: 180, sm: 240 },
              mx: "auto",
              mb: 2,
              p: 1,
              bgcolor: "#fff",
              borderRadius: "md",
            }}
          >
            {qrData ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrData}
                alt="Session QR Code"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <Typography level="body-sm">QR generation failed.</Typography>
            )}
          </Box>
          {qrLink && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography level="body-sm" sx={{ minWidth: 80 }}>Join Link:</Typography>
              <input
                readOnly
                value={qrLink}
                style={{
                  flex: 1,
                  fontSize: '0.85rem',
                  padding: '6px 8px',
                  borderRadius: 8,
                  border: '1px solid var(--joy-palette-divider)',
                  background: '#fff',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              />
              <Button
                size="sm"
                variant="plain"
                color="neutral"
                onClick={() => {
                  try {
                    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
                      navigator.clipboard.writeText(String(qrLink));
                    } else {
                      const ta = document.createElement('textarea');
                      ta.value = String(qrLink);
                      document.body.appendChild(ta);
                      ta.select();
                      document.execCommand('copy');
                      document.body.removeChild(ta);
                    }
                  } catch (err) {
                    console.error('Copy failed:', err);
                  }
                }}
              >
                Copy
              </Button>
            </Box>
          )}
          <Stack direction="row" spacing={2} justifyContent="center" mt={1}>
            <Button
              size="sm"
              variant="outlined"
              color="neutral"
              onClick={() => setQrModalOpen(false)}
            >
              Close
            </Button>
            <Button
              size="sm"
              variant="solid"
              color="primary"
              onClick={() => handleGenerateQr(true)}
              disabled={qrLoading}
            >
              {qrLoading ? "Regenerating..." : "Regenerate"}
            </Button>
          </Stack>
        </Sheet>
      </Modal>

      {/* Patient Name Prompt */}
      <PatientNamePrompt
        open={patientPromptOpen}
        onClose={() => setPatientPromptOpen(false)}
        onConfirm={handlePatientConfirm}
      />
    </Box>
  );
}
