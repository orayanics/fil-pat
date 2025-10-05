import {Box} from "@mui/joy";

import SessionCard from "./SessionCard";
import SessionForm from "./SessionForm";
import SessionActions from "./SessionActions";
import SessionStatus from "./SessionStatus";

export default function Session() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: 2,
      }}
    >
      <SessionStatus />

      <Box width={"100%"}>
        <SessionActions />
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: {xs: "wrap", md: "nowrap"},
        }}
      >
        <SessionCard />
        <SessionForm />
      </Box>
    </Box>
  );
}
