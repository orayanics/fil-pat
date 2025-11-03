import {AssessmentItem} from "@/context/socketStore";
import {ReactNode} from "react";
import {EmotionCache, Options} from "@emotion/cache";

export interface UseDataOptions {
  socket: WebSocket | null;
  sessionId: string | null;
  currentItem?: AssessmentItem | null;
  // updateCurrentItem may be provided by older dispatch implementations and
  // accepts a generic record shape; keep it flexible to avoid type conflicts.
  updateCurrentItem?: (item: Record<string, unknown>) => void;
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
