"use client";
import {ReactNode} from "react";
import Box from "@mui/joy/Box";

import {Breadcrumbs, PrivateHeader, PrivateSidebar} from "@/components/Layout";
import {PageStatus} from "@/components/Page";

import {useSocketContext} from "@/context/SocketProvider";
import {AlertFail} from "@/components/Alert";

export default function PrivateLayout({children}: {children: ReactNode}) {
  const {isConnected} = useSocketContext();

  return (
    <>
      {!isConnected && <AlertFail isConnected={!isConnected} />}

      <Box
        sx={{
          display: "flex",
          flexDirection: {xs: "column", md: "row"},
          width: "100vw",
          minHeight: "100dvh",
          justifyContent: "start",
        }}
      >
        <PrivateHeader />
        <PrivateSidebar />

        <Box
          component="main"
          className="MainContent"
          sx={{
            px: {xs: 2, md: 6},
            pb: {xs: 2, sm: 2, md: 3},
            flex: 1,
            display: "flex",
            flexDirection: "column",
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
    </>
  );
}
