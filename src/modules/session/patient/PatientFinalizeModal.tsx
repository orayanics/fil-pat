"use client";
import { useState, useEffect } from "react";
import {
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Select,
  Option,
  Textarea,
  Button,
  Typography,
  Alert,
} from "@mui/joy";
import { CheckCircle, Person } from "@mui/icons-material";
import { useSocketStore } from "@/context/socketStore";
import { useSocketContext } from "@/context/SocketProvider";

interface PatientFinalizeModalProps {
  sessionId: string;
}

export default function PatientFinalizeModal({ sessionId }: PatientFinalizeModalProps) {
  const sessionCompleted = useSocketStore((s) => s.sessionCompleted);
  const patientFinalized = useSocketStore((s) => s.patientFinalized);
  const { sendMessage } = useSocketContext();
  
  const [open, setOpen] = useState(false);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Open modal when session is completed
  useEffect(() => {
    console.log('[PatientFinalizeModal] sessionCompleted:', sessionCompleted, 'patientFinalized:', patientFinalized);
    if (sessionCompleted && !patientFinalized) {
      console.log('[PatientFinalizeModal] Opening modal');
      setOpen(true);
    }
  }, [sessionCompleted, patientFinalized]);

  // Close modal when patient is finalized
  useEffect(() => {
    if (patientFinalized) {
      setOpen(false);
    }
  }, [patientFinalized]);

  const handleSubmit = async () => {
    setError("");
    setIsSubmitting(true);

    try {
      // Send finalize message to server with only additional optional info
      sendMessage({
        type: "finalizePatient",
        sessionId,
        age: age ? Number(age) : undefined,
        gender: gender || undefined,
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      console.error("Failed to finalize patient:", err);
      setError("Failed to save patient information. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    setOpen(false);
  };

  if (!sessionCompleted) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={(_, reason) => {
        // Prevent closing by clicking outside or pressing escape
        if (reason === "backdropClick" || reason === "escapeKeyDown") {
          return;
        }
      }}
    >
      <ModalDialog
        sx={{
          maxWidth: 500,
          borderRadius: "lg",
          p: 3,
          boxShadow: "lg",
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <Person />
            <Typography level="h4">Save Your Information</Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Stack spacing={2.5}>
            <Typography level="body-md" sx={{ color: 'text.secondary' }}>
              The session has been completed. You may optionally provide additional information below.
            </Typography>

            {error && (
              <Alert color="danger" variant="soft">
                {error}
              </Alert>
            )}

            {patientFinalized && (
              <Alert
                color="success"
                variant="soft"
                startDecorator={<CheckCircle />}
              >
                Your information has been saved successfully!
              </Alert>
            )}

            <Stack spacing={2}>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Age (optional)</FormLabel>
                  <Input
                    type="number"
                    placeholder="Enter age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    disabled={isSubmitting || patientFinalized}
                    slotProps={{
                      input: {
                        min: 0,
                        max: 120,
                      },
                    }}
                  />
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Gender (optional)</FormLabel>
                  <Select
                    placeholder="Select gender"
                    value={gender}
                    onChange={(_, value) => setGender(value || "")}
                    disabled={isSubmitting || patientFinalized}
                  >
                    <Option value="Male">Male</Option>
                    <Option value="Female">Female</Option>
                    <Option value="Other">Other</Option>
                    <Option value="Prefer not to say">Prefer not to say</Option>
                  </Select>
                </FormControl>
              </Stack>

              <FormControl>
                <FormLabel>Additional Notes (optional)</FormLabel>
                <Textarea
                  placeholder="Any additional information..."
                  minRows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting || patientFinalized}
                />
              </FormControl>
            </Stack>

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="plain"
                color="neutral"
                onClick={handleSkip}
                disabled={isSubmitting || patientFinalized}
              >
                Skip
              </Button>
              <Button
                variant="solid"
                color="primary"
                onClick={handleSubmit}
                loading={isSubmitting}
                disabled={patientFinalized}
              >
                Save Information
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </ModalDialog>
    </Modal>
  );
}
