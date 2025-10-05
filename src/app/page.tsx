"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {
  Box,
  Container,
  AspectRatio,
  Typography,
  Button,
  Card,
} from "@mui/joy";
import {ArrowForward} from "@mui/icons-material";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loggedIn = localStorage.getItem("clinicianLoggedIn");
    if (loggedIn) {
  router.replace("/clinician-dashboard");
    }
  }, [router]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(120deg, #e0e7ff 0%, #f5f7fa 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeInBg 1.5s ease-in",
        "@keyframes fadeInBg": {
          from: {opacity: 0},
          to: {opacity: 1},
        },
      }}
    >
      <Container
        sx={{
          display: "flex",
          flexDirection: {xs: "column", md: "row"},
          alignItems: "center",
          justifyContent: "center",
          gap: {xs: 4, md: 8},
          minHeight: "100vh",
          px: {xs: 2, md: 6},
        }}
      >
        {/* Glassmorphic card with animated hero text */}
        <Card
          variant="soft"
          sx={{
            p: {xs: 3, md: 6},
            maxWidth: 480,
            mx: "auto",
            boxShadow: "lg",
            borderRadius: "xl",
            backdropFilter: "blur(12px)",
            background: "rgba(255,255,255,0.85)",
            animation: "slideUp 1.2s cubic-bezier(.42,0,.58,1)",
            "@keyframes slideUp": {
              from: {opacity: 0, transform: "translateY(40px)"},
              to: {opacity: 1, transform: "translateY(0)"},
            },
            flex: 1,
            minWidth: {xs: "100%", md: 340},
          }}
        >
          <Typography
            color="primary"
            sx={{
              fontSize: "lg",
              fontWeight: "lg",
              letterSpacing: 2,
              mb: 1,
              animation: "fadeInText 1.2s 0.2s both",
            }}
          >
            Empowering Voices
          </Typography>
          <Typography
            level="h1"
            sx={{
              fontWeight: "xl",
              fontSize: "clamp(2.2rem, 2vw + 2rem, 3.2rem)",
              mb: 2,
              animation: "fadeInText 1.2s 0.4s both",
              "@keyframes fadeInText": {
                from: {opacity: 0, transform: "translateY(20px)"},
                to: {opacity: 1, transform: "translateY(0)"},
              },
            }}
          >
            A digital speech assessment tool for Filipinos
          </Typography>
          <Typography
            sx={{
              fontSize: "lg",
              color: "text.secondary",
              mb: 3,
              animation: "fadeInText 1.2s 0.6s both",
            }}
          >
            Fil-PAT is a digital speech assessment tool that utilizes picture
            assessment test. This is developed for the UST-CRS.
          </Typography>
          <Link href="/login" style={{textDecoration: "none"}}>
            <Button
              color="primary"
              size="lg"
              endDecorator={<ArrowForward fontSize="large" />}
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: "lg",
                fontSize: "xl",
                borderRadius: "lg",
                boxShadow: "md",
                animation: "fadeInText 1.2s 0.8s both",
                transition: "box-shadow 0.2s",
                "&:hover": {boxShadow: "xl"},
              }}
            >
              Start Assessment
            </Button>
          </Link>
        </Card>
        {/* Large logo on the right, responsive */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minWidth: {xs: "100%", md: 340},
            py: {xs: 4, md: 0},
          }}
        >
          <Image
            src="/crs-logo.png"
            alt="Fil-PAT Logo"
            width={340}
            height={340}
            style={{objectFit: "contain", maxWidth: "100%", height: "auto"}}
            priority
          />
        </Box>
      </Container>
      {/* Subtle animated background shapes */}
      <Box
        sx={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #6366f1 0%, #a5b4fc 100%)",
          opacity: 0.18,
          filter: "blur(24px)",
          animation: "floatShape 6s ease-in-out infinite alternate",
          "@keyframes floatShape": {
            from: {transform: "translateY(0)"},
            to: {transform: "translateY(32px)"},
          },
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f472b6 0%, #fbc2eb 100%)",
          opacity: 0.14,
          filter: "blur(18px)",
          animation: "floatShape 7s 1s ease-in-out infinite alternate",
        }}
      />
    </Box>
  );
}
