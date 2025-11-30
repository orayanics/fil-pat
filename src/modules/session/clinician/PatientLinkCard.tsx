"use client";
import { useState, useEffect } from "react";
import { Card, Typography, Button, Stack, Input, Tooltip, Chip, Box, Modal, ModalDialog, ModalClose, IconButton } from "@mui/joy";
import { ContentCopy, QrCode2, CheckCircle, Share, Refresh } from "@mui/icons-material";
import { useSocketStore } from "@/context/socketStore";
import { useSocketContext } from "@/context/SocketProvider";

export default function PatientLinkCard() {
  const sessionInfo = useSocketStore((s) => s.sessionInfo);
  const sessionId = useSocketStore((s) => s.sessionId);
  const { socket } = useSocketContext();
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [qrLoading, setQrLoading] = useState(false);

  const patientUrl = sessionInfo?.patientUrl;

  if (!patientUrl) {
    return null;
  }

  const handleCopy = async () => {
    try {
      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(patientUrl);
      } else {
        const ta = document.createElement('textarea');
        ta.value = patientUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Assessment Session',
          text: 'Click this link to join the speech assessment session',
          url: patientUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    }
  };

  const handleGenerateNewLink = async () => {
    if (!socket || !sessionId) return;
    setGenerating(true);
    try {
      socket.send(JSON.stringify({
        type: 'generateSessionLink',
        sessionId
      }));
    } catch (err) {
      console.error('Failed to generate new link:', err);
      setGenerating(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!patientUrl) return;
    setQrLoading(true);
    try {
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL(patientUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(dataUrl);
      setQrModalOpen(true);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    } finally {
      setQrLoading(false);
    }
  };

  return (
    <Card
      variant="soft"
      color="primary"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: "lg",
        boxShadow: "md",
        background: "linear-gradient(135deg, var(--joy-palette-primary-softBg) 0%, var(--joy-palette-primary-softHoverBg) 100%)",
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <QrCode2 sx={{ fontSize: 28 }} />
            <Typography level="title-lg" sx={{ fontWeight: 700 }}>
              Patient Join Link
            </Typography>
          </Stack>
          <Chip 
            size="sm" 
            variant="solid" 
            color="success"
            startDecorator={<CheckCircle />}
          >
            Session Active
          </Chip>
        </Stack>
        
        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
          Share this link or QR code with the patient to join the assessment session. The patient can access this on any device with a web browser.
        </Typography>
        
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="stretch">
          <Input
            value={patientUrl}
            readOnly
            sx={{
              flex: 1,
              fontFamily: 'monospace',
              fontSize: { xs: '0.75rem', sm: '0.85rem' },
              bgcolor: 'background.surface',
              '--Input-focusedHighlight': 'transparent',
            }}
          />
          <Stack direction="row" spacing={1}>
            <Tooltip title={copied ? "Copied!" : "Copy link"} placement="top">
              <Button
                variant="solid"
                color={copied ? "success" : "primary"}
                onClick={handleCopy}
                startDecorator={copied ? <CheckCircle /> : <ContentCopy />}
                sx={{ 
                  minWidth: { xs: "auto", sm: "100px" },
                  whiteSpace: "nowrap"
                }}
              >
                {copied ? "Copied!" : "Copy"}
              </Button>
            </Tooltip>
            
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Tooltip title="Share via device" placement="top">
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleShare}
                  sx={{ 
                    minWidth: "48px",
                    px: 1
                  }}
                >
                  <Share />
                </Button>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <Tooltip title="Show QR code for patient" placement="top">
            <Button
              variant="solid"
              size="sm"
              color="primary"
              onClick={handleGenerateQR}
              loading={qrLoading}
              startDecorator={<QrCode2 />}
            >
              Show QR Code
            </Button>
          </Tooltip>
          <Tooltip title="Generate new link for patient to rejoin" placement="top">
            <Button
              variant="outlined"
              size="sm"
              color="neutral"
              onClick={handleGenerateNewLink}
              loading={generating}
              startDecorator={<Refresh />}
            >
              Generate New Link
            </Button>
          </Tooltip>
        </Stack>

        <Box 
          sx={{ 
            display: "flex", 
            gap: 1, 
            flexWrap: "wrap",
            pt: 1,
            borderTop: "1px solid",
            borderColor: "divider"
          }}
        >
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            💡 Tip: Patient can scan QR code or manually type this link
          </Typography>
        </Box>
      </Stack>

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
          <Stack spacing={2} alignItems="center">
            <Typography level="h4" sx={{ fontWeight: 700 }}>
              Patient Session QR Code
            </Typography>
            <Typography level="body-sm" textAlign="center" sx={{ color: 'text.secondary' }}>
              Patient can scan this QR code with their device camera to join the session
            </Typography>
            {qrDataUrl && (
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
                  src={qrDataUrl} 
                  alt="Session QR Code" 
                  style={{ 
                    display: 'block',
                    width: '100%',
                    maxWidth: '400px',
                    height: 'auto'
                  }} 
                />
              </Box>
            )}
            <Typography level="body-xs" sx={{ color: 'text.tertiary', textAlign: 'center' }}>
              {patientUrl}
            </Typography>
          </Stack>
        </ModalDialog>
      </Modal>
    </Card>
  );
}
