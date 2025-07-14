"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useWebSocket } from "../../lib";

export default function Clinician() {
  const room = useSearchParams().get("room") || "default";
  const { send } = useWebSocket(room);
  const [count, setCount] = useState(0);

  const handleCountChange = () => {
    const newCount = count + 1;
    setCount(newCount);
    send(JSON.stringify({ type: "set-count", room, count: newCount }));
  };

  return (
    <div style={{ fontSize: 32, padding: 40 }}>
      this is clinician
      <br />
      <button
        onClick={() => send(JSON.stringify({ type: "change-page", room }))}
      >
        Sync to patient
      </button>
      <br />
      <p>Current Count: {count}</p>
      <button onClick={handleCountChange}>Increment Count</button>
    </div>
  );
}
