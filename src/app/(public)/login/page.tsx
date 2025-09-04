import {Box, Container} from "@mui/joy";

import LoginForm from "./LoginForm";

export default function Login() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        bgcolor: "background.paper",
      }}
    >
      <Container sx={{width: "100vw"}}>
        <LoginForm />
      </Container>
    </Box>
  );
}
