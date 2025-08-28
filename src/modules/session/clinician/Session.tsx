import SessionCard from "./SessionCard";
import SessionForm from "./SessionForm";
import SessionActions from "./SessionActions";

import {Alert, Box, CircularProgress} from "@mui/joy";
import {useSocketContext} from "@/context/SocketProvider";

export default function Session() {
  const {isPersisting} = useSocketContext();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {isPersisting && (
        <Alert
          color="primary"
          size="md"
          variant="soft"
          startDecorator={<CircularProgress />}
        >
          <strong>The system is saving the current session data!</strong>This is
          to persist data if ever a user is disconnected from the session.
          Please wait until the process is finished.
        </Alert>
      )}

      <Box width={"100%"}>
        <SessionActions />
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: {xs: "wrap", md: "nowrap"},
        }}
      >
        <SessionCard />
        <SessionForm />
      </Box>
    </Box>
  );
}
