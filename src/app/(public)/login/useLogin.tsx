"use client";

import {useState} from "react";
import {useRouter} from "next/navigation";
import type {LoginPayload} from "@/models/auth";

export default function useLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login({username, password}: LoginPayload) {
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
      if (data.user.is_admin) {
        router.replace("/admin-dashboard");
      } else {
  router.replace("/clinician-dashboard");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed unexpectedly";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return {login, isLoading, error};
}
