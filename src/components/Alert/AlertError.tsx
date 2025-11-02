import { Snackbar, Box } from "@mui/joy";

export default function AlertError({ isOpen, message, onClose }: { isOpen: boolean; message?: string; onClose?: () => void }) {
  return (
    <Snackbar
      open={isOpen}
      onClose={onClose}
      autoHideDuration={4000}
      variant="soft"
      color="danger"
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Box sx={{ p: 1 }}>{message ?? 'An error occurred'}</Box>
    </Snackbar>
  );
}
