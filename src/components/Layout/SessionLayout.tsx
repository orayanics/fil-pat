"use client";

import {Box} from "@mui/joy";
import SocketProvider from "@/context/SocketProvider";
import {PageHeader} from "@/components/Page";

export default function SessionLayout({children}: {children: React.ReactNode}) {
  return (
    <SocketProvider>
      <Box
        sx={[
          (theme) => ({
            display: "flex",
            alignItems: "start",
            gap: 4,
            [theme.breakpoints.up(834)]: {
              flexDirection: "column",
              gap: 6,
            },
            [theme.breakpoints.up(1199)]: {
              gap: 2,
            },
            flexDirection: "column",
          }),
        ]}
      >
        <PageHeader />
        {children}
      </Box>
    </SocketProvider>
  );
}
