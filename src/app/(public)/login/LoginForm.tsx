"use client";

import {useState} from "react";
import useLogin from "./useLogin";

import {
  Alert,
  Box,
  Button,
  Card,
  FormControl,
  FormLabel,
  Input,
  Typography,
  CircularProgress,
} from "@mui/joy";
import Image from "next/image";

export default function LoginForm() {
  const {login, isLoading, error} = useLogin();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!username || !password || isLoading) return;
    await login({username, password});
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <Card
      variant="outlined"
      size="md"
      sx={{
        boxShadow: "md",
        width: 320,
        mx: "auto",
        p: 4,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <Image
          src="/crs-logo.png"
          alt="App Logo"
          width={25}
          height={25}
          loading="lazy"
        />
        <Typography level="title-md" fontWeight="lg">
          Fil-Pat
        </Typography>
      </Box>

      <Typography
        component="h1"
        level="h3"
        sx={{fontSize: "clamp(2rem, 5vw, 2.15rem)"}}
      >
        Sign In
      </Typography>

      {error && (
        <Alert variant="soft" color="danger">
          {error}
        </Alert>
      )}

      <FormControl required>
        <FormLabel>Username</FormLabel>
        <Input
          placeholder="Enter username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </FormControl>

      <FormControl required>
        <FormLabel>Password</FormLabel>
        <Input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </FormControl>

      <Button
        onClick={handleLogin}
        disabled={!username || !password || isLoading}
        fullWidth
        variant="solid"
      >
        {isLoading ? <CircularProgress size="sm" /> : "Login"}
      </Button>
    </Card>
  );
}
