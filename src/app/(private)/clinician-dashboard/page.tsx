"use client";

import PrivateSidebar from "@/components/Layout/PrivateSidebar";
import AuthGuard from "@/components/auth/authGuard";
import { Box, Tabs, TabList, Tab, TabPanel, Button, Stack, Chip, Typography } from "@mui/joy";
import { Refresh } from "@mui/icons-material";
import ModernDashboard from "@/modules/dashboard/ModernDashboard";
import DashboardRooms from "@/modules/dashboard/DashboardRooms";
import { useSocketContext } from "@/context/SocketProvider";
import { useState } from "react";

export default function ClinicianDashboardPage() {
  const { connectionStatus, socket } = useSocketContext();
  const [refreshing, setRefreshing] = useState(false);

  // QR generation logic moved here from DashboardRooms
  async function qrGenerateQrData(url: string): Promise<string> {
    const QRCode = (await import("qrcode")).default;
    return QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: "H",
    });
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Close existing WebSocket connection gracefully
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'Manual refresh');
      }
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));
      // Reload the page without clearing auth
      window.location.reload();
    } catch (err) {
      console.error('Refresh error:', err);
      setRefreshing(false);
    }
  };

  return (
    <AuthGuard>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <PrivateSidebar />
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: '72px', sm: 4 } }}>
          {/* Header with Connection Status */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography level="h3">Clinician Dashboard</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip
                size="sm"
                color={connectionStatus === 'connected' ? 'success' : connectionStatus === 'error' ? 'danger' : 'neutral'}
                variant="soft"
              >
                {connectionStatus === 'connected' ? '● Connected' : connectionStatus === 'error' ? '● Error' : '○ Disconnected'}
              </Chip>
              <Button
                size="sm"
                variant="outlined"
                color="neutral"
                startDecorator={<Refresh />}
                onClick={handleRefresh}
                loading={refreshing}
              >
                Refresh
              </Button>
            </Stack>
          </Stack>

          <Tabs defaultValue={0}>
            <TabList sx={{ mb: 3 }}>
              <Tab>Overview</Tab>
              <Tab>Session Controls</Tab>
            </TabList>
            <TabPanel value={0}>
              <ModernDashboard />
            </TabPanel>
            <TabPanel value={1}>
              <DashboardRooms qrGenerateQrData={qrGenerateQrData} />
            </TabPanel>
          </Tabs>
        </Box>
      </Box>
    </AuthGuard>
  );
}
