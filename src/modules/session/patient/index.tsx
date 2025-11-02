"use client";
import React from "react";
import { useSocketStore } from "@/context/socketStore";
import { Box, CircularProgress, Card, Typography, Button } from "@mui/joy";
import Image from "next/image";

export default function Index() {
  const sessionStarted = useSocketStore((s) => s.sessionStarted);
  const sessionInfo = useSocketStore((s) => s.sessionInfo);
  const currentItem = useSocketStore((s) => s.currentItem);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const sid = sessionInfo?.session_uuid ?? null;
    if (sid) {
      console.log('Patient attempting to connect to session:', sid);
      console.log('Current URL:', window.location.href);
      // Compute the expected WebSocket URL for debugging
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const envHost = process.env.NEXT_PUBLIC_WEBSOCKET_HOST;
        const envPort = process.env.NEXT_PUBLIC_WEBSOCKET_PORT;
        const host = envHost || window.location.hostname || 'localhost';
        const port = envPort || '8080';
        const wsUrl = `${protocol}//${host}:${port}`;
        console.log('WebSocket URL (expected):', wsUrl);
      } catch (err) {
        console.log('Could not compute WebSocket URL for debug', err);
      }
    }
  }, [sessionInfo]);

  // If session started show the item (image + question)
  if (sessionStarted && currentItem) {
    return (
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100dvh' }}>
        <Card sx={{ width: '100%', maxWidth: 1100, display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, p: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ width: '100%', height: { xs: 260, sm: 360, md: 520 }, position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
              <Image
                src={currentItem.image_url || 'https://placehold.co/800x520/png?text=Filipino+PAT'}
                alt={currentItem.question || 'Session image'}
                fill
                style={{ objectFit: 'cover' }}
              />
            </Box>
          </Box>

          <Box sx={{ width: { xs: '100%', md: 420 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography level="h3">Item {currentItem.item}</Typography>
            <Typography level="body-lg" sx={{ fontWeight: 700 }}>{currentItem.question}</Typography>
            {currentItem.sound && (
              <Button variant="outlined" onClick={() => { try { const a = new Audio(currentItem.sound); a.play(); } catch {} }}>Play Sound</Button>
            )}

            <Box sx={{ mt: 'auto' }}>
              <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                Assigned template: <strong>{sessionInfo?.template_name ?? '—'}</strong>
              </Typography>
            </Box>
          </Box>
        </Card>
      </Box>
    );
  }

  // Lobby view while waiting for clinician to assign template and start
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', gap: 2, p: 2 }}>
      <CircularProgress />
      <Typography level="h4" sx={{ fontWeight: 700 }}>Waiting for clinician...</Typography>
      {sessionInfo?.template_name ? (
        <Typography>Assigned template: <strong>{sessionInfo.template_name}</strong></Typography>
      ) : (
        <Typography>No template selected yet.</Typography>
      )}
      <Typography level="body-sm" sx={{ color: 'neutral.500' }}>{sessionInfo?.session_uuid ? `Session: ${sessionInfo.session_uuid}` : ''}</Typography>
      <Typography sx={{ mt: 2, maxWidth: 560, textAlign: 'center', color: 'neutral.600' }}>
        When the clinician assigns a template and starts the session, the assessment will begin automatically on this device.
      </Typography>
    </Box>
  );
}
