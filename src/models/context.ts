export type SocketState = {
  socket: WebSocket | null;
  isConnected: boolean;
  sessionId: string | null;
  currentItem: AssessmentItem | null;
  formData: Record<string, unknown>;
  qrData: {qrData: string; sessionId: string} | null;
  isPersisting: boolean;
};

export type SocketDispatch = {
  updateFormData: (data: Record<string, unknown>) => void;
  updateCurrentItem: (item: AssessmentItem) => void;
  saveSessionManually: () => void;
  sendMessage: (message: string) => void;
};

export type QrItem = {
  qrData: string;
  sessionId: string;
};

export type AssessmentItem = {
  item: {
    item: number;
    question: string;
    sound: string;
    ipa_key: string;
    group: string;
    consonants: number;
    vowel: number;
    image?: string;
  };
  sessionId: string;
};
