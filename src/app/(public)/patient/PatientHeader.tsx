import {Box, Chip} from "@mui/joy";
import {useSocketState} from "@/context/SocketProvider";

export default function PatientHeader() {
  const {isConnected} = useSocketState();
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        justifyContent: "center",
        zIndex: 1000,
        position: "sticky",
        top: 0,
        backgroundColor: "#fff",
        padding: 1,
      }}
      borderBottom={1}
      borderColor="divider"
    >
      <p>Fil-PAT</p>
      {isConnected ? (
        <Chip variant="soft" color="success">
          Connected
        </Chip>
      ) : (
        <Chip variant="soft" color="danger">
          Disconnected
        </Chip>
      )}
    </Box>
  );
}
