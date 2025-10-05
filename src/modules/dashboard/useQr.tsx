"use client";
import {useState} from "react";
import QRCode from "qrcode";
import getLocalIp from "@/utils/getLocalIp";

const BASE_URL = getLocalIp() ?? "http://localhost:3000";

import type {Role, UseQrOptions} from "@/models/utils";

export default function useQr({socket}: UseQrOptions) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const buildSessionUrl = (role: Role, id: string) => {
    return `${BASE_URL}/session/${role}/${id}`;
  };

  async function generate(role: Role) {
    const id = Math.random().toString(36).substring(2, 15);
    const url = buildSessionUrl(role, id);

    setSessionId(id);

    try {
      const primary = await QRCode.toDataURL(url, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: "H",
      }).catch((err) => {
        console.error("Error generating QR code:", err);
        return null;
      });

      setQrCode(primary);

      if (!primary) return;

      if (socket) {
        socket.send(
          JSON.stringify({
            type: "sendQrData",
            qrData: primary,
            sessionId: id,
            qr: primary,
          })
        );
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      setQrCode(null);
    }
  }
  return {qrCode, sessionId, buildSessionUrl, generate};
}
