import { Snackbar, Box } from "@mui/joy";

export default function AlertSuccess({ isOpen, message, onClose }: { isOpen: boolean; message?: string; onClose?: () => void }) {
  return (
    <Snackbar
      open={isOpen}
      onClose={onClose}
      autoHideDuration={3000}
      variant="soft"
      color="success"
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Box sx={{ p: 1 }}>{message ?? 'Success'}</Box>
    </Snackbar>
  );
}
