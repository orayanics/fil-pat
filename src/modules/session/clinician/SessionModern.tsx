"use client";

import {Box, Button, Tabs, TabList, Tab, TabPanel, Stack} from "@mui/joy";
import Link from "next/link";
import { ArrowBack } from "@mui/icons-material";

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
        maxWidth: "1400px",
        margin: "0 auto",
        width: "100%"
      }}
    >
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
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
      </Stack>

      {/* Session Status Alert */}
      <SessionStatus />
      
      {/* Patient Link Card */}
      <PatientLinkCard />

      {/* Tabbed Interface for Better Organization */}
      <Tabs defaultValue={0} sx={{ bgcolor: "transparent" }}>
        <TabList 
          sx={{ 
            borderRadius: "lg",
            bgcolor: "background.surface",
            p: 0.5,
            gap: 1,
            flexWrap: "wrap"
          }}
        >
          <Tab 
            value={0}
            sx={{ 
              flex: { xs: "1 1 auto", sm: "0 1 auto" },
              fontWeight: 600,
              fontSize: { xs: "sm", sm: "md" }
            }}
          >
            📋 Assessment Items
          </Tab>
          <Tab 
            value={1}
            sx={{ 
              flex: { xs: "1 1 auto", sm: "0 1 auto" },
              fontWeight: 600,
              fontSize: { xs: "sm", sm: "md" }
            }}
          >
            {isKidsMode ? "🎵 Child's Sounds" : "✍️ Response Form"}
          </Tab>
          <Tab 
            value={2}
            sx={{ 
              flex: { xs: "1 1 auto", sm: "0 1 auto" },
              fontWeight: 600,
              fontSize: { xs: "sm", sm: "md" }
            }}
          >
            ⚙️ Session Controls
          </Tab>
        </TabList>

        {/* Tab 1: Assessment Items (Image and Question) */}
        <TabPanel value={0} sx={{ p: { xs: 2, md: 3 } }}>
          <SessionCard isKidsMode={isKidsMode} />
        </TabPanel>

        {/* Tab 2: Response Form */}
        <TabPanel value={1} sx={{ p: { xs: 2, md: 3 } }}>
          <SessionForm isKidsMode={isKidsMode} />
        </TabPanel>

        {/* Tab 3: Session Controls */}
        <TabPanel value={2} sx={{ p: { xs: 2, md: 3 } }}>
          <SessionActions />
        </TabPanel>
      </Tabs>

      {/* Mobile-friendly: Show both side by side on larger screens */}
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          gap: 3,
          mt: 2
        }}
      >
        <Box sx={{ flex: "0 0 45%" }}>
          <SessionCard isKidsMode={isKidsMode} />
        </Box>
        <Box sx={{ flex: "0 0 55%" }}>
          <SessionForm isKidsMode={isKidsMode} />
        </Box>
      </Box>
    </Box>
  );
}
