"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import type {LoginPayload} from "@/models/auth";

type LoginResponse = {
  success: boolean;
  user?: Record<string, unknown>;
  error?: string;
};

declare global {
  interface Window {
    dbApi: {
      login(username: string, password: string): Promise<LoginResponse>;
    };
  }
}

export default function useLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login({username, password}: LoginPayload) {
    if (typeof window === "undefined") return;

    setIsLoading(true);
    setError(null);

    try {
      const {
        success,
        user,
        error: loginError,
      } = await window.dbApi.login(username, password);

      if (!success || !user) {
        throw new Error(loginError || "Invalid credentials");
      }

      localStorage.setItem("clinicianLoggedIn", "true");
      localStorage.setItem("clinician", JSON.stringify(user));
      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Login failed unexpectedly";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return {login, isLoading, error};
}
