"use client";
import { useSocketContext } from "@/context/SocketProvider";
import {useRouter} from "next/navigation";
import {Box, Card, Table, Button} from "@mui/joy";
import RoomsList from "./RoomsList";

export default function DashboardRooms() {
  const router = useRouter();
  const socketContext = useSocketContext();
  const { socket, isConnected, sendMessage, patientList } = socketContext;

  const handleJoinRoom = (patientId: string) => {
    router.push(`/session/clinician/${patientId}`);
  };

  const handleRefreshList = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      sendMessage({ type: "requestPatientList" });
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
              handleJoinRoom={handleJoinRoom}
            />
          </tbody>
        </Table>
      </Card>
    </Box>
  );
}
