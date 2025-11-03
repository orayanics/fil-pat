"use client";

import PrivateSidebar from "@/components/Layout/PrivateSidebar";
import AuthGuard from "@/components/auth/authGuard";
import { Box } from "@mui/joy";
import DashboardRooms from "@/modules/dashboard/DashboardRooms";

export default function ClinicianDashboardPage() {
  // QR generation logic moved here from DashboardRooms

  async function qrGenerateQrData(url: string): Promise<string> {
    const QRCode = (await import("qrcode")).default;
    return QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: "H",
    });
  }

  return (
    <AuthGuard>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <PrivateSidebar />
        <Box sx={{ flex: 1, p: 4, pt: { xs: '72px', sm: 4 } }}>
          <DashboardRooms qrGenerateQrData={qrGenerateQrData} />
        </Box>
      </Box>
    </AuthGuard>
  );
}
