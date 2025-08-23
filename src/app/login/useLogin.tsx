"use client";
import {useState} from "react";
import {useRouter} from "next/router";

type LoginPayload = {
  username: string;
  password: string;
};

declare global {
  interface Window {
    dbApi: {
      login(
        username: string,
        password: string
      ): Promise<{
        success: boolean;
        user?: Record<string, unknown>;
        error?: string;
      }>;
    };
  }
}

export default function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function login(payload: LoginPayload) {
    setIsLoading(true);
    try {
      const {success, user, error} = await window.dbApi.login(
        payload.username,
        payload.password
      );
      if (success && user) {
        localStorage.setItem("clinicianLoggedIn", "true");
        localStorage.setItem("clinician", JSON.stringify(user));

        router.push("/dashboard");
      } else {
        setError(error || "Invalid credentials");
      }
    } catch {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }

  return {login, isLoading, error};
}
