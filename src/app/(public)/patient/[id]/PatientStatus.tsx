import {useParams} from "next/navigation";
import {Box, Typography, Alert, Button} from "@mui/joy";
import {InfoRounded} from "@mui/icons-material";
import CircularProgress from "@mui/joy/CircularProgress";

export default function PatientStatus({
  isQrGenerated,
}: {
  isQrGenerated?: boolean;
}) {
  const params = useParams();
  const sessionId = params.id as string;

  if (!isQrGenerated) {
    return (
      <Box padding={2}>
        <CircularProgress size="lg" />
        <Typography level="h2">Waiting for QR Code</Typography>
        <Typography level="body-md" sx={{mb: 2}}>
          The clinician will generate a QR code for you to join the session.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        textAlign: "center",
        gap: 2,
        display: "flex",
        flexDirection: "column",
        padding: 2,
      }}
    >
      <div>
        <Typography level="h2">Join the Session</Typography>
        <Typography level="body-md">
          Scan the QR code below to join the session with your clinician.
        </Typography>
      </div>

      <Alert startDecorator={<InfoRounded />} color="primary" variant="soft">
        If you are unable to scan the QR code, you can redirect to the URL.
      </Alert>

      <Button
        variant="solid"
        color="primary"
        onClick={() => window.open(`/session/patient/${sessionId}`, "_blank")}
        sx={{width: "100%"}}
      >
        Join Session
      </Button>
    </Box>
  );
}
