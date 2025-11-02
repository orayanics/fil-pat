"use client";

import { } from "react";
import type {UseDataOptions} from "@/models/utils";

export default function useData({ socket, sessionId, currentItem }: UseDataOptions) {
  const item = currentItem?.item || null;

  const changeItem = (direction: number) => {
    // Request server to move to next/previous item. Server will broadcast back the new item.
    try {
      if (!socket || socket.readyState !== WebSocket.OPEN || !sessionId) return;
      const type = direction > 0 ? 'nextItem' : 'prevItem';
      socket.send(JSON.stringify({ type, sessionId }));
    } catch (error) {
      console.error("useData error sending navigation message:", error);
    }
  };

  return {changeItem, item, length};
}
