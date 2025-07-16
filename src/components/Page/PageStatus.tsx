import React from "react";
import { Box, Chip } from "@mui/joy";
import { useSocketContext } from "@/context/SocketProvider";

export default function PageStatus() {
  const { isConnected } = useSocketContext();
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
