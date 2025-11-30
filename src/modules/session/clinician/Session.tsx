"use client";

import {Box, Button, Stack, Typography, Divider} from "@mui/joy";
import Link from "next/link";
import { ArrowBack, ChildCare } from "@mui/icons-material";

import SessionCard from "./SessionCard";
import SessionForm from "./SessionForm";
import SessionActions from "./SessionActions";
import SessionStatus from "./SessionStatus";
import PatientLinkCard from "./PatientLinkCard";
import { useSocketStore } from "@/context/socketStore";

export default function Session() {
  const sessionInfo = useSocketStore((s) => s.sessionInfo);
  const isKidsMode = sessionInfo?.is_for_kids ?? false;

  return (
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 3, 
        padding: { xs: 2, md: 3 },
        maxWidth: "1600px",
        margin: "0 auto",
        width: "100%"
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Button 
          component={Link} 
          href="/clinician-dashboard" 
          size="md" 
          variant="outlined"
          startDecorator={<ArrowBack />}
          sx={{ fontWeight: 600 }}
        >
          Back to Dashboard
        </Button>
        
        {isKidsMode && (
          <Stack direction="row" alignItems="center" spacing={1}>
            <ChildCare color="primary" />
            <Typography level="title-md" color="primary">
              Kids Mode Active
            </Typography>
          </Stack>
        )}
      </Stack>

      {/* Session Status Alert */}
      <SessionStatus />
      
      {/* Patient Link Card */}
      <PatientLinkCard />

      {/* Session Controls */}
      <Box>
        <Typography level="title-lg" sx={{ mb: 2 }}>
          Session Controls
        </Typography>
        <SessionActions />
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Assessment Interface - Responsive Layout */}
      <Typography level="title-lg" sx={{ mb: 2 }}>
        {isKidsMode ? "Child's Sound Assessment" : "Assessment Items"}
      </Typography>
      
      <Box
        sx={{
          display: "flex",
          gap: 3,
          flexDirection: { xs: "column", lg: "row" },
          alignItems: { xs: "stretch", lg: "flex-start" }
        }}
      >
        {/* Left: Assessment Item Card */}
        <Box sx={{ flex: { xs: "1", lg: "0 0 45%" } }}>
          <SessionCard isKidsMode={isKidsMode} />
        </Box>
        
        {/* Right: Response Form */}
        <Box sx={{ flex: { xs: "1", lg: "0 0 55%" } }}>
          <SessionForm isKidsMode={isKidsMode} />
        </Box>
      </Box>
    </Box>
  );
}
