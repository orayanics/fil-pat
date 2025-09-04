import { Box, Typography, Alert } from "@mui/joy";
import { InfoRounded } from "@mui/icons-material";
import CircularProgress from "@mui/joy/CircularProgress";

export default function PatientStatus({
  isQrGenerated,
}: {
  isQrGenerated?: boolean;
}) {
  if (!isQrGenerated) {
    return (
      <Box padding={2}>
        <CircularProgress size="lg" />
        <Typography level="h2">Waiting for QR Code</Typography>
        <Typography level="body-md" sx={{ mb: 2 }}>
          The clinician will generate a QR code for you to join the session.
        </Typography>
      </Box>
    );
  }

  return (
    <Box padding={2}>
      <Typography level="h2">Join the Session</Typography>
      <Typography level="body-md" sx={{ mb: 2 }}>
        Scan the QR code below to join the session with your clinician.
      </Typography>

      <Alert startDecorator={<InfoRounded />} color="primary" variant="soft">
        If you are unable to scan the QR code, the clinician can redirect you to
        the session manually.
      </Alert>
    </Box>
  );
}
