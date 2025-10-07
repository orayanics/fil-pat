"use client";
import { createContext, useContext, useEffect, useCallback, ReactNode } from "react";
import { useSocketStore } from "./socketStore";
import type { WebSocketMessage, SessionSettings, SessionResponsePayload, SocketContextType, PatientInfo } from "./socketStore";
import { useParams, useRouter } from "next/navigation";
import useWebSocket from "@/lib/useWebSocket";

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export default function SocketProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useWebSocket();
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

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('auth_user');
      }
    }
  }, [setUser, setIsAuthenticated]);

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
          case 'changeAssessmentItem':
            setCurrentItem(data.item);
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
            if (sessionInfo) {
              setSessionInfo({
                ...sessionInfo,
                status: 'In Progress'
              });
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
            setSessionStarted(false);
            setSessionPaused(false);
            if (sessionInfo) {
              setSessionInfo({
                ...sessionInfo,
                status: 'Completed'
              });
            }
            setTimeout(() => {
              router.push('/clinician-dashboard');
            }, 3000);
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
            console.error('WebSocket error:', data.message);
            setConnectionStatus('error');
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
  }, [socket, user, sessionInfo, router, setConnectionStatus, setHasJoinedRoom, setRoomParticipants, setCurrentItem, setSessionInfo, setSessionStarted, setSessionPaused, setIsKidsMode, setQrData, setPatientList, roomParticipants]);

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
    if (socket && sessionId && isAuthenticated && !hasJoinedRoom && isConnected) {
      joinRoom(sessionId);
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
      socket.send(JSON.stringify({
        ...message,
        userId: user?.clinician_id,
        sessionId: sessionId,
        timestamp: new Date().toISOString()
      }));
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

  const resumeSession = () => {
    if (sessionInfo) {
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
    setSessionId,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
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