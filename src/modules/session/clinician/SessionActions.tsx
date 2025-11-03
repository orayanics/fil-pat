"use client";
import { useParams } from "next/navigation";
import { SaveRounded, StopCircleRounded, PictureAsPdfRounded } from "@mui/icons-material";
import {
  Card,
  Tooltip,
  Button,
  Modal,
  ModalDialog,
  ModalClose,
  DialogTitle,
  DialogContent,
  DialogActions,
  Textarea,
  Typography,
  Stack,
} from "@mui/joy";
import { useState } from "react";
import { useSocketDispatch, useSocketContext } from "@/context/SocketProvider";
import { useSocketStore } from "@/context/socketStore";

export default function SessionActions() {
  const { saveSessionManually } = useSocketDispatch();
  const { endSession } = useSocketContext();
  const params = useParams();
  const sessionId = params?.id;
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const showEndModal = useSocketStore((s) => s.showEndModal);
  const setShowEndModal = useSocketStore((s) => s.setShowEndModal);

  const handleEndConfirmed = async () => {
    try {
      await saveSessionManually();
    } catch (err) {
      console.error("Failed to save before ending session:", err);
    }

    endSession(summary || undefined, notes || undefined);
    setShowEndModal(false);
  };

  return (
    <>
      {/* Session Controls */}
      <Card
        variant="outlined"
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          justifyContent: "center",
          alignItems: "center",
          p: 2.5,
          borderRadius: "xl",
          boxShadow: "sm",
          background: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Tooltip title="The system also auto-saves every 5 minutes.">
          <Button
            startDecorator={<SaveRounded />}
            variant="outlined"
            color="success"
            onClick={saveSessionManually}
          >
            Save Session
          </Button>
        </Tooltip>

        <Tooltip title="Open a preview of the session PDF.">
          <Button
            startDecorator={<PictureAsPdfRounded />}
            variant="outlined"
            color="neutral"
            onClick={() => {
              saveSessionManually();
              window.open(`/pdf/${sessionId}`, "_blank", "noopener,noreferrer");
            }}
          >
            View PDF
          </Button>
        </Tooltip>

        <Tooltip title="End the session and add your final notes.">
          <Button
            startDecorator={<StopCircleRounded />}
            variant="solid"
            color="danger"
            onClick={() => setShowEndModal(true)}
          >
            End Session
          </Button>
        </Tooltip>
      </Card>

      {/* Modern Modal */}
      <Modal
        open={showEndModal}
        onClose={() => setShowEndModal(false)}
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backdropFilter: "blur(8px)",
        }}
      >
        <ModalDialog
          layout="center"
          variant="outlined"
          sx={{
            maxWidth: 650,
            width: "100%",
            borderRadius: "xl",
            boxShadow: "lg",
            p: { xs: 2, sm: 3 },
            background:
              "linear-gradient(145deg, rgba(255,255,255,0.95), rgba(245,246,250,0.95))",
          }}
        >
          <ModalClose variant="plain" sx={{ m: 1 }} />
          <DialogTitle sx={{ fontWeight: 700, fontSize: "1.3rem" }}>
            End Session
          </DialogTitle>
          <DialogContent sx={{ mt: 0.5 }}>
            <Typography level="body-sm" sx={{ mb: 2, opacity: 0.8 }}>
              Please provide a brief session summary and any notes you would like to
              save with this session record.
            </Typography>

            <Stack spacing={2}>
              <div>
                <Typography level="body-sm" fontWeight={600}>
                  Session Summary
                </Typography>
                <Textarea
                  minRows={2}
                  variant="soft"
                  placeholder="Brief summary of the session (optional)"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>

              <div>
                <Typography level="body-sm" fontWeight={600}>
                  Post-session Notes
                </Typography>
                <Textarea
                  minRows={4}
                  variant="soft"
                  placeholder="Detailed notes, observations, or recommendations"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setShowEndModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="solid"
              color="danger"
              onClick={handleEndConfirmed}
            >
              End Session & Save
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </>
  );
}
