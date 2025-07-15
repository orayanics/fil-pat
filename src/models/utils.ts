import { AssessmentItem } from "./context";

export interface UseDataOptions {
  socket: WebSocket | null;
  sessionId: string | null;
  currentItem?: AssessmentItem | null;
}

export interface UseQrOptions {
  socket: WebSocket | null;
}

export type Role = "patient" | "clinician";
