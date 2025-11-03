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
} from "@mui/joy";
import getLocalIp from "@/utils/getLocalIp";
import QRCodeLib from "qrcode";
import { useSocketContext } from "@/context/SocketProvider";
import RoomsList from "./RoomsList";

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
  const [templates, setTemplates] = useState<Array<{ template_id: number; name: string }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleCreateSession = async () => {
    setSessionLoading(true);
    if (connectionStatus === "error") setSessionId(null);
    if (socket && socket.readyState === WebSocket.OPEN && user) {
      const tempSessionId = Math.random().toString(36).substring(2, 15);
      sendMessage({ type: "createSession", clinicianId: user.clinician_id, sessionId: tempSessionId });
      setSessionId(tempSessionId);
    }
    setSessionLoading(false);
  };

  const handleGenerateQr = async () => {
    setQrLoading(true);
    let useSession = sessionId;
    if (!useSession) {
      if (!socket || !user) {
        setQrLoading(false);
        return;
      }
      const createdId = Math.random().toString(36).substring(2, 15);
      sendMessage({ type: "createSession", clinicianId: user.clinician_id, sessionId: createdId });
      setSessionId(createdId);
      useSession = createdId;
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

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
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
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
            <Button
              size="md"
              variant="solid"
              color="primary"
              onClick={handleCreateSession}
              disabled={sessionLoading || (!!sessionId && connectionStatus !== "error")}
            >
              {sessionLoading ? "Creating..." : "Create Session"}
            </Button>

            <Button
              size="md"
              variant="outlined"
              color="neutral"
              onClick={handleGenerateQr}
              disabled={qrLoading || connectionStatus === "error"}
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
              onClick={() => {
                if (!sessionId) return;
                sendMessage({ type: "startSession", sessionId });
              }}
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
          {sessionId && (
            <Typography
              level="body-sm"
              sx={{
                wordBreak: "break-all",
                mb: 2,
              }}
            >
              <strong>Session ID:</strong> {sessionId}
              <Button
                size="sm"
                variant="plain"
                color="neutral"
                sx={{ ml: 1 }}
                onClick={() => navigator.clipboard.writeText(String(sessionId))}
              >
                Copy
              </Button>
            </Typography>
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
              onClick={handleGenerateQr}
              disabled={qrLoading}
            >
              {qrLoading ? "Regenerating..." : "Regenerate"}
            </Button>
          </Stack>
        </Sheet>
      </Modal>
    </Box>
  );
}
