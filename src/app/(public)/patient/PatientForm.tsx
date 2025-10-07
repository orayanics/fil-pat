"use client";
import {useState} from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  FormControl,
  FormLabel,
  Input,
  Typography,
  CircularProgress,
} from "@mui/joy";
import {InfoRounded} from "@mui/icons-material";

import { useSocketStore } from "@/context/socketStore";

export default function PatientForm() {
  const patient = useSocketStore((state) => state.patient);
  const setPatient = useSocketStore((state) => state.setPatient);
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!patient.trim()) return;
    setLoading(true);
    const patientId = Math.random().toString(36).substring(2, 15);
    setLoading(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <Box
      sx={{
        textAlign: "center",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Typography
        component="h1"
        level="h3"
        sx={{fontSize: "clamp(2rem, 5vw, 2.15rem)"}}
      >
        Welcome to Fil-PAT
      </Typography>

      <Card
        variant="outlined"
        size="lg"
        sx={{
          boxShadow: "lg",
          minWidth: 320,
          maxWidth: 500,
          mx: "auto",
          p: 4,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Alert startDecorator={<InfoRounded />} color="primary" variant="soft">
          To be able to join a session, please provide your name.
        </Alert>
        <FormControl required>
          <FormLabel>Name</FormLabel>
          <Input
            placeholder="ex. Juan Dela Cruz"
            value={patient}
            onChange={(e) => setPatient(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </FormControl>
        <Button
          onClick={handleSubmit}
          fullWidth
          variant="solid"
          disabled={loading}
        >
          {loading ? <CircularProgress size="sm" /> : "Submit"}
        </Button>
      </Card>
    </Box>
  );
}
