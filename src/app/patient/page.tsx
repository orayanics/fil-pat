"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useWebSocket } from "../../lib";

export default function Patient() {
  const room = useSearchParams().get("room") || "default";
  const [count, setCount] = useState(0);
  const { eventSource, isConnected } = useWebSocket(room);

  useEffect(() => {
    if (!eventSource) {
      console.log("No eventSource available yet");
      return;
    }

    console.log("Setting up event listeners for EventSource");

    const onMessage = (e: MessageEvent) => {
      try {
        console.log("Patient received message:", e.data);
        const data = JSON.parse(e.data);
        if (data.count !== undefined) {
          console.log("Updating count to:", data.count);
          setCount(data.count);
        }
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    };

    const onError = (error: Event) => {
      console.error("EventSource error on patient side:", error);
    };

    const onOpen = () => {
      console.log("EventSource connected on patient side for room:", room);
    };

    eventSource.addEventListener("message", onMessage);
    eventSource.addEventListener("error", onError);
    eventSource.addEventListener("open", onOpen);

    return () => {
      console.log("Removing event listeners");
      eventSource.removeEventListener("message", onMessage);
      eventSource.removeEventListener("error", onError);
      eventSource.removeEventListener("open", onOpen);
    };
  }, [eventSource, room]);

  return (
    <div style={{ fontSize: 32, padding: 40 }}>
      this is patient
      <br />
      Room: {room}
      <br />
      Connection: {isConnected ? "Connected" : "Disconnected"}
      <br />
      Count: {count}
    </div>
  );
}
