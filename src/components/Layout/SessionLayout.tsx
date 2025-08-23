import {ReactNode} from "react";

import {Box, Container} from "@mui/joy";
import {PageHeader} from "@/components/Page";

export default function SessionLayout({children}: {children: ReactNode}) {
  return (
    <>
      <Box>
        <PageHeader isLink={false} />
        <Container
          sx={[
            (theme) => ({
              display: "flex",
              alignItems: "start",
              gap: 4,
              [theme.breakpoints.up(834)]: {
                flexDirection: "row",
                gap: 6,
              },
              [theme.breakpoints.up(1199)]: {
                gap: 2,
              },
              flexDirection: "column",
              padding: 2,
            }),
          ]}
        >
          {children}
        </Container>
      </Box>
    </>
  );
}
