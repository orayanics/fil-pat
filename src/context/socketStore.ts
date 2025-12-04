import { create } from 'zustand';

export interface AuthUser {
  clinician_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  is_active: boolean;
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
  is_for_kids?: boolean;
  patientUrl?: string;
  patient_id?: number;
  is_resumed?: boolean;
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

export interface AssessmentItem {
  item_id: number;
  item_number: number;
  question: string;
  target_word?: string;
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
  // Convenience aliases used in UI components
  item?: number; // alias for item_number
  image?: string; // alias for image_url
}

export interface SessionSettings {
  [key: string]: string | number | boolean | undefined;
}

export interface WebSocketMessage {
  type: string;
  [key: string]: unknown;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface SessionResponsePayload {
  [key: string]: string | number | boolean | undefined;
  timestamp?: string;
}

export interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  user: AuthUser | null;
  isAuthenticated: boolean;
  sessionId: string | null;
  sessionInfo: SessionInfo | null;
  currentItem: AssessmentItem | null;
  patientInfo: PatientInfo | null;
  qrData: { qrData: string; sessionId: string } | null;
  hasJoinedRoom: boolean;
  roomParticipants: number;
  patientConnected: boolean;
  patientList: Record<string, { patientId: string; patientName: string }>;
  setPatientConnected: (connected: boolean) => void;
  isKidsMode: boolean;
  sessionStarted: boolean;
  sessionPaused: boolean;
  authenticate: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  joinRoom: (roomId: string, role?: string) => void;
  leaveRoom: () => void;
  sendMessage: (message: WebSocketMessage) => void;
  startSession: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: (summary?: string, notes?: string) => void;
  updateSessionSettings: (settings: SessionSettings) => void;
  submitResponse: (response: SessionResponsePayload) => void;
  toggleKidsMode: () => void;
  updatePatientInfo: (patientInfo: PatientInfo) => void;
  refreshUser: () => Promise<AuthUser | null>;
  setSessionId: (id: string | null) => void;
  reconnect?: () => void;
  disconnect?: () => void;
}

export interface SocketState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  sessionId: string | null;
  sessionInfo: SessionInfo | null;
  currentItem: AssessmentItem | null;
  // form data collected by clinician during session; keyed by item number
  formData: Record<string, unknown> | null;
  patientInfo: PatientInfo | null;
  hasJoinedRoom: boolean;
  roomParticipants: number;
  patientConnected: boolean;
  patientList: Record<string, { patientId: string; patientName: string }>;
  isKidsMode: boolean;
  sessionStarted: boolean;
  sessionPaused: boolean;
  // persisting flag while saving session responses
  isPersisting: boolean;
  qrData: { qrData: string; sessionId: string } | null;
  // current template items for the active session (if any)
  templateItems?: Array<Record<string, unknown>> | null;
  connectionStatus: ConnectionStatus;
  // Patient context additions
  patient: string;
  setPatient: (name: string) => void;
  // Patient QR
  patientQrData: { qrData: string; sessionId: string } | null;
  setPatientQrData: (data: { qrData: string; sessionId: string } | null) => void;

