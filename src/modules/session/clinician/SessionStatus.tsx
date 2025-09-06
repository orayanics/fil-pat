"use client";

import {useSocketState} from "@/context/SocketProvider";
import {Alert, CircularProgress} from "@mui/joy";

export default function SessionStatus() {
  const {isPersisting} = useSocketState();
  return isPersisting ? (
    <Alert
      color="primary"
      size="md"
      variant="soft"
      startDecorator={<CircularProgress />}
    >
      <strong>The system is saving the current session data!</strong>This is to
      persist data if ever a user is disconnected from the session. Please wait
      until the process is finished.
    </Alert>
  ) : null;
}
