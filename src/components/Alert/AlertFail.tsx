"use client";
import {Snackbar, CircularProgress, Typography, Box, Button} from "@mui/joy";

export default function AlertFail({isConnected}: {isConnected: boolean}) {
  return (
    <Snackbar
      open={isConnected}
      autoHideDuration={null}
      variant="soft"
      color="danger"
      invertedColors
      anchorOrigin={{vertical: "top", horizontal: "center"}}
      endDecorator={
        <Button
          variant="plain"
          color="danger"
          onClick={() => window.location.reload()}
        >
          Refresh
        </Button>
      }
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Box sx={{display: "flex", gap: 1, alignItems: "center"}}>
          <CircularProgress size="sm" color="danger" />
          <Typography level="title-md" fontWeight={700}>
            Lost Connection
          </Typography>
        </Box>
        <Typography level="body-md">
          We are trying to reconnect you. If the problem persists, please
          refresh the page or check your internet connection.
        </Typography>
      </Box>
    </Snackbar>
  );
}
