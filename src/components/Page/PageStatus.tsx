
import { useSocketContext } from "@/context/SocketProvider";
import React from "react";
import { Box, Chip } from "@mui/joy";

type ChipColor = "success" | "danger";

interface ChipProps {
  color: ChipColor;
  text: string;
  bg: string;
}



export default function PageStatus() {
  const { connectionStatus } = useSocketContext();

  let chipProps: ChipProps = {
    color: "success",
    text: "Connected",
    bg: "#4caf50",
  };

  if (connectionStatus === "disconnected") {
    chipProps = { color: "danger", text: "Disconnected", bg: "#f44336" };
  } else if (connectionStatus === "error") {
    chipProps = { color: "danger", text: "Session Failed", bg: "#f44336" };
  }

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
      <Chip
        startDecorator={
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: "50%",
              backgroundColor: chipProps.bg,
              border: "1px solid #ccc",
            }}
          />
        }
        variant="soft"
        color={chipProps.color}
      >
        {chipProps.text}
      </Chip>
    </Box>
  );
}