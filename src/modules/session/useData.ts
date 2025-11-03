"use client";

import { useMemo } from "react";
import type { UseDataOptions } from "@/models/utils";
import { useSocketStore } from '@/context/socketStore';
import type { AssessmentItem } from '@/context/socketStore';

export default function useData({ socket, sessionId, currentItem }: UseDataOptions) {
  const templateItems = useSocketStore((s) => s.templateItems);
  const sessionInfo = useSocketStore((s) => s.sessionInfo);

  const length = sessionInfo?.total_items ?? (Array.isArray(templateItems) ? templateItems.length : 0);

  // Normalize an item object used by UI: prefer currentItem, otherwise derive from templateItems
  const item = useMemo(() => {
    if (currentItem) return ({ ...currentItem, item: currentItem.item_number ?? currentItem.item_id });
    if (Array.isArray(templateItems) && templateItems.length > 0) {
      const idx = Math.max(0, (sessionInfo?.completed_items ?? 0));
      const t = (templateItems as Array<Record<string, unknown>>)[idx] ?? templateItems[0];
      return ({
        item: (t['item_number'] as number) ?? (t['item_id'] as number) ?? 1,
        item_number: (t['item_number'] as number) ?? (t['item_id'] as number) ?? 1,
        item_id: (t['item_id'] as number) ?? (t['item_number'] as number) ?? 0,
        question: (t['question'] as string) ?? (t['prompt'] as string) ?? '',
        image: (t['image'] as string) ?? (t['image_url'] as string) ?? (t['image_url'] as string) ?? '',
        image_url: (t['image_url'] as string) ?? (t['image'] as string) ?? '',
        sound: (t['sound'] as string) ?? (t['audio'] as string) ?? null,
        ipa_key: (t['ipa_key'] as string) ?? null,
        consonants: (t['consonants_count'] as number) ?? null,
        vowel: (t['vowels_count'] as number) ?? null,
      } as unknown as AssessmentItem);
    }
    return null;
  }, [currentItem, templateItems, sessionInfo]);

  const changeItem = (direction: number) => {
    try {
      if (!socket || socket.readyState !== WebSocket.OPEN || !sessionId) return;
      const type = direction > 0 ? 'nextItem' : 'prevItem';
      socket.send(JSON.stringify({ type, sessionId }));
    } catch (error) {
      console.error("useData error sending navigation message:", error);
    }
  };

  return { changeItem, item, length };
}
