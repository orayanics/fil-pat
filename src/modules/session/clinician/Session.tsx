"use client";

import {Box, Button, Stack, Typography, Modal, ModalDialog, ModalClose} from "@mui/joy";
import Link from "next/link";
import { ArrowBack, ChildCare, Warning } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import SessionCard from "./SessionCard";
import SessionForm from "./SessionForm";
import SessionActions from "./SessionActions";
import SessionStatus from "./SessionStatus";
// import PatientLinkCard from "./PatientLinkCard"; // Unused component
import { useSocketStore } from "@/context/socketStore";

export default function Session() {
  const router = useRouter();
  const sessionInfo = useSocketStore((s) => s.sessionInfo);
  const sessionStarted = useSocketStore((s) => s.sessionStarted);
  const isKidsMode = sessionInfo?.is_for_kids ?? false;
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Cleanup session state when component unmounts
  useEffect(() => {
    return () => {
      console.log('[Session] Component unmounting - resetting session state');
      // Reset all session state when leaving session page
      useSocketStore.getState().resetSessionState();
    };
  }, []);

  const handleBackClick = (e: React.MouseEvent) => {
    // If session is in progress, show confirmation
    if (sessionStarted || sessionInfo?.status === 'In Progress') {
      e.preventDefault();
      setShowExitConfirm(true);
    }
    // Otherwise, allow normal navigation
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    router.push('/clinician-dashboard');
  };

  return (
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 2.5, 
        padding: { xs: 2, md: 3 },
        maxWidth: "100%",
        margin: "0 auto",
        width: "100%",
        minHeight: "100vh"
      }}
    >
      {/* Header - Compact & Modern */}
      <Stack 
        direction="row" 
        justifyContent="space-between" 
        alignItems="center" 
        flexWrap="wrap" 
        gap={2}
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          bgcolor: "background.body",
          py: 1,
          borderBottom: 1,
          borderColor: "divider"
        }}
      >
        {(sessionStarted || sessionInfo?.status === 'In Progress') ? (
          <Button 
            onClick={handleBackClick}
            size="sm" 
            variant="outlined"
            startDecorator={<ArrowBack />}
          >
            Dashboard
          </Button>
        ) : (
          <Button 
            component={Link}
            href="/clinician-dashboard"
            size="sm" 
            variant="outlined"
            startDecorator={<ArrowBack />}
          >
            Dashboard
          </Button>
        )}
        
        {isKidsMode && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <ChildCare color="primary" fontSize="small" />
            <Typography level="body-sm" color="primary" fontWeight={600}>
              Kids Mode
            </Typography>
          </Stack>
        )}
      </Stack>

      {/* Session Status Alert */}
      <SessionStatus />

      {/* Session Controls - Full Width Redesign */}
      <SessionActions />

      {/* Assessment Interface - Full Width Modern Layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "minmax(400px, 45%) 1fr" },
          gap: 3,
          flex: 1
        }}
      >
        {/* Left: Assessment Item Card */}
        <Box>
          <SessionCard isKidsMode={isKidsMode} />
        </Box>
        
        {/* Right: Response Form */}
        <Box>
          <SessionForm isKidsMode={isKidsMode} />
        </Box>
      </Box>

      {/* Exit Confirmation Modal */}
      <Modal open={showExitConfirm} onClose={() => setShowExitConfirm(false)}>
        <ModalDialog
          variant="outlined"
          role="alertdialog"
          sx={{ maxWidth: 500 }}
        >
          <ModalClose />
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Warning color="warning" />
              <Typography level="title-lg">Leave Active Session?</Typography>
            </Stack>
            <Typography level="body-md">
              This session is currently in progress. Leaving now will pause the session, but you can resume it anytime from the dashboard.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="plain"
                color="neutral"
                onClick={() => setShowExitConfirm(false)}
              >
                Stay in Session
              </Button>
              <Button
                variant="solid"
                color="warning"
                onClick={handleConfirmExit}
              >
                Leave Session
              </Button>
            </Stack>
          </Stack>
        </ModalDialog>
      </Modal>
    </Box>
  );
}
