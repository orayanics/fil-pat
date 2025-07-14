"use client";
import { useState } from "react";
import QRCode from "qrcode";
import { Button } from "@mui/joy";
import Image from "next/image";

export default function GenerateQR() {
  const [qrCode, setQrCode] = useState<string | null>(null);

  const generateQRCode = async () => {
    try {
      const qr = await QRCode.toDataURL("Hello World", {
        width: 200,
        margin: 1,
      });
      setQrCode(qr);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  return (
    <>
      <Button onClick={generateQRCode}>Generate QR Code</Button>
      {qrCode && (
        <div>
          <h3>Generated QR Code:</h3>
          <Image src={qrCode} alt="QR Code" width={200} height={200} />
        </div>
      )}
    </>
  );
}
