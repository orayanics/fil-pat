"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import useWebSocket from "@/lib/useWebSocket";

// Enhanced types
// Message types for WebSocket
export type WebSocketMessage =
  | { type: 'startSession'; sessionId: string }
  | { type: 'pauseSession'; sessionId: string }
  | { type: 'resumeSession'; sessionId: string }
  | { type: 'endSession'; sessionId: string; summary?: string; notes?: string }
  | { type: 'updateSessionSettings'; sessionId: string; settings: SessionSettings }
  | { type: 'submitResponse'; sessionId: string; item: AssessmentItem; response: SessionResponsePayload }
  | { type: string; [key: string]: unknown };

export interface SessionSettings {
  [key: string]: string | number | boolean | undefined;
}

export interface SessionResponsePayload {
  [key: string]: string | number | boolean | undefined;
  timestamp?: string;
}
export interface AuthUser {
  clinician_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  is_active: boolean;
}

export interface AssessmentItem {
  item_id: number;
  item_number: number;
  question: string;
  sound?: string;
  ipa_key?: string;
  consonant_group?: string;
  consonants_count: number;
  vowels_count: number;
  image_url?: string;
  image_alt_text?: string;
  difficulty_level: string;
  expected_response?: string;
  max_score: number;
  time_limit_seconds?: number;
  background_color?: string;
  text_size: string;
}

export interface PatientInfo {
  patient_id: number;
  first_name: string;
  last_name: string;
  age?: number;
  gender?: string;
  guardian_name?: string;
  guardian_phone?: string;
}

export interface SessionInfo {
  session_id: number;
  session_uuid: string;
  session_name?: string;
  session_mode: 'Standard' | 'Kids';
  status: string;
  total_items: number;
  completed_items: number;
  current_item_id?: number;
  start_time?: Date;
  template_name: string;
  is_practice_session: boolean;
}

export interface SocketContextType {
  // WebSocket connection
  socket: WebSocket | null;
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  
  // Authentication
  user: AuthUser | null;
  isAuthenticated: boolean;
  
  // Session management
  sessionId: string | null;
  sessionInfo: SessionInfo | null;
  currentItem: AssessmentItem | null;
  patientInfo: PatientInfo | null;
  
  // QR Code functionality
  qrData: {
    qrData: string;
    sessionId: string;
  } | null;
  
  // Room management
  hasJoinedRoom: boolean;
  roomParticipants: number;
  patientList: Record<string, { patientId: string; patientName: string }>;
  
  // Session state
  isKidsMode: boolean;
  sessionStarted: boolean;
  sessionPaused: boolean;
  
  // Functions
  authenticate: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  joinRoom: (roomId: string, role?: string) => void;
  leaveRoom: () => void;
  sendMessage: (message: WebSocketMessage) => void;
  
  // Session functions
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: (summary?: string, notes?: string) => void;
  updateSessionSettings: (settings: SessionSettings) => void;
  
  // Response functions
  submitResponse: (response: SessionResponsePayload) => void;
  
  // UI functions
  toggleKidsMode: () => void;
  updatePatientInfo: (patientInfo: PatientInfo) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export default function SocketProvider({ children }: { children: ReactNode }) {
  const { socket, isConnected } = useWebSocket();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');
  const router = useRouter();
  const params = useParams();
  const id = params && typeof params === 'object' && 'id' in params ? params.id : null;

  // Authentication state
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [currentItem, setCurrentItem] = useState<AssessmentItem | null>(null);
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [roomParticipants, setRoomParticipants] = useState(0);

  // QR functionality
  const [qrData, setQrData] = useState<{
    qrData: string;
    sessionId: string;
  } | null>(null);

  // Session control
  const [isKidsMode, setIsKidsMode] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);

  // Patient list state
  const [patientList, setPatientList] = useState<Record<string, { patientId: string; patientName: string }> >({});

  // Initialize session ID from URL
  useEffect(() => {
    if (id && typeof id === 'string') {
      setSessionId(id);
    }
  }, [id]);

  // Update connection status
  useEffect(() => {
    if (isConnected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [isConnected]);

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
  }, []);

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
            setRoomParticipants(prev => prev + 1);
            break;

          case 'participantLeft':
            setRoomParticipants(prev => Math.max(0, prev - 1));
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
            // Navigate to session summary or dashboard
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
  }, [socket, user, sessionInfo, router]);

  // ...existing code...
  // Room management functions

  // ...existing code...

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

  // Auto-join room when session ID is available and user is authenticated
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

  const contextValue: SocketContextType = {
    // WebSocket connection
    socket,
    isConnected,
    connectionStatus,
    
    // Authentication
    user,
    isAuthenticated,
    
    // Session management
    sessionId,
    sessionInfo,
    currentItem,
    patientInfo,
    
    // QR functionality
    qrData,
    
    // Room management
    hasJoinedRoom,
    roomParticipants,
    patientList,
    
    // Session state
    isKidsMode,
    sessionStarted,
    sessionPaused,
    
    // Functions
    authenticate,
    logout,
    joinRoom,
    leaveRoom,
    sendMessage,
    
    // Session functions
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    updateSessionSettings,
    
    // Response functions
    submitResponse,
    
    // UI functions
    toggleKidsMode,
    updatePatientInfo,
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