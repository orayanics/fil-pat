"use client";


import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LoginPayload } from "@/models/auth";
import { useSocketStore } from "@/context/socketStore";

export default function useLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setUser = useSocketStore((state) => state.setUser);
  const setIsAuthenticated = useSocketStore((state) => state.setIsAuthenticated);

  async function login({ username, password }: LoginPayload) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.user) {
        throw new Error(data.error || "Invalid credentials");
      }
      localStorage.setItem("clinicianLoggedIn", "true");
      localStorage.setItem("clinician", JSON.stringify(data.user));
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      // Wait for state to sync before redirect
      setTimeout(() => {
        if (data.user.is_admin) {
          router.replace("/admin-dashboard");
        } else {
          router.replace("/clinician-dashboard");
        }
      }, 50);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed unexpectedly";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return { login, isLoading, error };
}
