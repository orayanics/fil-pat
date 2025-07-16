"use client";
import { ReactNode } from "react";
import { CssBaseline, CssVarsProvider } from "@mui/joy";
import Box from "@mui/joy/Box";

import {
  Breadcrumbs,
  PrivateHeader,
  PrivateSidebar,
} from "@/components/Layout";
import { PageStatus } from "@/components/Page";

import { useSocketContext } from "@/context/SocketProvider";
import { AlertFail } from "@/components/Alert";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  const { isConnected } = useSocketContext();
  return (
    <CssVarsProvider disableTransitionOnChange>
      {!isConnected && <AlertFail isConnected={isConnected} />}
      <CssBaseline />
      <Box sx={{ display: "flex", minHeight: "100dvh" }}>
        <PrivateHeader />
        <PrivateSidebar />

        <Box
          component="main"
          className="MainContent"
          sx={{
            px: { xs: 2, md: 6 },
            pt: {
              xs: "calc(12px + var(--Header-height))",
              sm: "calc(12px + var(--Header-height))",
              md: 3,
            },
            pb: { xs: 2, sm: 2, md: 3 },
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            height: "100dvh",
            gap: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Breadcrumbs />
            <PageStatus />
          </Box>

          {children}
        </Box>
      </Box>
    </CssVarsProvider>
  );
}
