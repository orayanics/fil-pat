import { AssessmentItem } from "./context";
import { ReactNode } from "react";
import { EmotionCache, Options } from "@emotion/cache";

export interface UseDataOptions {
  socket: WebSocket | null;
  sessionId: string | null;
  currentItem?: AssessmentItem | null;
}

export interface UseQrOptions {
  socket: WebSocket | null;
}

export type Role = "patient" | "clinician";

// MUI Theme
export interface ThemeRegistryProps {
  options: Options;
  children: ReactNode;
}

export interface CacheState {
  cache: EmotionCache;
  flush: () => string[];
}
