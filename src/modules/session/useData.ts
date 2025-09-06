"use client";

import {useState, useEffect} from "react";
import {sampleData} from "@/data/data";

import type {UseDataOptions} from "@/models/utils";
import type {AssessmentItem} from "@/models/context";

export default function useData({
  socket,
  sessionId,
  currentItem,
  updateCurrentItem,
}: UseDataOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const length = sampleData.length;
  const item = sampleData[currentIndex];

  useEffect(() => {
    if (
      currentItem &&
      currentItem.item &&
      typeof currentItem.item === "object"
    ) {
      const index = sampleData.findIndex(
        (item) => item.item === currentItem.item.item
      );
      if (index !== -1 && index !== currentIndex) {
        setCurrentIndex(index);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem]);

  const changeItem = (direction: number) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < sampleData.length) {
      setCurrentIndex(newIndex);

      // for user save localstorage event
      if (updateCurrentItem && sessionId) {
        const newAssessmentItem: AssessmentItem = {
          item: sampleData[newIndex],
          sessionId,
        };
        updateCurrentItem(newAssessmentItem);
      } else {
        // for ws message when may change
        try {
          const isValidIndex = newIndex >= 0 && newIndex < sampleData.length;
          if (socket && socket.readyState === WebSocket.OPEN && isValidIndex) {
            const message = {
              type: "changeAssessmentItem",
              item: {item: sampleData[newIndex], sessionId},
              sessionId,
            };
            socket.send(JSON.stringify(message));
          }
        } catch (error) {
          console.error("useData error sending WebSocket message:", error);
        }
      }
    }
  };

  return {changeItem, item, length};
}
