"use client";
import {useEffect} from "react";
import {useRouter} from "next/navigation";

import {
  Box,
  Container,
  AspectRatio,
  Typography,
  Button,
  typographyClasses,
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
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <Box
      sx={{
        height: "100vh",
        overflowY: "scroll",
        scrollSnapType: "y mandatory",
        "& > div": {
          scrollSnapAlign: "start",
        },
        backgroundColor: "background.paper",
      }}
    >
      <Container
        sx={[
          (theme) => ({
            position: "relative",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            py: 10,
            gap: 4,
            [theme.breakpoints.up(834)]: {
              flexDirection: "row",
              gap: 6,
            },
            [theme.breakpoints.up(1199)]: {
              gap: 12,
            },
            flexDirection: "column",
          }),
        ]}
      >
        <Box
          sx={(theme) => ({
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1rem",
            maxWidth: "50ch",
            textAlign: "center",
            flexShrink: 999,
            [theme.breakpoints.up(834)]: {
              minWidth: 420,
              alignItems: "flex-start",
              textAlign: "initial",
            },
            [`& .${typographyClasses.root}`]: {
              textWrap: "balance",
            },
          })}
        >
          <Typography color="primary" sx={{fontSize: "lg", fontWeight: "lg"}}>
            Empowering Voices
          </Typography>
          <Typography
            level="h1"
            sx={{
              fontWeight: "xl",
              fontSize: "clamp(1.875rem, 1.3636rem + 2.1818vw, 3rem)",
            }}
          >
            A digital speech assessment tool for Filipinos
          </Typography>
          <Typography
            textColor="text.secondary"
            sx={{fontSize: "lg", lineHeight: "lg"}}
          >
            Fil-PAT is a digital speech assessment tool that utilizes picture
            assessment test. This is developed for the UST-CRS.
          </Typography>
          <Link
            href="/login"
            style={{textDecoration: "none", color: "inherit"}}
          >
            <Button
              color="primary"
              size="lg"
              endDecorator={<ArrowForward fontSize="large" />}
            >
              Start Assessment
            </Button>
          </Link>

          <Typography
            level="body-xs"
            sx={{
              position: "absolute",
              top: "2rem",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            Fil-PAT
          </Typography>
        </Box>
        <AspectRatio
          ratio={600 / 520}
          variant="plain"
          maxHeight={300}
          sx={(theme) => ({
            minWidth: 300,
            alignSelf: "stretch",
            [theme.breakpoints.up(834)]: {
              alignSelf: "initial",
              flexGrow: 1,
              "--AspectRatio-maxHeight": "520px",
              "--AspectRatio-minHeight": "400px",
            },
            // borderRadius: "sm",
            // bgcolor: "background.level2",
            flexBasis: "50%",
          })}
        >
          <Image
            src="/crs-logo.png"
            alt="Hero Image"
            fill
            style={{objectFit: "contain"}}
          />
        </AspectRatio>
      </Container>
    </Box>
  );
}
