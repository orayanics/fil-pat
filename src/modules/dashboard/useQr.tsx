import { useState } from "react";
import QRCode from "qrcode";

const BASE_URL = process.env.NEXT_PUBLIC_ASSESSMENT_BASE_URL;

type Role = "patient" | "clinician";

interface UseQrOptions {
  socket: WebSocket | null;
}

export default function useQr({ socket }: UseQrOptions) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const buildSessionUrl = (role: Role, id: string) => {
    return `${BASE_URL}/session/${role}/${id}`;
  };

  async function generate(role: Role) {
    const id = Math.random().toString(36).substring(2, 15);
    const url = buildSessionUrl(role, id);

    setSessionId(id);
    let dummy = "";

    setQrCode(
      await QRCode.toDataURL(url, {
        width: 200,
        margin: 1,
        errorCorrectionLevel: "H",
      }).catch((error) => {
        console.error("Error generating QR code:", error);
        return null;
      })
    );

    dummy = await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: "H",
    });

    if (socket) {
      socket.send(
        JSON.stringify({
          type: "sendQrData",
          qrData: dummy,
          sessionId: id,
          qr: dummy,
        })
      );
    }
  }
  return { qrCode, sessionId, buildSessionUrl, generate };
}
