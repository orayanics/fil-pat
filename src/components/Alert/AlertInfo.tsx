import {Snackbar, CircularProgress, Typography, Box} from "@mui/joy";

export default function AlertInfo({isOpen}: {isOpen: boolean}) {
  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={null}
      variant="soft"
      color="primary"
      invertedColors
      anchorOrigin={{vertical: "top", horizontal: "center"}}
      sx={{
        boxShadow: "md",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1,
        }}
      >
        <Box sx={{display: "flex", gap: 1, alignItems: "center"}}>
          <CircularProgress size="sm" color="primary" />
          <Typography level="title-md" fontWeight={700}></Typography>
        </Box>
        <Typography level="body-md">
          Persisting current data. Please wait until the process is finished.
        </Typography>
      </Box>
    </Snackbar>
  );
}
