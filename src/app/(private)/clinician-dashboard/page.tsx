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
  const { connectionStatus, socket, reconnect } = useSocketContext();
  const [reconnecting, setReconnecting] = useState(false);

  const handleReconnect = async () => {
    setReconnecting(true);
    try {
      // Close existing connection if any
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close(1000, 'Manual reconnect');
      }
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 300));
      // Reconnect
      if (reconnect) {
        reconnect();
      }
      // Give it time to connect
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error('Reconnect error:', err);
    } finally {
      setReconnecting(false);
    }
  };

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
                color={connectionStatus === 'connected' ? 'neutral' : 'primary'}
                startDecorator={<Refresh />}
                onClick={handleReconnect}
                loading={reconnecting}
                disabled={connectionStatus === 'connected' && !reconnecting}
              >
                {connectionStatus === 'connected' ? 'Connected' : 'Reconnect'}
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
