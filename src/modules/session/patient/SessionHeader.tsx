import React from "react";
import { useSocketContext } from "@/context/SocketProvider";

export default function SessionHeader() {
  const { isConnected } = useSocketContext();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        justifyContent: "center",
        zIndex: 1000,
        position: "sticky",
        top: 0,
        backgroundColor: "#fff",
      }}
    >
      <p style={{ margin: 0, fontWeight: "bold" }}>Fil-PAT</p>
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: isConnected ? "#4caf50" : "#f44336",
            border: "1px solid #ccc",
          }}
        />
        <span style={{ fontSize: 14 }}>
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </span>
    </div>
  );
}
