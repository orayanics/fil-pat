import {Button} from "@mui/joy";
import {RoomsListProps, Patient} from "@/models/context";

export default function RoomsList({
  patientList,
  sendingQr,
  handleSendQr,
  handleJoinRoom,
}: RoomsListProps) {
  const isEmpty = Object.values(patientList).length === 0;

  if (isEmpty) return <EmptyList />;

  return (
    <>
      {Object.values(patientList).map((p: Patient) => (
        <tr key={p.patientId}>
          <td>{p.patientName}</td>
          <td>{p.patientId}</td>
          <td>
            <Button
              size="sm"
              onClick={() => handleSendQr(p.patientId)}
              sx={{mr: 1}}
              disabled={sendingQr === p.patientId}
            >
              {sendingQr === p.patientId ? "Sending..." : "Send QR"}
            </Button>
            <Button
              size="sm"
              variant="soft"
              onClick={() => handleJoinRoom(p.patientId)}
            >
              Join Room
            </Button>
          </td>
        </tr>
      ))}
    </>
  );
}

const EmptyList = () => {
  return (
    <tr>
      <td colSpan={3}>No patients found</td>
    </tr>
  );
};
