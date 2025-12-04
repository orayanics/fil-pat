"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useSocketStore } from "@/context/socketStore";
import { useSocketContext } from "@/context/SocketProvider";
import { Box, CircularProgress, Card, Typography, Button, Stack, Chip } from "@mui/joy";
import Image from "next/image";
import PatientFinalizeModal from "./PatientFinalizeModal";
import { jungleAdventureTheme } from "@/styles/kids-themes/jungle-adventure";
import { oceanFriendsTheme } from "@/styles/kids-themes/ocean-friends";
import { spaceExplorerTheme } from "@/styles/kids-themes/space-explorer";
import { keyframes } from "@mui/system";

// Modern animations - more subtle
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const fadeInSoft = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
`;

const slideOut = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(50px);
  }
`;

const slideInFromRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const kidsThemes = [jungleAdventureTheme, oceanFriendsTheme, spaceExplorerTheme];

export default function Index() {
  const params = useParams();
  const sessionId = params?.id as string;
  const { socket } = useSocketContext();
  const sessionStarted = useSocketStore((s) => s.sessionStarted);
  const sessionInfo = useSocketStore((s) => s.sessionInfo);
  const currentItem = useSocketStore((s) => s.currentItem);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [noClinicianPresent, setNoClinicianPresent] = useState(false);
  const [itemKey, setItemKey] = useState(0); // Key to trigger re-animation on item change
  const [showWaitingOverlay, setShowWaitingOverlay] = useState(false);
  const [hasSessionStartedBefore, setHasSessionStartedBefore] = useState(false);
  const [showTargetWord, setShowTargetWord] = useState(false);
  const [targetWord, setTargetWord] = useState<string>('');

  // Check if this is a kids template
  const isKidsMode = sessionInfo?.is_for_kids ?? false;
  
  // Randomly select a theme for this session (memoized so it stays consistent)
  const theme = useMemo(() => {
    if (!isKidsMode) return null;
    return kidsThemes[Math.floor(Math.random() * kidsThemes.length)];
  }, [isKidsMode, sessionId]); // Re-pick theme per session

  // Check if session has started before (localStorage persistence)
  useEffect(() => {
    if (sessionId) {
      const key = `session_${sessionId}_started`;
      const hasStarted = localStorage.getItem(key) === 'true';
      setHasSessionStartedBefore(hasStarted);
    }
  }, [sessionId]);

  // Show overlay only if session has template but hasn't started yet and never started before
  useEffect(() => {
    if (sessionInfo?.template_name && !sessionStarted && !hasSessionStartedBefore && currentItem) {
      setShowWaitingOverlay(true);
    } else {
      setShowWaitingOverlay(false);
    }
  }, [sessionInfo?.template_name, sessionStarted, hasSessionStartedBefore, currentItem]);

  // Mark session as started once it starts
  useEffect(() => {
    if (sessionStarted && sessionId) {
      const key = `session_${sessionId}_started`;
      localStorage.setItem(key, 'true');
      setHasSessionStartedBefore(true);
      setShowWaitingOverlay(false);
    }
  }, [sessionStarted, sessionId]);

  // Track item changes and trigger animation
  useEffect(() => {
    if (currentItem) {
      setItemKey(prev => prev + 1);
    }
  }, [currentItem?.item_id, currentItem?.item]);
  
  // Listen for session state changes and reload page when session starts
  useEffect(() => {
    if (!socket) return;
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle session started - reload the page to get fresh state
        if (data.type === 'sessionStarted') {
          console.log('[Patient] Session started, reloading page...');
          window.location.reload();
        }

        // Handle item change - trigger animation
        if (data.type === 'changeAssessmentItem' || data.type === 'currentItemUpdate') {
          console.log('[Patient] Item changed, triggering animation');
          setItemKey(prev => prev + 1);
          // Hide target word when item changes
          setShowTargetWord(false);
          setTargetWord('');
        }
        
        // Handle target word toggle
        if (data.type === 'toggleTargetWord') {
          console.log('[Patient] Target word toggle:', data.show, data.targetWord);
          setShowTargetWord(data.show);
          setTargetWord(data.targetWord || '');
        }
        
        // Handle session completed - close WebSocket to prevent reconnection
        if (data.type === 'sessionCompleted' || data.type === 'sessionEnded') {
          console.log('[Patient] Session completed, closing WebSocket connection');
          setSessionEnded(true);
          try {
            socket.close(1000, 'Session completed');
          } catch (err) {
            console.error('[Patient] Failed to close socket:', err);
          }
        }
        
        // Handle no clinician present
        if (data.type === 'error' && data.message === 'noClinicianPresent') {
          console.log('[Patient] No clinician present in session');
          setNoClinicianPresent(true);
        }
      } catch {
        // Ignore parse errors
      }
    };
    
    socket.addEventListener('message', handleMessage);
    return () => socket.removeEventListener('message', handleMessage);
  }, [socket]);
  
  // Check if session has ended (status is Completed)
  useEffect(() => {
    if (sessionInfo?.status === 'Completed') {
      console.log('[Patient] Session has ended (from sessionInfo), showing completion message');
      setSessionEnded(true);
      setNoClinicianPresent(false);
    }
  }, [sessionInfo?.status]);
  
  // Check if session is ended on initial load (before WebSocket connects)
  useEffect(() => {
    if (!sessionId) return;
    
    const checkSessionStatus = async () => {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`, { 
          credentials: 'include' 
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'Completed') {
            console.log('[Patient] Session is completed (from API), showing end message');
            setSessionEnded(true);
            setNoClinicianPresent(false);
          }
        }
      } catch (err) {
        console.error('Failed to check session status:', err);
      }
    };
    
    // Check status immediately
    checkSessionStatus();
  }, [sessionId]);
  
  // Log session info for debugging and force re-render when sessionInfo changes
  useEffect(() => {
    if (!sessionInfo) return;
    
    console.log('Patient session info updated:', {
      session_uuid: sessionInfo.session_uuid,
      session_name: sessionInfo.session_name,
      template_name: sessionInfo.template_name,
      is_resumed: sessionInfo.is_resumed,
      sessionStarted: sessionStarted,
      patient_id: sessionInfo.patient_id,
      status: sessionInfo.status,
      hasCurrentItem: !!currentItem
    });
    
    // Force a re-render by updating local state when template changes
    setNoClinicianPresent(false);
  }, [sessionInfo, sessionStarted, currentItem]);

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

  // If no clinician present, show waiting message
  if (noClinicianPresent) {
    const bgColor = isKidsMode && theme ? theme.colors.background : '#F8F9FA';
    
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          gap: 3,
          p: 3,
          background: bgColor,
          animation: `${fadeIn} 0.6s ease-out`,
        }}
      >
        <Box
          sx={{
            animation: `${float} 3s ease-in-out infinite`,
            fontSize: '120px',
            mb: 2,
          }}
        >
          {isKidsMode ? '⏰' : '⏳'}
        </Box>
        <Card
          sx={{
            p: 4,
            maxWidth: 600,
            textAlign: 'center',
            borderRadius: 4,
            background: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: 'none',
            animation: `${scaleIn} 0.5s ease-out 0.2s backwards`,
          }}
        >
          <Typography
            level="h2"
            sx={{
              fontWeight: 800,
              fontSize: isKidsMode ? '2.5rem' : '2rem',
              background: isKidsMode
                ? 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 50%, #6BCB77 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            {isKidsMode ? 'Please Wait!' : 'Clinician Not Present'}
          </Typography>
          <Typography
            sx={{
              fontSize: isKidsMode ? '1.25rem' : '1.1rem',
              color: '#666',
              lineHeight: 1.8,
              fontWeight: 500,
            }}
          >
            {isKidsMode
              ? 'Your teacher hasn\'t started the activity yet. Please wait while they set things up!'
              : 'The clinician has not joined this session yet. Please wait for the clinician to start the session, or contact them for assistance.'}
          </Typography>
        </Card>
      </Box>
    );
  }
  
  // If session has ended, show completion message
  if (sessionEnded) {
    const bgColor = isKidsMode && theme ? theme.colors.background : '#F8F9FA';
    
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          gap: 3,
          p: 3,
          background: bgColor,
          animation: `${fadeIn} 0.6s ease-out`,
        }}
      >
        <Box
          sx={{
            animation: `${float} 3s ease-in-out infinite`,
            fontSize: '120px',
            mb: 2,
          }}
        >
          {isKidsMode ? '🎉' : '✓'}
        </Box>
        <Card
          sx={{
            p: 4,
            maxWidth: 600,
            textAlign: 'center',
            borderRadius: 4,
            background: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: 'none',
            animation: `${scaleIn} 0.5s ease-out 0.2s backwards`,
          }}
        >
          <Typography
            level="h2"
            sx={{
              fontWeight: 800,
              fontSize: isKidsMode ? '2.5rem' : '2rem',
              background: isKidsMode
                ? 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2,
            }}
          >
            {isKidsMode ? 'Activity Completed!' : 'Session Ended'}
          </Typography>
          <Typography
            sx={{
              fontSize: isKidsMode ? '1.25rem' : '1.1rem',
              color: '#666',
              lineHeight: 1.8,
              fontWeight: 500,
            }}
          >
            {isKidsMode
              ? 'Great job! This activity has been completed. Ask your teacher if you need help.'
              : 'This assessment session has been completed and is no longer active. Please contact your clinician if you have any questions.'}
          </Typography>
        </Card>
      </Box>
    );
  }
  
  // If session started show the item (image + question)
  if (sessionStarted && currentItem) {
    const bgColor = isKidsMode && theme ? theme.colors.background : '#F8F9FA';
    
    return (
      <>
        <Box
          key={itemKey}
          sx={{
            minHeight: '100dvh',
            background: bgColor,
            py: 4,
            px: { xs: 2, md: 4 },
            position: 'relative',
          }}
        >
          {/* Waiting for Clinician Overlay - shows only before first start */}
          {showWaitingOverlay && (
            <Box
              sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                animation: `${fadeIn} 0.4s ease-out`,
              }}
            >
              <Card
                sx={{
                  p: 5,
                  maxWidth: 500,
                  textAlign: 'center',
                  borderRadius: 4,
                  background: 'white',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
                  border: 'none',
                  animation: `${scaleIn} 0.5s ease-out 0.1s backwards`,
                }}
              >
                <Box
                  sx={{
                    animation: `${float} 3s ease-in-out infinite`,
                    fontSize: '100px',
                    mb: 2,
                  }}
                >
                  ⏳
                </Box>
                <Typography
                  level="h2"
                  sx={{
                    fontWeight: 800,
                    fontSize: '2rem',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 2,
                  }}
                >
                  {isKidsMode ? 'Ready to Start!' : 'Waiting for Clinician'}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '1.15rem',
                    color: '#666',
                    lineHeight: 1.8,
                    fontWeight: 500,
                  }}
                >
                  {isKidsMode
                    ? 'Your teacher will start the activity in just a moment. Get ready to have fun!'
                    : 'The clinician will start the session shortly. Please wait...'}
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <CircularProgress size="md" />
                </Box>
              </Card>
            </Box>
          )}

          {/* Header Progress */}
          <Box
            sx={{
              maxWidth: 1200,
              mx: 'auto',
              mb: 3,
              animation: `${fadeInSoft} 0.4s ease-out`,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Chip
                size="lg"
                variant="soft"
                color="primary"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  px: 2,
                  py: 1,
                  borderRadius: 3,
                }}
              >
                Question {currentItem.item}
              </Chip>
              {sessionInfo?.template_name && (
                <Typography
                  level="body-md"
                  sx={{
                    fontWeight: 600,
                    color: '#666',
                  }}
                >
                  {sessionInfo.template_name}
                </Typography>
              )}
            </Stack>
          </Box>

          {/* Main Content */}
          <Card
            sx={{
              maxWidth: 1200,
              mx: 'auto',
              p: { xs: 3, md: 5 },
              borderRadius: 4,
              background: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              border: 'none',
              animation: `${fadeIn} 0.5s ease-out`,
            }}
          >
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={4}
              alignItems="center"
            >
              {/* Image Section */}
              <Box
                sx={{
                  flex: 1,
                  width: '100%',
                  maxWidth: { xs: '100%', md: 600 },
                  animation: `${fadeInSoft} 0.5s ease-out 0.1s backwards`,
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '75%',
                    borderRadius: 3,
                    overflow: 'hidden',
                    background: '#F5F5F5',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                    border: isKidsMode ? '4px solid' : 'none',
                    borderColor: isKidsMode ? '#FFD93D' : 'transparent',
                  }}
                >
                  <Image
                    src={
                      currentItem.image_url 
                        ? (currentItem.image_url.startsWith('data:') 
                            ? currentItem.image_url 
                            : currentItem.image_url.startsWith('http') 
                              ? currentItem.image_url 
                              : currentItem.image_url.startsWith('/')
                                ? currentItem.image_url
                                : `data:image/png;base64,${currentItem.image_url}`)
                        : 'https://placehold.co/800x600/png?text=Image'
                    }
                    alt={currentItem.question || 'Session image'}
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                </Box>
              </Box>

              {/* Question Section */}
              <Box
                sx={{
                  flex: 1,
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                  animation: `${fadeIn} 0.5s ease-out 0.2s backwards`,
                }}
              >
                <Box>
                  <Typography
                    level="h2"
                    sx={{
                      fontSize: { xs: '2rem', md: '2.5rem' },
                      fontWeight: 800,
                      lineHeight: 1.3,
                      background: isKidsMode
                        ? 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 50%, #6BCB77 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 2,
                    }}
                  >
                    {currentItem.question}
                  </Typography>
                </Box>

                {/* Target Word Display - shown when clinician toggles it */}
                {showTargetWord && targetWord && (
                  <Box
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      background: isKidsMode
                        ? 'linear-gradient(135deg, #FFD93D 0%, #FFC93D 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      textAlign: 'center',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                      animation: `${scaleIn} 0.4s ease-out`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: isKidsMode ? '#8B4513' : 'white',
                        opacity: 0.9,
                        mb: 0.5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                      }}
                    >
                      Target Word
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: { xs: '2rem', md: '2.5rem' },
                        fontWeight: 900,
                        color: isKidsMode ? '#2D3436' : 'white',
                        textShadow: isKidsMode ? 'none' : '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      {targetWord}
                    </Typography>
                  </Box>
                )}

                {isKidsMode && (
                  <Box
                    sx={{
                      mt: 'auto',
                      p: 3,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: '#1976D2',
                      }}
                    >
                      💡 Take your time and answer when you're ready!
                    </Typography>
                  </Box>
                )}
              </Box>
            </Stack>
          </Card>
        </Box>

        {/* Patient Finalization Modal */}
        {sessionId && <PatientFinalizeModal sessionId={sessionId} />}
      </>
    );
  }

  // Lobby view while waiting for clinician to assign template and start
  const bgColor = isKidsMode && theme ? theme.colors.background : '#F8F9FA';
  
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          gap: 3,
          p: 3,
          background: bgColor,
          animation: `${fadeIn} 0.6s ease-out`,
        }}
      >
        {/* Animated mascot/loading icon */}
        <Box
          sx={{
            animation: `${float} 3s ease-in-out infinite`,
            fontSize: '100px',
            mb: 1,
          }}
        >
          {isKidsMode ? '🎈' : '⏳'}
        </Box>

        <Card
          sx={{
            p: 5,
            maxWidth: 650,
            width: '100%',
            textAlign: 'center',
            borderRadius: 4,
            background: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: 'none',
            animation: `${scaleIn} 0.5s ease-out 0.2s backwards`,
          }}
        >
          {/* Loading indicator */}
          <Box sx={{ mb: 3 }}>
            <CircularProgress
              size="lg"
              variant="soft"
              sx={{
                '--CircularProgress-size': '80px',
                '--CircularProgress-trackThickness': '8px',
                '--CircularProgress-progressThickness': '8px',
              }}
            />
          </Box>

          <Typography
            level="h2"
            sx={{
              fontWeight: 800,
              fontSize: isKidsMode ? '2.5rem' : '2rem',
              background: isKidsMode
                ? 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 50%, #6BCB77 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 3,
              animation: `${shimmer} 2s linear infinite`,
              backgroundSize: '200% auto',
            }}
          >
            {sessionInfo?.is_resumed 
              ? (isKidsMode ? 'Loading Your Activity...' : 'Loading Session...')
              : (isKidsMode ? 'Getting Ready...' : 'Waiting for Clinician...')
            }
          </Typography>

          {sessionInfo?.template_name ? (
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                background: isKidsMode
                  ? 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)'
                  : '#F5F7FA',
                mb: 3,
              }}
            >
              <Typography
                level="body-sm"
                sx={{
                  color: '#666',
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                {isKidsMode ? '🎯 Activity:' : 'Template:'}
              </Typography>
              <Typography
                level="h4"
                sx={{
                  fontWeight: 700,
                  color: isKidsMode ? '#4CAF50' : '#667eea',
                }}
              >
                {sessionInfo.template_name}
              </Typography>
            </Box>
          ) : (
            <Typography
              sx={{
                fontSize: '1.1rem',
                color: '#999',
                mb: 3,
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
                fontSize: '1rem',
                color: '#666',
                fontWeight: 500,
                mb: 2,
              }}
            >
              📋 Session: <strong>{sessionInfo.session_name}</strong>
            </Typography>
          )}

          {sessionInfo?.session_uuid && (
            <Typography
              level="body-sm"
              sx={{
                color: '#BBB',
                fontSize: '0.9rem',
              }}
            >
              ID: {sessionInfo.session_uuid}
            </Typography>
          )}

          <Box
            sx={{
              mt: 4,
              p: 3,
              borderRadius: 3,
              background: isKidsMode 
                ? 'linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%)'
                : '#EEF2F7',
            }}
          >
            <Typography
              sx={{
                fontSize: isKidsMode ? '1.15rem' : '1rem',
                color: '#666',
                lineHeight: 1.8,
                fontWeight: 500,
              }}
            >
              {sessionInfo?.is_resumed
                ? (isKidsMode
                    ? '🌈 We\'re getting your activity ready! Just a moment...'
                    : 'Resuming your assessment session. This will start automatically.')
                : (isKidsMode
                    ? '🎨 Your teacher will start the fun activity soon! Get ready to show what you know!'
                    : 'When the clinician assigns a template and starts the session, the assessment will begin automatically on this device.')
              }
            </Typography>
          </Box>

          {/* Manual start button for resumed sessions as fallback */}
          {sessionInfo?.is_resumed && sessionInfo?.template_name && !sessionStarted && (
            <Button
              variant="solid"
              size="lg"
              sx={{ 
                mt: 3,
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 700,
                borderRadius: 3,
                background: isKidsMode
                  ? 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
                  background: isKidsMode
                    ? 'linear-gradient(135deg, #FFD93D 0%, #FF6B6B 100%)'
                    : 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                }
              }}
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
              {isKidsMode ? '🚀 Start Activity Now' : '▶️ Resume Session'}
            </Button>
          )}
        </Card>
      </Box>

      {/* Patient Finalization Modal */}
      {sessionId && <PatientFinalizeModal sessionId={sessionId} />}
    </>
  );
}