  setUser: (user: AuthUser | null) => void;
  setIsAuthenticated: (auth: boolean) => void;
  setSessionId: (id: string | null) => void;
  setSessionInfo: (info: SessionInfo | null) => void;
  setFormData: (data: Record<string, unknown> | null) => void;
  setCurrentItem: (item: AssessmentItem | null) => void;
  setPatientInfo: (info: PatientInfo | null) => void;
  setHasJoinedRoom: (joined: boolean) => void;
  setRoomParticipants: (count: number) => void;
  setPatientList: (list: Record<string, { patientId: string; patientName: string }>) => void;
  setPatientConnected: (connected: boolean) => void;
  setIsKidsMode: (mode: boolean) => void;
  setSessionStarted: (started: boolean) => void;
  setSessionPaused: (paused: boolean) => void;
  setQrData: (data: { qrData: string; sessionId: string } | null) => void;
  // End session modal control
  showEndModal: boolean;
  setShowEndModal: (open: boolean) => void;
  // Session completion & patient finalization
  sessionCompleted: boolean;
  patientFinalized: boolean;
  setSessionCompleted: (completed: boolean) => void;
  setPatientFinalized: (finalized: boolean) => void;
  setTemplateItems: (items: Array<Record<string, unknown>> | null) => void;
  setIsPersisting: (persisting: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  // Comprehensive session state reset
  resetSessionState: () => void;
}

export const useSocketStore = create<SocketState>((set) => ({
  user: null,
  isAuthenticated: false,
  sessionId: null,
  sessionInfo: null,
  currentItem: null,
  patientInfo: null,
  hasJoinedRoom: false,
  roomParticipants: 0,
  patientConnected: false,
  patientList: {},
  isKidsMode: false,
  sessionStarted: false,
  sessionPaused: false,
  qrData: null,
  templateItems: null,
  connectionStatus: 'connecting',
  patient: '',
  setPatient: (name: string) => set({ patient: name }),
  patientQrData: null,
  formData: null,
  setPatientQrData: (data: { qrData: string; sessionId: string } | null) => set({ patientQrData: data }),
  isPersisting: false,
  setFormData: (data: Record<string, unknown> | null) => set({ formData: data }),
  setTemplateItems: (items: Array<Record<string, unknown>> | null) => set({ templateItems: items }),
  setUser: (user: AuthUser | null) => set({ user }),
  setIsAuthenticated: (auth: boolean) => set({ isAuthenticated: auth }),
  setSessionId: (id: string | null) => set({ sessionId: id }),
  setSessionInfo: (info: SessionInfo | null) => set({ sessionInfo: info }),
  setCurrentItem: (item: AssessmentItem | null) => set({ currentItem: item }),
  setPatientInfo: (info: PatientInfo | null) => set({ patientInfo: info }),
  setHasJoinedRoom: (joined: boolean) => set({ hasJoinedRoom: joined }),
  setRoomParticipants: (count: number) => set({ roomParticipants: count }),
  setPatientConnected: (connected: boolean) => set({ patientConnected: connected }),
  setPatientList: (list: Record<string, { patientId: string; patientName: string }>) => set({ patientList: list }),
  setIsKidsMode: (mode: boolean) => set({ isKidsMode: mode }),
  setSessionStarted: (started: boolean) => set({ sessionStarted: started }),
  setSessionPaused: (paused: boolean) => set({ sessionPaused: paused }),
  setQrData: (data: { qrData: string; sessionId: string } | null) => set({ qrData: data }),
  // End session modal control (global so different components can request it)
  showEndModal: false,
  setShowEndModal: (open: boolean) => set({ showEndModal: open }),
  // Session completion & patient finalization
  sessionCompleted: false,
  patientFinalized: false,
  setSessionCompleted: (completed: boolean) => set({ sessionCompleted: completed }),
  setPatientFinalized: (finalized: boolean) => set({ patientFinalized: finalized }),
  setConnectionStatus: (status: ConnectionStatus) => set({ connectionStatus: status }),
  setIsPersisting: (persisting: boolean) => set({ isPersisting: persisting }),
  // Comprehensive session state reset - clears ALL session-related state
  resetSessionState: () => set({
    sessionId: null,
    sessionInfo: null,
    currentItem: null,
    templateItems: null,
    formData: null,
    patientInfo: null,
    hasJoinedRoom: false,
    roomParticipants: 0,
    patientConnected: false,
    patientList: {},
    sessionStarted: false,
    sessionPaused: false,
    sessionCompleted: false,
    patientFinalized: false,
    qrData: null,
    patientQrData: null,
    isPersisting: false,
    showEndModal: false,
    patient: '',
  }),
}));

