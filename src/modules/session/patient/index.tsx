"use client";
import React, { useEffect } from "react";
import { useParams } from "next/navigation";
import { useSocketStore } from "@/context/socketStore";
import { useSocketContext } from "@/context/SocketProvider";
import { Box, CircularProgress, Card, Typography, Button } from "@mui/joy";
import Image from "next/image";
import PatientFinalizeModal from "./PatientFinalizeModal";

export default function Index() {
  const params = useParams();
  const sessionId = params?.id as string;
  const { socket } = useSocketContext();
  const sessionStarted = useSocketStore((s) => s.sessionStarted);
  const sessionInfo = useSocketStore((s) => s.sessionInfo);
  const currentItem = useSocketStore((s) => s.currentItem);

  // Check if this is a kids template
  const isKidsMode = sessionInfo?.is_for_kids ?? false;
  
  // Auto-start resumed sessions
  useEffect(() => {
    if (!sessionInfo || !socket || sessionStarted) return;
    
    // Check if this is a resumed session
    const isResumed = sessionInfo.is_resumed === true;
    
    console.log('Patient session info received:', {
      session_uuid: sessionInfo.session_uuid,
      session_name: sessionInfo.session_name,
      template_name: sessionInfo.template_name,
      is_resumed: sessionInfo.is_resumed,
      isResumed: isResumed,
      sessionStarted: sessionStarted
    });
    
    if (isResumed && sessionInfo.session_uuid && sessionInfo.template_name) {
      console.log('Auto-starting resumed session:', sessionInfo.session_uuid);
      
      // Small delay to ensure WebSocket is ready
      const timer = setTimeout(() => {
        try {
          socket.send(JSON.stringify({
            type: 'loadSession',
            sessionId: sessionInfo.session_uuid
          }));
          
          // Then start the session
          setTimeout(() => {
            socket.send(JSON.stringify({
              type: 'startSession',
              sessionId: sessionInfo.session_uuid
            }));
          }, 500);
        } catch (error) {
          console.error('Failed to auto-start resumed session:', error);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [sessionInfo, socket, sessionStarted]);

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
      <>
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100dvh',
            background: isKidsMode
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'background.body',
          }}
        >
          <Card
            sx={{
              width: '100%',
              maxWidth: isKidsMode ? 1200 : 1100,
              display: 'flex',
              gap: 2,
              flexDirection: { xs: 'column', md: 'row' },
              p: isKidsMode ? 4 : 2,
              borderRadius: isKidsMode ? 6 : 2,
              boxShadow: isKidsMode ? 'xl' : 'md',
              background: isKidsMode
                ? 'linear-gradient(to bottom, #ffffff, #fef3c7)'
                : 'background.surface',
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box
                sx={{
                  width: '100%',
                  height: { xs: 260, sm: 360, md: 520 },
                  position: 'relative',
                  borderRadius: isKidsMode ? 4 : 2,
                  overflow: 'hidden',
                  border: isKidsMode ? '6px solid' : 'none',
                  borderColor: isKidsMode ? '#f59e0b' : 'transparent',
                  boxShadow: isKidsMode ? 'lg' : 'none',
                }}
              >
                <Image
                  src={
                    currentItem.image_url 
                      ? (currentItem.image_url.startsWith('data:') 
                          ? currentItem.image_url 
                          : currentItem.image_url.startsWith('http') 
                            ? currentItem.image_url 
                            : `data:image/png;base64,${currentItem.image_url}`)
                      : 'https://placehold.co/800x520/png?text=Filipino+PAT'
                  }
                  alt={currentItem.question || 'Session image'}
                  fill
                  style={{ objectFit: 'cover' }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                width: { xs: '100%', md: 420 },
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Typography
                level="h3"
                sx={{
                  fontSize: isKidsMode ? '2.5rem' : 'inherit',
                  fontWeight: 800,
                  color: isKidsMode ? '#7c3aed' : 'text.primary',
                  textShadow: isKidsMode ? '2px 2px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {isKidsMode ? `🌟 Question ${currentItem.item}` : `Item ${currentItem.item}`}
              </Typography>

              <Typography
                level="body-lg"
                sx={{
                  fontWeight: 700,
                  fontSize: isKidsMode ? '1.5rem' : 'inherit',
                  color: isKidsMode ? '#1e40af' : 'text.primary',
                  lineHeight: 1.6,
                }}
              >
                {currentItem.question}
              </Typography>

              {currentItem.sound && (
                <Button
                  variant={isKidsMode ? 'solid' : 'outlined'}
                  size={isKidsMode ? 'lg' : 'md'}
                  sx={{
                    ...(isKidsMode && {
                      bgcolor: '#10b981',
                      '&:hover': { bgcolor: '#059669' },
                      fontSize: '1.25rem',
                      fontWeight: 700,
                      borderRadius: 4,
                      py: 1.5,
                    }),
                  }}
                  onClick={() => {
                    try {
                      const a = new Audio(currentItem.sound);
                      a.play();
                    } catch {}
                  }}
                >
                  {isKidsMode ? '🔊 Play Sound' : 'Play Sound'}
                </Button>
              )}

              <Box sx={{ mt: 'auto' }}>
                <Typography
                  level="body-sm"
                  sx={{
                    color: isKidsMode ? '#6b7280' : 'text.secondary',
                    fontSize: isKidsMode ? '1rem' : 'inherit',
                  }}
                >
                  {isKidsMode ? '📋 ' : ''}Template:{' '}
                  <strong>{sessionInfo?.template_name ?? '—'}</strong>
                </Typography>
              </Box>
            </Box>
          </Card>
        </Box>

        {/* Patient Finalization Modal */}
        {sessionId && <PatientFinalizeModal sessionId={sessionId} />}
      </>
    );
  }

  // Lobby view while waiting for clinician to assign template and start
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          gap: 2,
          p: 2,
          background: isKidsMode
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'background.body',
        }}
      >
        <Card
          sx={{
            p: 4,
            maxWidth: 600,
            textAlign: 'center',
            borderRadius: isKidsMode ? 6 : 2,
            background: isKidsMode
              ? 'linear-gradient(to bottom, #ffffff, #fef3c7)'
              : 'background.surface',
            boxShadow: isKidsMode ? 'xl' : 'md',
          }}
        >
          <CircularProgress
            size={isKidsMode ? 'lg' : 'md'}
            sx={{
              ...(isKidsMode && {
                '--CircularProgress-size': '80px',
                '--CircularProgress-trackThickness': '8px',
                '--CircularProgress-progressThickness': '8px',
              }),
            }}
          />
          <Typography
            level="h4"
            sx={{
              fontWeight: 700,
              mt: 2,
              fontSize: isKidsMode ? '2rem' : 'inherit',
              color: isKidsMode ? '#7c3aed' : 'text.primary',
            }}
          >
            {sessionInfo?.is_resumed 
              ? (isKidsMode ? '🎈 Loading Your Activity...' : 'Loading session...')
              : (isKidsMode ? '🎈 Getting Ready...' : 'Waiting for clinician...')
            }
          </Typography>

          {sessionInfo?.template_name ? (
            <Typography
              sx={{
                mt: 2,
                fontSize: isKidsMode ? '1.25rem' : 'inherit',
                color: isKidsMode ? '#1e40af' : 'text.primary',
              }}
            >
              {isKidsMode ? '📝 Activity: ' : 'Assigned template: '}
              <strong>{sessionInfo.template_name}</strong>
            </Typography>
          ) : (
            <Typography
              sx={{
                mt: 2,
                fontSize: isKidsMode ? '1.25rem' : 'inherit',
                color: isKidsMode ? '#6b7280' : 'text.secondary',
              }}
            >
              {isKidsMode
                ? '⏳ Waiting for your activity...'
                : 'No template selected yet.'}
            </Typography>
          )}

          {sessionInfo?.session_name && (
            <Typography
              sx={{
                mt: 1,
                fontSize: isKidsMode ? '1rem' : 'body-sm',
                color: isKidsMode ? '#6b7280' : 'text.secondary',
              }}
            >
              📋 Session: <strong>{sessionInfo.session_name}</strong>
            </Typography>
          )}

          {sessionInfo?.session_uuid && (
            <Typography
              level="body-sm"
              sx={{
                color: 'neutral.500',
                mt: 1,
                fontSize: isKidsMode ? '0.95rem' : 'inherit',
              }}
            >
              Session: {sessionInfo.session_uuid}
            </Typography>
          )}

          <Typography
            sx={{
              mt: 3,
              color: isKidsMode ? '#6b7280' : 'neutral.600',
              fontSize: isKidsMode ? '1.1rem' : 'inherit',
              lineHeight: 1.6,
            }}
          >
            {sessionInfo?.is_resumed
              ? (isKidsMode
                  ? "🌈 We're getting your activity ready! Just a moment..."
                  : 'Resuming your assessment session. This will start automatically.')
              : (isKidsMode
                  ? "🌈 Your teacher will start the fun activity soon! Get ready to show what you know!"
                  : 'When the clinician assigns a template and starts the session, the assessment will begin automatically on this device.')
            }
          </Typography>

          {/* Manual start button for resumed sessions as fallback */}
          {sessionInfo?.is_resumed && sessionInfo?.template_name && !sessionStarted && (
            <Button
              variant="solid"
              color="primary"
              size="lg"
              sx={{ mt: 3 }}
              onClick={() => {
                if (socket && sessionInfo?.session_uuid) {
                  console.log('Manual start button clicked for resumed session');
                  socket.send(JSON.stringify({
                    type: 'startSession',
                    sessionId: sessionInfo.session_uuid
                  }));
                }
              }}
            >
              {isKidsMode ? '🚀 Start Activity Now' : '▶️ Start Session'}
            </Button>
          )}
        </Card>
      </Box>

      {/* Patient Finalization Modal */}
      {sessionId && <PatientFinalizeModal sessionId={sessionId} />}
    </>
  );
}
