"use client";

import { useState, useEffect } from "react";

export default function WebSocketCounter() {
  const [counter, setCounter] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket server
    const websocket = new WebSocket("ws://localhost:8080");

    websocket.onopen = () => {
      console.log("Connected to WebSocket server");
      setIsConnected(true);
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "counter") {
          setCounter(data.value);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    websocket.onclose = () => {
      console.log("Disconnected from WebSocket server");
      setIsConnected(false);
      setWs(null);
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      websocket.close();
    };
  }, []);

  const sendMessage = (type: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type }));
    }
  };

  const increment = () => sendMessage("increment");
  const decrement = () => sendMessage("decrement");
  const reset = () => sendMessage("reset");

  return (
    <div className="flex flex-col items-center space-y-4 p-8 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800">WebSocket Counter</h2>

      <div className="flex items-center space-x-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? "bg-green-500" : "bg-red-500"
          }`}
        />
        <span className="text-sm text-gray-600">
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <div className="text-6xl font-bold text-blue-600 py-8">{counter}</div>

      <div className="flex space-x-4">
        <button
          onClick={decrement}
          disabled={!isConnected}
          className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          -
        </button>

        <button
          onClick={reset}
          disabled={!isConnected}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Reset
        </button>

        <button
          onClick={increment}
          disabled={!isConnected}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          +
        </button>
      </div>

      <p className="text-sm text-gray-500 text-center max-w-xs">
        This counter is synchronized across all connected clients in real-time.
      </p>
    </div>
  );
}
