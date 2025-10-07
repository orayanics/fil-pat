import { useSocketContext } from "@/context/SocketProvider";
import React from "react";
import { Box, Chip } from "@mui/joy";

export default function SessionStatus() {
  const { isConnected } = useSocketContext();
  return (
    <Box
      sx={{
        zIndex: 1000,
        position: "sticky",
        backgroundColor: "background.body",
        padding: 1,
      }}
      borderColor="divider"
    >
      {isConnected ? (
        <Chip
          startDecorator={
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#4caf50",
                border: "1px solid #ccc",
              }}
            />
          }
          variant="soft"
          color="success"
        >
          Connected
        </Chip>
      ) : (
        <Chip
          startDecorator={
            <span
              style={{
                display: "inline-block",
                width: 12,
                height: 12,
                borderRadius: "50%",
                backgroundColor: "#f44336",
                border: "1px solid #ccc",
              }}
            />
          }
          variant="soft"
          color="danger"
        >
          Disconnected
        </Chip>
      )}
    </Box>
  );
}
