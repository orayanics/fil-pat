import { useState, useEffect } from "react";
import { sampleData } from "@/data/data";

interface UseQrOptions {
  socket: WebSocket | null;
  sessionId: string | null;
  currentItem?: unknown;
}

export default function useData({
  socket,
  sessionId,
  currentItem,
}: UseQrOptions) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const item = sampleData[currentIndex];

  useEffect(() => {
    if (currentItem) {
      const index = sampleData.findIndex(
        (item) => item.item === currentItem.item
      );
      if (index !== -1 && index !== currentIndex) {
        console.log(`Syncing currentIndex from ${currentIndex} to ${index}`);
        setCurrentIndex(index);
      }
    }
  }, [currentItem]);

  const changeItem = (direction: number) => {
    const newIndex = currentIndex + direction;
    if (newIndex >= 0 && newIndex < sampleData.length) {
      setCurrentIndex(newIndex);
    }

    try {
      const isValidIndex = newIndex >= 0 && newIndex < sampleData.length;
      if (socket && socket.readyState === WebSocket.OPEN && isValidIndex) {
        const message = {
          type: "changeAssessmentItem",
          item: sampleData[newIndex],
          sessionId,
        };
        socket.send(JSON.stringify(message));
      }
    } catch (error) {
      console.error("useData error sending WebSocket message:", error);
    }
  };

  return { changeItem, item };
}
