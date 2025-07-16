import { Box, Container } from "@mui/joy";

import SessionHeader from "./SessionHeader";
import SessionCard from "./SessionCard";
import SessionForm from "./SessionForm";

export default function Session() {
  return (
    <Box sx={{ padding: 2 }}>
      <SessionHeader />
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
        <SessionCard />
        <SessionForm />
      </Container>
    </Box>
  );
}
