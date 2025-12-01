"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Modal,
  ModalDialog,
  ModalClose,
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
import { useSocketStore } from "@/context/socketStore";
import PatientNamePrompt from "@/components/session/PatientNamePrompt";

type DashboardRoomsProps = {
  qrGenerateQrData?: (url: string) => Promise<string>;
};

export default function DashboardRooms({ qrGenerateQrData }: DashboardRoomsProps) {
  const router = useRouter();
  const {
    sendMessage,
    socket,
    sessionId,
    setSessionId,
    connectionStatus,
    patientConnected,
    setPatientConnected,
    user,
    joinRoom,
    reconnect,
  } = useSocketContext();

  const [sessionLoading, setSessionLoading] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrLink, setQrLink] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [templates, setTemplates] = useState<Array<{ template_id: number; name: string }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [assignedTemplate, setAssignedTemplate] = useState<string | null>(null);
  const [patientPromptOpen, setPatientPromptOpen] = useState(false);
  const [sessionName, setSessionName] = useState<string>('');

  // Reset session state when returning to dashboard (component mount)
  useEffect(() => {
    console.log('[Dashboard] Component mounted - resetting session state');
    // Clear all session state to ensure clean slate
    useSocketStore.getState().resetSessionState();
  }, []);

  const handleCreateSession = async () => {
    setSessionLoading(true);
    setErrorMessage(''); // Clear any previous errors
    
    // ALWAYS reset ALL session state before creating a new session
    console.log('[Create Session] Resetting all session state before creating new session');
    
    // Use centralized resetSessionState function for comprehensive cleanup
    useSocketStore.getState().resetSessionState();
    
    // Clear local component state
    setSessionId(null);
    setPatientConnected(false);
    setAssignedTemplate(null);
    
    if (connectionStatus === "error") setSessionId(null);
    
    if (!user || !user.clinician_id) {
      setErrorMessage('Please log in to create a session');
      setSessionLoading(false);
      return;
    }
    
    // Check if WebSocket is closed or closing, and reconnect if needed
    if (!socket || socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
      console.log('[Create Session] WebSocket is closed or closing, attempting to reconnect...');
      setErrorMessage('Reconnecting...');
      
      try {
        // Trigger reconnection using the reconnect function from context
        if (reconnect) {
          reconnect();
        }
        
        // Wait for connection to establish
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        // Check if we're now connected
        if (connectionStatus !== 'connected') {
          setErrorMessage('Failed to reconnect. Please try again or refresh the page.');
          setSessionLoading(false);
          return;
        }
      } catch (err) {
        console.error('Failed to reconnect WebSocket:', err);
        setErrorMessage('Connection failed. Please try again or refresh the page.');
        setSessionLoading(false);
        return;
      }
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
      console.log('[Create Session] Sending createSession message:', { clinicianId: user.clinician_id, sessionId: tempSessionId, templateId: templateIdNum });
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
      await handleCreateSession();
      useSession = sessionId;
    }
    
    if (!useSession) {
      setErrorMessage("No active session to generate QR");
      setQrLoading(false);
      return;
    }
    
    try {
      const localIp = await getLocalIp();
      const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
      const port = typeof window !== 'undefined' && window.location.port ? `:${window.location.port}` : ":3000";
      const hostToUse = localIp || "localhost";
      const url = `${protocol}//${hostToUse}${port}/session/patient/${useSession}`;
      
      let dataUrl: string;
      if (qrGenerateQrData) {
        dataUrl = await qrGenerateQrData(url);
      } else {
        dataUrl = await QRCodeLib.toDataURL(url, { width: 300, margin: 2 });
      }
      
      setQrData(dataUrl);
      setQrLink(url);
      setQrModalOpen(true);
    } catch (err) {
      console.error("Failed to generate QR:", err);
      setErrorMessage("Failed to generate QR code");
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

  const handleJoinRoom = (roomId: string) => {
    if (joinRoom) {
      joinRoom(roomId, "clinician");
      router.push(`/clinician-dashboard/session/${roomId}`);
    }
  };

  const handleAssignTemplate = () => {
    if (!selectedTemplate || !sessionId) return;
    sendMessage({ type: "assignTemplate", sessionId, templateId: Number(selectedTemplate) });
    setAssignedTemplate(selectedTemplate);
  };

  const handleStartSession = () => {
    setPatientPromptOpen(true);
  };

  const handlePatientConfirm = async (patientData: {
    patient_id?: number;
    first_name: string;
    last_name: string;
    is_existing: boolean;
  }) => {
    setPatientPromptOpen(false);
    
    if (!sessionId || !user) {
      setErrorMessage("Session or user not available");
      return;
    }
    
    try {
      // Set patient for the session
      sendMessage({
        type: "setSessionPatient",
        sessionId,
        patient_id: patientData.patient_id,
        first_name: patientData.first_name,
        last_name: patientData.last_name,
        is_existing: patientData.is_existing,
      });

      // Navigate to session page using replace to prevent back button issues
      console.log('[Start Session] Navigating to session:', sessionId);
      router.replace(`/session/clinician/${sessionId}`);

      // Start the session after navigation
      setTimeout(() => {
        sendMessage({ type: "startSession", sessionId });
      }, 300);
    } catch (err) {
      console.error("Failed to set patient for session:", err);
      setErrorMessage("Failed to set patient for session");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
      <Stack spacing={4}>
        {/* Modern Header */}
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          sx={{
            pb: 2,
            borderBottom: 2,
            borderColor: "divider"
          }}
        >
          <Box>
            <Typography level="h1" sx={{ fontWeight: 800, fontSize: { xs: "xl3", md: "xl4" } }}>
              Session Management
            </Typography>
            <Typography level="body-sm" sx={{ color: "text.secondary", mt: 0.5 }}>
              Create and manage assessment sessions
            </Typography>
          </Box>
          <Chip
            size="lg"
            color={connectionStatus === "connected" ? "success" : "neutral"}
            variant="soft"
            startDecorator={
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  bgcolor: connectionStatus === "connected" ? "success.500" : "neutral.400",
                  animation: connectionStatus === "connected" ? "pulse 2s infinite" : "none",
                  "@keyframes pulse": {
                    "0%, 100%": { opacity: 1 },
                    "50%": { opacity: 0.5 },
                  },
                }}
              />
            }
          >
            {connectionStatus === "connected" ? "Connected" : "Disconnected"}
          </Chip>
        </Stack>

        {/* User not authenticated warning */}
        {!user && (
          <Sheet
            variant="soft"
            color="warning"
            sx={{ 
              p: 3, 
              borderRadius: "lg",
              borderLeft: 4,
              borderColor: "warning.500"
            }}
          >
            <Typography level="body-md" sx={{ fontWeight: 600 }}>
              ⚠️ Not logged in - Please log in to create sessions and generate QR codes.
            </Typography>
          </Sheet>
        )}
        
        {/* Error Alert */}
        {errorMessage && (
          <Sheet
            variant="soft"
            color="danger"
            sx={{ 
              p: 3, 
              borderRadius: "lg",
              borderLeft: 4,
              borderColor: "danger.500"
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Typography level="body-md" sx={{ fontWeight: 600 }}>
                ⚠️ {errorMessage}
              </Typography>
              <Button
                size="sm"
                variant="plain"
                color="danger"
                onClick={() => setErrorMessage('')}
              >
                Dismiss
              </Button>
            </Stack>
          </Sheet>
        )}

        {/* Modern Session Creation Card */}
        <Card
          variant="outlined"
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: "xl",
            boxShadow: "lg",
            border: 2,
            borderColor: "primary.200",
            background: "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
          }}
        >
          <Stack spacing={4}>
            {/* Card Header */}
            <Box>
              <Typography level="h2" sx={{ fontWeight: 700, fontSize: "xl2" }}>
                🎯 Create New Session
              </Typography>
              <Typography level="body-md" sx={{ color: "text.secondary", mt: 1 }}>
                Configure and start a new patient assessment session
              </Typography>
            </Box>

            <Divider />

            {/* Session Configuration Grid */}
            <Stack spacing={3.5}>
              {/* Session Name */}
              <FormControl>
                <FormLabel sx={{ fontWeight: 700, mb: 1.5, fontSize: "sm" }}>
                  Session Name
                  <Typography component="span" level="body-xs" sx={{ ml: 1, color: "text.tertiary", fontWeight: 400 }}>
                    (Optional)
                  </Typography>
                </FormLabel>
                <Input
                  placeholder="e.g., Morning Assessment, Follow-up Session, Patient ABC"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  size="lg"
                  sx={{
                    "--Input-focusedThickness": "2px",
                    "--Input-focusedHighlight": "var(--joy-palette-primary-500)",
                    fontSize: "md",
                  }}
                />
              </FormControl>

              {/* Template Selection */}
              <FormControl>
                <FormLabel sx={{ fontWeight: 700, mb: 1.5, fontSize: "sm" }}>
                  Assessment Template
                  {assignedTemplate && (
                    <Chip size="sm" color="success" variant="soft" sx={{ ml: 1 }}>
                      ✓ Template Assigned
                    </Chip>
                  )}
                </FormLabel>
                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Select
                    size="lg"
                    value={selectedTemplate ?? ""}
                    onChange={(e, v) => setSelectedTemplate(v || null)}
                    placeholder="Select an assessment template"
                    sx={{ 
                      flex: 1,
                      "--Select-focusedThickness": "2px",
                      fontSize: "md",
                    }}
                  >
                    {templates.map((t) => (
                      <Option key={t.template_id} value={String(t.template_id)}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                          <Typography sx={{ flex: 1 }}>{t.name}</Typography>
                          {assignedTemplate === String(t.template_id) && (
                            <Chip size="sm" color="success" variant="solid">✓</Chip>
                          )}
                        </Stack>
                      </Option>
                    ))}
                  </Select>
                  <Button
                    size="lg"
                    variant="soft"
                    color="primary"
                    onClick={handleAssignTemplate}
                    disabled={!sessionId || selectedTemplate == null}
                    sx={{ 
                      minWidth: { md: 160 },
                      fontWeight: 600,
                    }}
                  >
                    Assign Template
                  </Button>
                </Stack>
              </FormControl>

              <Divider />

              {/* Action Buttons - Modern Grid Layout */}
              <Box>
                <Typography level="body-sm" sx={{ mb: 2, fontWeight: 600, color: "text.secondary" }}>
                  Session Actions
                </Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
                    gap: 2,
                  }}
                >
                  <Button
                    size="lg"
                    variant="solid"
                    color="primary"
                    onClick={handleCreateSession}
                    disabled={!user || sessionLoading}
                    loading={sessionLoading}
                    sx={{
                      fontWeight: 700,
                      minHeight: 64,
                      fontSize: "md",
                      transition: "all 0.2s ease",
                      "&:hover:not(:disabled)": {
                        transform: "translateY(-3px)",
                        boxShadow: "xl",
                      },
                    }}
                  >
                    {sessionId ? "Create New Session" : "➕ Create Session"}
                  </Button>

                  <Button
                    size="lg"
                    variant="outlined"
                    color="primary"
                    onClick={() => handleGenerateQr(false)}
                    disabled={!user || qrLoading || connectionStatus === "error" || !sessionId}
                    loading={qrLoading}
                    sx={{
                      fontWeight: 600,
                      minHeight: 64,
                      fontSize: "md",
                      transition: "all 0.2s ease",
                      "&:hover:not(:disabled)": {
                        transform: "translateY(-3px)",
                        boxShadow: "lg",
                      },
                    }}
                  >
                    📱 Generate QR
                  </Button>

                  <Button
                    size="lg"
                    variant="solid"
                    color="success"
                    onClick={handleStartSession}
                    disabled={!sessionId || selectedTemplate == null}
                    sx={{
                      fontWeight: 700,
                      minHeight: 64,
                      fontSize: "md",
                      transition: "all 0.2s ease",
                      "&:hover:not(:disabled)": {
                        transform: "translateY(-3px)",
                        boxShadow: "xl",
                      },
                    }}
                  >
                    ▶️ Start Session
                  </Button>
                </Box>
              </Box>

              {/* Session Status Info */}
              {sessionId && (
                <Sheet
                  variant="soft"
                  color="primary"
                  sx={{
                    p: 3,
                    borderRadius: "lg",
                    mt: 1,
                  }}
                >
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                      <Typography level="body-sm" sx={{ fontWeight: 700 }}>
                        Active Session ID:
                      </Typography>
                      <Typography level="body-sm" sx={{ fontFamily: "monospace", fontSize: "xs" }}>
                        {sessionId}
                      </Typography>
                      {patientConnected && (
                        <Chip size="sm" color="success" variant="solid">
                          ✓ Patient Connected
                        </Chip>
                      )}
                    </Stack>
                    {assignedTemplate && (
                      <Typography level="body-xs" sx={{ color: "primary.700" }}>
                        Template: {templates.find(t => String(t.template_id) === assignedTemplate)?.name || 'Unknown'}
                      </Typography>
                    )}
                  </Stack>
                </Sheet>
              )}
            </Stack>
          </Stack>
        </Card>
      </Stack>

      {/* QR Modal */}
      <Modal open={qrModalOpen} onClose={() => setQrModalOpen(false)}>
        <ModalDialog
          sx={{
            maxWidth: 500,
            borderRadius: 'lg',
            p: 3,
            boxShadow: 'lg',
          }}
        >
          <ModalClose />
          <Stack spacing={2} alignItems="center">
            <Typography level="h4" sx={{ fontWeight: 700 }}>
              Session QR Code
            </Typography>
            {sessionName && (
              <Typography level="body-sm" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                {sessionName}
              </Typography>
            )}
            {assignedTemplate && (
              <Chip size="sm" color="primary" variant="soft">
                {templates.find(t => String(t.template_id) === assignedTemplate)?.name || 'Template Assigned'}
              </Chip>
            )}
            <Typography level="body-sm" textAlign="center" sx={{ color: 'text.secondary' }}>
              Patient can scan this QR code with their device camera to join the session
            </Typography>
            
            {qrData && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 'md',
                  boxShadow: 'sm',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrData}
                  alt="Session QR Code"
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: '300px',
                    height: 'auto'
                  }}
                />
              </Box>
            )}
            
            {qrLink && (
              <>
                <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center', wordBreak: 'break-all' }}>
                  {qrLink}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                  <Button
                    size="sm"
                    variant="outlined"
                    color="neutral"
                    fullWidth
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
                    Copy Link
                  </Button>
                  <Button
                    size="sm"
                    variant="solid"
                    color="primary"
                    fullWidth
                    onClick={() => handleGenerateQr(true)}
                    disabled={qrLoading}
                  >
                    {qrLoading ? "Regenerating..." : "Regenerate"}
                  </Button>
                </Stack>
              </>
            )}
          </Stack>
        </ModalDialog>
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
