"use client";
import {useRouter} from "next/navigation";
import {Box, Card, Table, Button} from "@mui/joy";

import RoomsList from "./RoomsList";

import {useState} from "react";
import {useSocketState, useSocketDispatch} from "@/context/SocketProvider";

export default function DashboardRooms() {
  const router = useRouter();
  const {patientList, socket, isConnected} = useSocketState();
  const {sendMessage} = useSocketDispatch();
  const [sendingQr, setSendingQr] = useState<string | null>(null);

  const handleSendQr = async (patientId: string) => {
    setSendingQr(patientId);
    const url = `/patient/${patientId}`;
    try {
      const qrDataUri = await qrGenerateQrData(url);
      if (socket && socket.readyState === WebSocket.OPEN) {
        sendMessage(
          JSON.stringify({
            type: "sendQrData",
            qrData: qrDataUri,
            sessionId: patientId,
          })
        );
        alert("QR sent to patient!");
      }
    } catch (err) {
      console.error("QR generation error:", err);
    }
    setSendingQr(null);
  };

  async function qrGenerateQrData(url: string): Promise<string> {
    const QRCode = (await import("qrcode")).default;
    return QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: "H",
    });
  }

  const handleJoinRoom = (patientId: string) => {
    router.push(`/session/clinician/${patientId}`);
  };

  const handleRefreshList = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      sendMessage(JSON.stringify({type: "requestPatientList"}));
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <h1>Patient List</h1>
        <Button
          size="sm"
          variant="outlined"
          onClick={handleRefreshList}
          disabled={!isConnected}
        >
          Refresh List
        </Button>
      </Box>

      <Card sx={{boxShadow: "md", p: 2}}>
        <Table>
          <thead>
            <tr>
              <th>Patient Name</th>
              <th>Patient ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <RoomsList
              patientList={patientList}
              sendingQr={sendingQr}
              handleSendQr={handleSendQr}
              handleJoinRoom={handleJoinRoom}
            />
          </tbody>
        </Table>
      </Card>
    </Box>
  );
}
