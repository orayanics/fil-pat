"use client";
import { useEffect, useRef, useCallback, useState } from "react";

export function useWebSocket(room: string) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Create EventSource for receiving updates
    const eventSource = new EventSource(`/api/websocket?room=${room}`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("EventSource connected for room:", room);
      setIsConnected(true);
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      setIsConnected(false);
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log("EventSource connection closed");
      }
    };

    return () => {
      console.log("Closing EventSource for room:", room);
      eventSource.close();
      setIsConnected(false);
    };
  }, [room]);

  // Return a send function that uses fetch to POST updates
  const send = useCallback(async (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === "set-count") {
        console.log(
          "Sending count update:",
          parsed.count,
          "to room:",
          parsed.room
        );
        const response = await fetch("/api/websocket", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ room: parsed.room, count: parsed.count }),
        });

        if (!response.ok) {
          console.error("Failed to send count update:", response.statusText);
        } else {
          const result = await response.json();
          console.log("Count update sent successfully:", result);
        }
      }
    } catch (error) {
      console.error("Error sending data:", error);
    }
  }, []);

  return {
    eventSource: eventSourceRef.current,
    send,
    isConnected,
  };
}
