export interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sessionId: string | null;
  sendMessage: (message: string) => void;
  currentItem: AssessmentItem | null;
  joinRoom: () => void;
  qrData: { qrData: string; sessionId: string } | null;
}

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
    image: string;
  };
  sessionId: string;
};
