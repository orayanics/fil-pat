"use client";
import { useParams } from "next/navigation";
import { SaveRounded, StopCircleRounded, PictureAsPdfRounded, QrCode2, CheckCircle } from "@mui/icons-material";
import {
  Card,
  Tooltip,
  Button,
  Modal,
  ModalDialog,
  ModalClose,
  DialogTitle,
  DialogContent,
  DialogActions,
  Textarea,
  Typography,
  Stack,
  Box,
  Alert,
} from "@mui/joy";
import { useState, useEffect } from "react";
import { useSocketDispatch, useSocketContext } from "@/context/SocketProvider";
import { useSocketStore } from "@/context/socketStore";
import getLocalIp from "@/utils/getLocalIp";
import QRCodeLib from "qrcode";

export default function SessionActions() {
  const { saveSessionManually } = useSocketDispatch();
  const { endSession } = useSocketContext();
  const params = useParams();
  const sessionId = params?.id;
  const sessionInfo = useSocketStore((s) => s.sessionInfo);
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const showEndModal = useSocketStore((s) => s.showEndModal);
  const setShowEndModal = useSocketStore((s) => s.setShowEndModal);
  
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<string | null>(null);
  const [qrLink, setQrLink] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [copyLinkSuccess, setCopyLinkSuccess] = useState(false);
  
  // Save feedback state
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(true);
  
  // Listen for save events
  useEffect(() => {
    const handleSessionSaved = (event: CustomEvent) => {
      setSaveSuccess(event.detail.success);
      setShowSaveAlert(true);
      setTimeout(() => setShowSaveAlert(false), 3000);
    };
    
    window.addEventListener('sessionSaved', handleSessionSaved as EventListener);
    return () => window.removeEventListener('sessionSaved', handleSessionSaved as EventListener);
  }, []);

  const handleGenerateQr = async () => {
    if (!sessionInfo?.session_uuid && !sessionId) return;
    
    setQrLoading(true);
    try {
      const localIp = await getLocalIp();
      const protocol = window.location.protocol;
      const port = window.location.port ? `:${window.location.port}` : "";
      const hostToUse = window.location.hostname || localIp || "localhost";
      const useSessionId = sessionInfo?.session_uuid || sessionId;
      const url = `${protocol}//${hostToUse}${port}/session/patient/${useSessionId}`;
      const dataUrl = await QRCodeLib.toDataURL(url, { width: 240, margin: 1 });
      setQrData(dataUrl);
      setQrLink(url);
      setQrModalOpen(true);
    } catch (err) {
      console.error("Failed to create QR", err);
    } finally {
      setQrLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!qrLink) return;
    
    try {
      const textToCopy = qrLink;
      
      // Method 1: Modern Clipboard API
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setCopyLinkSuccess(true);
        setTimeout(() => setCopyLinkSuccess(false), 2000);
        console.log('Link copied to clipboard');
        return;
      }
      
      // Method 2: Create temporary input element (more reliable than textarea)
      const input = document.createElement('input');
      input.value = textToCopy;
      input.style.position = 'absolute';
      input.style.opacity = '0';
      input.style.left = '-9999px';
      document.body.appendChild(input);
      
      // Select the text
      input.select();
      input.setSelectionRange(0, 99999); // For mobile devices
      
      // Copy the text
      const successful = document.execCommand('copy');
      document.body.removeChild(input);
      
      if (successful) {
        setCopyLinkSuccess(true);
        setTimeout(() => setCopyLinkSuccess(false), 2000);
        console.log('Link copied using fallback method');
      } else {
        throw new Error('execCommand returned false');
      }
    } catch (err) {
      console.error('Failed to copy:', err);
      // Show the link in a prompt as final fallback
      window.prompt('Copy this link manually:', qrLink);
    }
  };

  const handleEndConfirmed = async () => {
    try {
      await saveSessionManually();
    } catch (err) {
      console.error("Failed to save before ending session:", err);
    }

    endSession(summary || undefined, notes || undefined);
    setShowEndModal(false);
  };

  return (
    <>
      {/* Save Feedback Alert */}
      {showSaveAlert && (
        <Alert
          color={saveSuccess ? "success" : "danger"}
          variant="soft"
          startDecorator={saveSuccess ? <CheckCircle /> : undefined}
          sx={{
            mb: 2,
            animation: "slideDown 0.3s ease-out",
            "@keyframes slideDown": {
              from: { opacity: 0, transform: "translateY(-20px)" },
              to: { opacity: 1, transform: "translateY(0)" }
            }
          }}
        >
          {saveSuccess ? "Session saved successfully!" : "Failed to save session. Please try again."}
        </Alert>
      )}
      
      {/* Session Controls */}
      <Card
        variant="outlined"
        sx={{
          display: "grid",
          gridTemplateColumns: { 
            xs: "1fr", 
            sm: "repeat(2, 1fr)", 
            md: "repeat(4, 1fr)" 
          },
          gap: 2,
          p: 2.5,
          borderRadius: "lg",
          boxShadow: "sm",
          background: "linear-gradient(145deg, rgba(255,255,255,0.9), rgba(250,251,252,1))",
        }}
      >
        <Tooltip title="Save all responses manually. Auto-saves every 5 minutes." placement="top">
          <Button
            startDecorator={<SaveRounded />}
            variant="soft"
            color="success"
            onClick={saveSessionManually}
            size="lg"
            sx={{ 
              minHeight: "56px",
              fontWeight: 600,
              transition: "all 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "md"
              }
            }}
          >
            Save
          </Button>
        </Tooltip>

        <Tooltip title="Generate QR code for patient access." placement="top">
          <Button
            startDecorator={<QrCode2 />}
            variant="soft"
            color="primary"
            onClick={handleGenerateQr}
            loading={qrLoading}
            size="lg"
            sx={{ 
              minHeight: "56px",
              fontWeight: 600,
              transition: "all 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "md"
              }
            }}
          >
            QR Code
          </Button>
        </Tooltip>

        <Tooltip title="Preview session PDF report." placement="top">
          <Button
            startDecorator={<PictureAsPdfRounded />}
            variant="soft"
            color="neutral"
            onClick={() => {
              saveSessionManually();
              window.open(`/pdf/${sessionId}`, "_blank", "noopener,noreferrer");
            }}
            size="lg"
            sx={{ 
              minHeight: "56px",
              fontWeight: 600,
              transition: "all 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "md"
              }
            }}
          >
            PDF
          </Button>
        </Tooltip>

        <Tooltip title="Complete session and add final notes." placement="top">
          <Button
            startDecorator={<StopCircleRounded />}
            variant="solid"
            color="danger"
            onClick={() => setShowEndModal(true)}
            size="lg"
            sx={{ 
              minHeight: "56px",
              fontWeight: 600,
              transition: "all 0.2s",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: "md"
              }
            }}
          >
            End
          </Button>
        </Tooltip>
      </Card>

      {/* Modern Modal */}
      <Modal
        open={showEndModal}
        onClose={() => setShowEndModal(false)}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backdropFilter: "blur(8px)",
        }}
      >
        <ModalDialog
          layout="center"
          variant="outlined"
          sx={{
            maxWidth: 650,
            width: "100%",
            borderRadius: "xl",
            boxShadow: "lg",
            p: { xs: 2, sm: 3 },
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(245,246,250,0.95))",
          }}
        >
          <ModalClose variant="plain" sx={{ m: 1 }} />
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1.3rem" }}>
            End Session
          </DialogTitle>
          <DialogContent sx={{ mt: 0.5 }}>
            <Typography level="body-sm" sx={{ mb: 2, opacity: 0.8 }}>
              Please provide a brief session summary and any notes you would like to
              save with this session record.
            </Typography>

            <Stack spacing={2}>
              <div>
                <Typography level="body-sm" fontWeight={600}>
                  Session Summary
                </Typography>
                <Textarea
                  minRows={2}
                  variant="soft"
                  placeholder="Brief summary of the session (optional)"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>

              <div>
                <Typography level="body-sm" fontWeight={600}>
                  Post-session Notes
                </Typography>
                <Textarea
                  minRows={4}
                  variant="soft"
                  placeholder="Detailed notes, observations, or recommendations"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setShowEndModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="danger"
              onClick={handleEndConfirmed}
            >
              End Session & Save
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>

      {/* QR Code Modal */}
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
          <DialogTitle>Patient Session QR Code</DialogTitle>
          <DialogContent>
            <Stack spacing={2} alignItems="center">
              <Typography level="body-sm" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                {sessionInfo?.session_name || 'Current Session'}
              </Typography>
              {qrData && (
                <Box
                  component="img"
                  src={qrData}
                  alt="Session QR Code"
                  sx={{
                    width: 240,
                    height: 240,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 'sm',
                  }}
                />
              )}
              {qrLink && (
                <Box sx={{ width: '100%' }}>
                  <Typography level="body-sm" sx={{ mb: 1 }}>
                    Or share this link:
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: 'background.level1',
                      borderRadius: 'sm',
                      wordBreak: 'break-all',
                      fontFamily: 'monospace',
                      fontSize: 'sm',
                    }}
                  >
                    {qrLink}
                  </Box>
                  <Button
                    size="sm"
                    variant="soft"
                    color={copyLinkSuccess ? "success" : "primary"}
                    fullWidth
                    sx={{ mt: 1 }}
                    onClick={copyToClipboard}
                    startDecorator={copyLinkSuccess ? <CheckCircle /> : undefined}
                  >
                    {copyLinkSuccess ? "✓ Copied!" : "Copy Link"}
                  </Button>
                </Box>
              )}
            </Stack>
          </DialogContent>
        </ModalDialog>
      </Modal>
    </>
  );
}
