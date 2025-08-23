"use client";
import {useState} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  Container,
  FormControl,
  FormLabel,
  Input,
  Typography,
} from "@mui/joy";
import Image from "next/image";

import useLogin from "./useLogin";

export default function Login() {
  const {login, isLoading, error} = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    await login({username, password});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

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
        <Card
          variant="outlined"
          size="md"
          sx={{
            boxShadow: "md",
            minWidth: 320,
            width: 320,
            mx: "auto",
            p: 4,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Image
              src="/crs-logo.png"
              alt="Hero Image"
              width={25}
              height={25}
              loading="lazy"
            />
            <Typography sx={{fontWeight: "bold"}}>Fil-Pat</Typography>
          </Box>

          <Typography
            component="h1"
            level="h4"
            sx={{width: "100%", fontSize: "clamp(2rem, 10vw, 2.15rem)"}}
          >
            Sign in
          </Typography>

          {error && (
            <Alert variant="soft" color="danger">
              {error}
            </Alert>
          )}
          <FormControl>
            <FormLabel>Username</FormLabel>
            <Input
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </FormControl>

          <FormControl>
            <FormLabel>Password</FormLabel>
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </FormControl>

          <Button onClick={handleLogin} disabled={isLoading}>
            Login
          </Button>
        </Card>
      </Container>
    </Box>
  );
}
