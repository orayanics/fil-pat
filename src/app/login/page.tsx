"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    dbApi: {
      login(username: string, password: string): Promise<{
        success: boolean;
        user?: Record<string, unknown>;
        error?: string;
      }>;
    }
  }
}

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const result = await window.dbApi.login(username, password);
      if (result.success && result.user) {
        localStorage.setItem("clinicianLoggedIn", "true");
        localStorage.setItem("clinician", JSON.stringify(result.user));
        router.push("/dashboard");
      } else {
        setError(result.error || "Invalid credentials.");
        usernameRef.current?.focus();
      }
    } catch {
      setError("An unexpected error occurred.");
      usernameRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-blue-100">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
          Clinician Login
        </h2>

        <div className="space-y-4">
          <input
            ref={usernameRef}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Username"
            className="w-full px-4 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50"
          />
          <input
            ref={passwordRef}
            value={password}
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Password"
            className="w-full px-4 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50"
          />
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
        </div>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className={`w-full mt-6 py-2 rounded-md text-white font-medium transition ${
            isLoading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </div>
    </div>
  );
}
