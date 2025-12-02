"use client";
import { createContext, useContext, useEffect, useCallback, useState, ReactNode } from "react";
import { useSocketStore } from "./socketStore";
import type { WebSocketMessage, SessionSettings, SessionResponsePayload, SocketContextType, PatientInfo, AssessmentItem } from "./socketStore";
import { useParams, useRouter } from "next/navigation";
import useWebSocket from "@/lib/useWebSocket";

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export default function SocketProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected, reconnect, disconnect } = useWebSocket();
  const router = useRouter();
  const params = useParams();
  const id = params && typeof params === 'object' && 'id' in params ? params.id : null;
  const connectionStatus = useSocketStore((state) => state.connectionStatus);
  const setConnectionStatus = useSocketStore((state) => state.setConnectionStatus);
  const user = useSocketStore((state) => state.user);
  const setUser = useSocketStore((state) => state.setUser);                                                                                                                                                                                                                                                                         
  const isAuthenticated = useSocketStore((state) => state.isAuthenticated);
  const setIsAuthenticated = useSocketStore((state) => state.setIsAuthenticated);
  const sessionId = useSocketStore((state) => state.sessionId);
  const setSessionId = useSocketStore((state) => state.setSessionId);
  const sessionInfo = useSocketStore((state) => state.sessionInfo);
  const setSessionInfo = useSocketStore((state) => state.setSessionInfo);
  const currentItem = useSocketStore((state) => state.currentItem);
  const setCurrentItem = useSocketStore((state) => state.setCurrentItem);
  const patientInfo = useSocketStore((state) => state.patientInfo);
  const setPatientInfo = useSocketStore((state) => state.setPatientInfo);
  const hasJoinedRoom = useSocketStore((state) => state.hasJoinedRoom);
  const setHasJoinedRoom = useSocketStore((state) => state.setHasJoinedRoom);
  const roomParticipants = useSocketStore((state) => state.roomParticipants);
  const setRoomParticipants = useSocketStore((state) => state.setRoomParticipants);
  const qrData = useSocketStore((state) => state.qrData);
  const setQrData = useSocketStore((state) => state.setQrData);
  const isKidsMode = useSocketStore((state) => state.isKidsMode);
  const setIsKidsMode = useSocketStore((state) => state.setIsKidsMode);
  const sessionStarted = useSocketStore((state) => state.sessionStarted);
  const setSessionStarted = useSocketStore((state) => state.setSessionStarted);
  const sessionPaused = useSocketStore((state) => state.sessionPaused);
  const setSessionPaused = useSocketStore((state) => state.setSessionPaused);
  const patientList = useSocketStore((state) => state.patientList);
  const setPatientList = useSocketStore((state) => state.setPatientList);
  const setTemplateItems = useSocketStore((state) => state.setTemplateItems);
  const setPatientConnected = useSocketStore((state) => state.setPatientConnected);
  const [toast, setToast] = useState<{ open: boolean; message: string }>({ open: false, message: '' });

  // Initialize session ID from URL
  useEffect(() => {
    if (id && typeof id === 'string') {
      setSessionId(id);
    }
  }, [id, setSessionId]);

  // Update connection status
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected, setConnectionStatus]);

  // Load user from cookie via API (durable session) then fallback to localStorage
  useEffect(() => {
    let cancelled = false;
    const bootstrapAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data?.user) {
            setUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            return;
          }
        }
      } catch (e) {
        console.warn('Auth bootstrap via /api/auth/me failed, falling back to localStorage', e);
      }
      const storedUser = localStorage.getItem('auth_user');
      if (storedUser && !cancelled) {
        try {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
        } catch {
          localStorage.removeItem('auth_user');
        }
      }
    };
    bootstrapAuth();
    return () => { cancelled = true; };
  }, [setUser, setIsAuthenticated]);

  // Load existing session when sessionId is set and socket is connected
  // Only load on session pages to prevent "Session not found" errors on other pages
  useEffect(() => {
    if (sessionId && socket && isConnected && user && !sessionInfo) {
      // Check if we're on a session page before loading
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isSessionPage = path.includes('/session/') || path.includes('/dashboard');
        
        if (isSessionPage) {
          console.log('Loading existing session:', sessionId);
          socket.send(JSON.stringify({
            type: 'loadSession',
            sessionId,
            clinicianId: user.clinician_id
          }));
        }
      }
    }
  }, [sessionId, socket, isConnected, user, sessionInfo]);

  // Central message handling
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data);

        switch (data.type) {
          case 'patientList':
            if (data.patientList && typeof data.patientList === 'object') {
              setPatientList(data.patientList);
            }
            break;
          case 'connected':
            setConnectionStatus('connected');
            // Authenticate if user is logged in
            if (user) {
              socket.send(JSON.stringify({
                type: 'authenticate',
                userId: user.clinician_id,
                userType: 'clinician'
              }));
            }
            break;
          case 'authenticated':
            console.log('WebSocket authenticated for user:', data.userId);
            break;
          case 'sendQrData':
            setQrData({ qrData: data.qrData, sessionId: data.sessionId });
            break;
          case 'sessionCreated':
            // Server created a session (either via clinician action or auto-created when both parties present)
            console.log('[SocketProvider] Session created:', data.sessionId);
            if (data.sessionId) {
              setSessionId(data.sessionId);
            }
            if (data.sessionInfo) {
              setSessionInfo(data.sessionInfo);
              // Log patient URL if provided
              if (data.sessionInfo.patientUrl) {
                console.log('Patient URL stored:', data.sessionInfo.patientUrl);
              }
            }
            // Only set patient info if there was a temp patient created (auto-create scenario)
            if (data.tempPatientId && !patientInfo) {
              setPatientInfo({ patient_id: data.tempPatientId, first_name: 'Patient', last_name: 'Connected' });
              setPatientConnected(true);
            }
            break;
          case 'sessionLoaded':
            // Handle loaded existing session (both new loads and clinician joins)
            console.log('[SocketProvider] Session loaded:', {
              sessionId: data.sessionId,
              status: data.sessionInfo?.status,
              hasTemplateItems: !!data.templateItems,
              itemsCount: data.templateItems?.length
            });
            
            if (data.sessionId) {
              setSessionId(data.sessionId);
            }
            if (data.sessionInfo) {
              setSessionInfo(data.sessionInfo);
              // If session is already in progress, mark it as started
              if (data.sessionInfo.status === 'In Progress') {
                console.log('[SocketProvider] Session already in progress, setting sessionStarted=true');
                setSessionStarted(true);
              }
            }
            if (data.templateItems) {
              console.log('[SocketProvider] Loading template items:', data.templateItems.length);
              setTemplateItems(data.templateItems);
            }
            if (data.currentItem) {
              setCurrentItem(data.currentItem as unknown as AssessmentItem);
            }
            break;
          case 'patientConnected':
            // Mark that a patient has connected to the current session
            setPatientConnected(true);
            // Optionally set minimal patient info
            setPatientInfo({
              patient_id: 0,
              first_name: 'Patient',
              last_name: 'Connected'
            });
            // show a short, non-blocking in-app toast for clinician UX
            try {
              setToast({ open: true, message: `Patient connected to session ${data.sessionId || sessionId}` });
              setTimeout(() => setToast({ open: false, message: '' }), 4000);
            } catch (e) {
              console.warn('Toast failed', e);
            }
            // Prompt the clinician visually: try Notification API first. If not
            // available or denied, fall back to an in-app UI update (no blocking
            // alert) — we avoid native alert() because browsers sometimes prefix
            // it with the origin (eg. "localhost says:") which is noisy.
            try {
              if (typeof window !== 'undefined' && 'Notification' in window) {
                if (Notification.permission === 'granted') {
                  new Notification('Patient connected', { body: `A patient connected to session ${data.sessionId || sessionId}` });
                } else if (Notification.permission !== 'denied') {
                  Notification.requestPermission().then((perm) => {
                    if (perm === 'granted') {
                      new Notification('Patient connected', { body: `A patient connected to session ${data.sessionId || sessionId}` });
                    } else {
                      // Permission denied — rely on visible UI state (patientConnected)
                      console.log(`Patient connected to session ${data.sessionId || sessionId}`);
                    }
                  });
                } else {
                  // Permission already denied — rely on UI state instead of alert
                  console.log(`Patient connected to session ${data.sessionId || sessionId}`);
                }
              } else {
                // Notifications not available; rely on UI state (no native alert)
                console.log(`Patient connected to session ${data.sessionId || sessionId}`);
              }
            } catch (e) {
              // Best-effort: don't break message handling
              console.warn('Notification error', e);
            }
            break;
          case 'patientRejected':
            // Patient could not join because another patient is already connected
            // No direct action for clinician UI, but could be used in patient client
            console.warn('Patient rejected from room:', data.message);
            break;
          case 'participantCount':
            // Update UI participant count and if two or more present, treat as patient connected
            if (typeof data.count === 'number') {
              setRoomParticipants(data.count);
              if (data.count >= 2 && isAuthenticated) {
                setPatientConnected(true);
                // set minimal patient info if none
                if (!patientInfo) {
                  setPatientInfo({ patient_id: 0, first_name: 'Patient', last_name: 'Connected' });
                }
              } else if (data.count < 2) {
                setPatientConnected(false);
              }
            }
            break;
          case 'patientLeft':
            setPatientConnected(false);
            setPatientInfo(null);
            break;
          case 'templateAssigned':
            // Update template info and always store items
            console.log('[SocketProvider] Template assigned:', {
              templateId: data.templateId,
              templateName: data.templateName,
              itemsCount: data.templateItems?.length,
              is_for_kids: data.is_for_kids
            });
            
            const templateName = data.templateName ?? (data.templateId ? `Template ${data.templateId}` : undefined);
            const totalItems = Array.isArray(data.templateItems) ? data.templateItems.length : (sessionInfo?.total_items ?? 0);
            const isForKids = data.is_for_kids ?? false;
            if (sessionInfo) {
              const updatedInfo = {
                ...sessionInfo,
                template_name: templateName ?? sessionInfo.template_name,
                total_items: totalItems,
                is_for_kids: isForKids
              };
              console.log('[SocketProvider] Updating sessionInfo with template:', updatedInfo);
              setSessionInfo(updatedInfo);
            } else if (templateName && sessionId) {
              const newInfo = {
                session_id: 0,
                session_uuid: sessionId,
                session_mode: 'Standard',
                status: 'Scheduled',
                total_items: totalItems,
                completed_items: 0,
                template_name: templateName,
                is_practice_session: false,
                is_for_kids: isForKids
              };
              console.log('[SocketProvider] Creating new sessionInfo with template:', newInfo);
              setSessionInfo(newInfo);
            }
            setTemplateItems(data.templateItems ?? null);
            console.log('[SocketProvider] Template items stored, count:', data.templateItems?.length);
            break;
          case 'patientSet':
            // Update patient info when clinician assigns session to an existing patient
            console.log('[SocketProvider] Patient assigned to session:', data.patient);
            if (data.patient) {
              setPatientInfo(data.patient);
              setPatientConnected(true);
              
              // Update sessionInfo to ensure patient view refreshes
              if (sessionInfo) {
                setSessionInfo({
                  ...sessionInfo,
                  patient_id: data.patient.patient_id
                });
              }
            }
            break;
          case 'sessionLinkGenerated':
            // New link generated for patient reconnection
            if (data.sessionInfo && data.patientUrl) {
              const newSessionId = data.newSessionId || data.sessionInfo.session_uuid;
              
              console.log('[SocketProvider] New session link generated:', {
                oldSessionId: sessionId,
                newSessionId: newSessionId,
                patientUrl: data.patientUrl
              });
              
              // Update session info with new session data
              setSessionInfo({
                ...sessionInfo,
                ...data.sessionInfo,
                patientUrl: data.patientUrl
              });
              
              // Update sessionId to the new one
              setSessionId(newSessionId);
              
              // Leave the old room and join the new one
              if (socket && socket.readyState === WebSocket.OPEN) {
                // Leave old room if we were in one
                if (sessionId && hasJoinedRoom) {
                  console.log('[SocketProvider] Leaving old room:', sessionId);
                  socket.send(JSON.stringify({
                    type: 'leaveRoom',
                    roomId: sessionId
                  }));
                  setHasJoinedRoom(false);
                }
                
                // Join new room
                setTimeout(() => {
                  console.log('[SocketProvider] Joining new room:', newSessionId);
                  socket.send(JSON.stringify({
                    type: 'joinRoom',
                    roomId: newSessionId,
                    role: 'clinician',
                    clinicianId: user?.clinician_id,
                    isKidsMode
                  }));
                }, 300);
              }
              
              // Show notification
              setToast({ open: true, message: `New patient link generated successfully!` });
              setTimeout(() => setToast({ open: false, message: '' }), 3000);
            }
            break;
          case 'changeAssessmentItem':
            // Ensure the raw payload is treated as an AssessmentItem for the store
            console.log('SocketProvider - received changeAssessmentItem:', data);
            console.log('SocketProvider - data.item:', data.item);
            console.log('SocketProvider - data.item.image_url:', data.item?.image_url);
            setCurrentItem(data.item as unknown as AssessmentItem);
            if (sessionInfo) {
              setSessionInfo({
                ...sessionInfo,
                current_item_id: data.item.item_id,
                completed_items: data.item.item_number - 1
              });
            }
            break;
          case 'joinedRoom':
            setHasJoinedRoom(true);
            setRoomParticipants(data.participantCount || 1);
            break;
          case 'participantJoined':
            setRoomParticipants(roomParticipants + 1);
            break;
          case 'participantLeft':
            setRoomParticipants(Math.max(0, roomParticipants - 1));
            break;
          case 'sessionStarted':
            setSessionStarted(true);
            setSessionPaused(false);
            // Update session info from the broadcast
            if (data.sessionInfo) {
              setSessionInfo(data.sessionInfo);
            } else if (sessionInfo) {
              setSessionInfo({
                ...sessionInfo,
                status: 'In Progress'
              });
            }
            // Load template items if provided
            if (data.templateItems) {
              setTemplateItems(data.templateItems);
            }
            // Set current item if provided
            if (data.currentItem) {
              setCurrentItem(data.currentItem as unknown as AssessmentItem);
            }
            // Navigate clinician to session page only if not already there
            try {
              if (isAuthenticated && data.sessionId) {
                const currentPath = window.location.pathname;
                const targetPath = `/session/clinician/${data.sessionId}`;
                
                console.log('[SocketProvider] Session started navigation check:', {
                  currentPath,
                  targetPath,
                  sessionId: data.sessionId,
                  storeSessionId: sessionId
                });
                
                if (!currentPath.includes(targetPath)) {
                  console.log('[SocketProvider] Navigating to session:', targetPath);
                  // Use replace to avoid back button issues
                  router.replace(targetPath);
                } else {
                  console.log('[SocketProvider] Already on session page, skipping navigation');
                }
              }
            } catch (e) {
              console.warn('Navigation error:', e);
            }
            break;
          case 'sessionResumed':
            console.log('[SocketProvider] Session resumed:', data);
            setSessionStarted(true);
            setSessionPaused(false);
            // Update session info
            if (data.sessionInfo) {
              setSessionInfo(data.sessionInfo);
            }
            // Load template items
            if (data.templateItems) {
              console.log('[SocketProvider] Loading template items for resumed session:', data.templateItems.length);
              setTemplateItems(data.templateItems);
            }
            // Set current item
            if (data.currentItem) {
              setCurrentItem(data.currentItem as unknown as AssessmentItem);
            }
            break;
          case 'sessionCompleted':
            // Mark completion, stop session, enable patient finalize prompt
            if (sessionInfo) {
              setSessionInfo({ ...sessionInfo, status: 'Completed' });
            }
            try {
              useSocketStore.getState().setSessionCompleted(true);
            } catch (e) { console.warn('Failed to set sessionCompleted', e); }
            break;
          case 'patientFinalized':
            try { useSocketStore.getState().setPatientFinalized(true); } catch (e) { console.warn('Failed to set patientFinalized', e); }
            if (data.patientInfo && typeof data.patientInfo === 'object') {
              setPatientInfo(data.patientInfo as PatientInfo);
            }
            break;
          case 'sessionPaused':
            setSessionPaused(true);
            if (sessionInfo) {
              setSessionInfo({
                ...sessionInfo,
                status: 'Paused'
              });
            }
            break;
          case 'sessionResumed':
            setSessionPaused(false);
            if (sessionInfo) {
              setSessionInfo({
                ...sessionInfo,
                status: 'In Progress'
              });
            }
            break;
          case 'sessionEnded':
            console.log('[SocketProvider] Session ended, updating status to Completed');
            setSessionStarted(false);
            setSessionPaused(false);
            if (sessionInfo) {
              const updatedInfo = {
                ...sessionInfo,
                status: 'Completed',
                end_time: new Date()
              };
              console.log('[SocketProvider] Setting sessionInfo to:', updatedInfo);
              setSessionInfo(updatedInfo);
              // Also update localStorage to persist the status
              try {
                const storageKey = `session_${sessionInfo.session_uuid}_status`;
                localStorage.setItem(storageKey, 'Completed');
              } catch (e) {
                console.warn('Failed to update localStorage', e);
              }
            }
            // Set sessionCompleted flag for patient finalization
            try {
              useSocketStore.getState().setSessionCompleted(true);
            } catch (e) {
              console.warn('Failed to set sessionCompleted', e);
            }
            // Redirect clinician to dashboard after delay and force refresh
            if (isAuthenticated) {
              setTimeout(() => {
                router.push('/clinician-dashboard');
                // Force a hard refresh of dashboard data
                window.dispatchEvent(new Event('sessionStatusChanged'));
              }, 3000);
            }
            break;
          case 'sessionCompleted':
            // Patient-specific message when session ends
            console.log('[SocketProvider] Received sessionCompleted message');
            try {
              useSocketStore.getState().setSessionCompleted(true);
              console.log('[SocketProvider] sessionCompleted set to true');
            } catch (e) {
              console.warn('Failed to set sessionCompleted', e);
            }
            break;
          case 'sessionSettingsUpdated':
            setIsKidsMode(data.settings.isKidsMode || false);
            if (sessionInfo) {
              setSessionInfo({
                ...sessionInfo,
                session_name: data.settings.sessionName,
                session_mode: data.settings.isKidsMode ? 'Kids' : 'Standard'
              });
            }
            break;
          case 'responseSubmitted':
            console.log('Response submitted for item:', data.itemId);
            break;
          case 'error':
            // Server may send validation errors for certain actions (eg. missing fields)
            // Treat known validation messages as warnings instead of a connection-level error.
            if (typeof data.message === 'string' && data.message.includes('Missing clinicianId')) {
              console.warn('WebSocket server validation:', data.message);
            } else {
              console.error('WebSocket error:', data.message);
              setConnectionStatus('error');
            }
            break;
          case 'heartbeatResponse':
            // Connection is alive
            break;
          default:
            console.warn('Unhandled WebSocket message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setConnectionStatus('error');
      }
    };

    const handleError = () => {
      setConnectionStatus('error');
    };

    const handleClose = () => {
      setConnectionStatus('disconnected');
      setHasJoinedRoom(false);
      setRoomParticipants(0);
    };

    socket.addEventListener('message', handleMessage);
    socket.addEventListener('error', handleError);
    socket.addEventListener('close', handleClose);

    return () => {
      socket.removeEventListener('message', handleMessage);
      socket.removeEventListener('error', handleError);
      socket.removeEventListener('close', handleClose);
    };
  }, [socket, user, sessionInfo, router, setConnectionStatus, setHasJoinedRoom, setRoomParticipants, setCurrentItem, setSessionInfo, setSessionStarted, setSessionPaused, setIsKidsMode, setQrData, setPatientList, setPatientInfo, setPatientConnected, roomParticipants, sessionId, isAuthenticated, patientInfo, setSessionId, setTemplateItems]);
  // Note: setTemplateItems intentionally not included previously; include it to satisfy hook deps

  // Send heartbeat every 30 seconds
  useEffect(() => {
    if (!socket || !isConnected) return;
    const heartbeatInterval = setInterval(() => {
      socket.send(JSON.stringify({ type: 'heartbeat' }));
    }, 30000);
    return () => clearInterval(heartbeatInterval);
  }, [socket, isConnected]);

  // Authentication functions
  const authenticate = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      if (response.ok && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        // Authenticate WebSocket connection
        if (socket) {
          socket.send(JSON.stringify({
            type: 'authenticate',
            userId: data.user.clinician_id,
            userType: 'clinician'
          }));
        }
        return true;
      } else {
        console.error('Authentication failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('auth_user');
    localStorage.removeItem('clinician');
    localStorage.removeItem('clinicianLoggedIn');
    localStorage.removeItem('sidebarHome');
    if (hasJoinedRoom && sessionId) {
      leaveRoom();
    }
    router.push('/login');
  };

  // Room management functions
  const joinRoom = useCallback((roomId: string, role = 'participant') => {
    if (socket && socket.readyState === WebSocket.OPEN && !hasJoinedRoom) {
      socket.send(JSON.stringify({
        type: 'joinRoom',
        roomId,
        role,
        clinicianId: user?.clinician_id,
        isKidsMode
      }));
    }
  }, [socket, hasJoinedRoom, user?.clinician_id, isKidsMode]);

  useEffect(() => {
    if (socket && sessionId && !hasJoinedRoom && isConnected) {
      const role = isAuthenticated ? 'clinician' : 'patient';
      joinRoom(sessionId, role);
    }
  }, [socket, sessionId, isAuthenticated, hasJoinedRoom, isConnected, joinRoom]);

  const leaveRoom = () => {
    if (socket && sessionId && hasJoinedRoom) {
      socket.send(JSON.stringify({
        type: 'leaveRoom',
        roomId: sessionId
      }));
      setHasJoinedRoom(false);
    }
  };

  const sendMessage = (message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      // Only add sessionId from store if not already present in the message
      const payload: WebSocketMessage = {
        ...message,
        userId: user?.clinician_id,
        sessionId: message.sessionId || sessionId,
        timestamp: new Date().toISOString()
      };
      socket.send(JSON.stringify(payload));
    }
  };

  // Session control functions
  const startSession = () => {
    if (sessionInfo) {
      sendMessage({
        type: 'startSession',
        sessionId: sessionInfo.session_uuid
      });
    }
  };

  const pauseSession = () => {
    if (sessionInfo) {
      sendMessage({
        type: 'pauseSession',
        sessionId: sessionInfo.session_uuid
      });
    }
  };

  const resumeSession = async () => {
    if (sessionInfo) {
      // First, navigate to the session page
      try {
        router.push(`/session/clinician/${sessionInfo.session_uuid}`);
      } catch (e) {
        console.warn('Navigation error:', e);
      }
      
      // Then send the resume message
      sendMessage({
        type: 'resumeSession',
        sessionId: sessionInfo.session_uuid
      });
    }
  };

  const endSession = (summary?: string, notes?: string) => {
    if (sessionInfo) {
      sendMessage({
        type: 'endSession',
        sessionId: sessionInfo.session_uuid,
        summary,
        notes
      });
    }
  };

  const updateSessionSettings = (settings: SessionSettings) => {
    if (sessionInfo) {
      sendMessage({
        type: 'updateSessionSettings',
        sessionId: sessionInfo.session_uuid,
        settings
      });
    }
  };

  // Response functions
  const submitResponse = (response: SessionResponsePayload) => {
    if (sessionInfo && currentItem) {
      sendMessage({
        type: 'submitResponse',
        sessionId: sessionInfo.session_uuid,
        item: currentItem,
        response: {
          ...response,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  // UI functions
  const toggleKidsMode = () => {
    const newKidsMode = !isKidsMode;
    setIsKidsMode(newKidsMode);
    updateSessionSettings({
      isKidsMode: newKidsMode,
      sessionName: sessionInfo?.session_name
    });
  };

  const updatePatientInfo = (newPatientInfo: PatientInfo) => {
    setPatientInfo(newPatientInfo);
  };

  // Refresh user data from API and localStorage
  const refreshUser = useCallback(async () => {
    console.log('[refreshUser] Starting user refresh...');
    try {
      const res = await fetch('/api/auth/me', { method: 'GET', credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        console.log('[refreshUser] API response:', data);
        if (data?.user) {
          console.log('[refreshUser] Updating user state with:', data.user);
          setUser(data.user);
          setIsAuthenticated(true);
          localStorage.setItem('auth_user', JSON.stringify(data.user));
          console.log('[refreshUser] User state updated successfully');
          return data.user;
        }
      } else {
        console.warn('[refreshUser] API request failed with status:', res.status);
      }
    } catch (e) {
      console.error('[refreshUser] Failed to refresh user data:', e);
    }
    // Fallback to localStorage
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        return userData;
      } catch {
        localStorage.removeItem('auth_user');
      }
    }
    return null;
  }, [setUser, setIsAuthenticated]);

  const contextValue: SocketContextType & { setSessionId: (id: string | null) => void } = {
    socket,
    isConnected,
    connectionStatus,
    user,
    isAuthenticated,
    sessionId,
    sessionInfo,
    currentItem,
    patientInfo,
    qrData,
    hasJoinedRoom,
    roomParticipants,
    patientConnected: useSocketStore((s) => s.patientConnected),
    patientList,
    isKidsMode,
    sessionStarted,
    sessionPaused,
    authenticate,
    logout,
    joinRoom,
    leaveRoom,
    sendMessage,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    updateSessionSettings,
    submitResponse,
    toggleKidsMode,
    updatePatientInfo,
    refreshUser,
    setPatientConnected: useSocketStore((s) => s.setPatientConnected),
    setSessionId,
    reconnect,
    disconnect,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
      {toast.open && (
        <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9999 }}>
          <div style={{ background: '#0b84ff', color: '#fff', padding: '10px 14px', borderRadius: 8, boxShadow: '0 8px 24px rgba(2,6,23,0.2)', fontWeight: 600 }}>
            {toast.message}
          </div>
        </div>
      )}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}

// Convenience hooks used by legacy clinician components
export function useSocketState() {
  const ctx = useSocketContext();
  const formData = useSocketStore((s) => s.formData);
  const isPersisting = useSocketStore((s) => s.isPersisting);

  return {
    socket: ctx.socket,
    isConnected: ctx.isConnected,
    sessionId: ctx.sessionId,
    sessionInfo: ctx.sessionInfo,
    currentItem: ctx.currentItem,
    formData,
    isPersisting,
  };
}

export function useSocketDispatch() {
  const ctx = useSocketContext();
  const setCurrentItem = useSocketStore((s) => s.setCurrentItem);
  const setFormData = useSocketStore((s) => s.setFormData);
  const setIsPersisting = useSocketStore((s) => s.setIsPersisting);

  const updateFormData = (data: Record<string, unknown>) => {
    try {
      const current = useSocketStore.getState().formData || {};
      const merged = { ...(current as Record<string, unknown>), ...(data || {}) };
      setFormData(merged);
    } catch (err) {
      console.error('Failed to update formData in store:', err);
    }
  };

  const updateCurrentItem = (item: Record<string, unknown>) => {
  setCurrentItem(item as unknown as AssessmentItem);
    // Broadcast to others that current item changed
    if (ctx.socket && ctx.socket.readyState === WebSocket.OPEN && ctx.sessionId) {
      ctx.sendMessage({ type: 'changeAssessmentItem', item, sessionId: ctx.sessionId });
    }
  };

  const saveSessionManually = async () => {
    // Persist formData by sending submitResponse messages for each answered item
    const state = useSocketStore.getState();
    const form = state.formData || {};
    const sid = ctx.sessionId;
    if (!sid) return;
    setIsPersisting(true);
    
    console.log('[saveSessionManually] Starting manual save for session:', sid);
    console.log('[saveSessionManually] Form data:', form);
    
    try {
      for (const [key, val] of Object.entries(form)) {
        const itemNum = Number(key);
        const entry = val as Record<string, unknown>;
        const responsePayload: Record<string, unknown> = {
          response: (entry['childResponse'] as string) ?? null,
          score: (entry['score'] as number) ?? null,
          isCorrect: typeof entry['score'] === 'number' ? ((entry['score'] as number) > 0) : null,
          timestamp: new Date().toISOString(),
          notes: (entry['clinicianNotes'] as string) ?? null,
          consonantsCorrect: (entry['consonantsCorrect'] as number) ?? 0,
          vowelsCorrect: (entry['vowelsCorrect'] as number) ?? 0
        };

        console.log(`[saveSessionManually] Submitting item ${itemNum}:`, responsePayload);

        ctx.sendMessage({ type: 'submitResponse', sessionId: sid, item: { item: itemNum }, response: responsePayload });
      }
      
      // Show success feedback
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('sessionSaved', { detail: { success: true } });
        window.dispatchEvent(event);
      }
    } catch (err) {
      console.error('Failed to save session manually:', err);
      // Show error feedback
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('sessionSaved', { detail: { success: false, error: err } });
        window.dispatchEvent(event);
      }
    } finally {
      setIsPersisting(false);
    }
  };

  return {
    updateFormData,
    updateCurrentItem,
    saveSessionManually,
    sendMessage: ctx.sendMessage,
  };
}