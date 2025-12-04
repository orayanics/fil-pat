"use client";
import { Card, Typography, Stack, Button, Box } from "@mui/joy";
import { Palette } from "@mui/icons-material";
import { useSocketContext } from "@/context/SocketProvider";
import { useSocketStore } from "@/context/socketStore";
import { useEffect } from "react";

export default function ThemeSelector() {
  const sessionInfo = useSocketStore((s) => s.sessionInfo);
  const sessionId = useSocketStore((s) => s.sessionId);
  const kidsTheme = useSocketStore((s) => s.kidsTheme);
  const setKidsTheme = useSocketStore((s) => s.setKidsTheme);
  const { socket } = useSocketContext();
  const isKidsMode = sessionInfo?.is_for_kids ?? false;

  // Set default theme to jungle on mount if no theme is selected
  useEffect(() => {
    if (isKidsMode && !kidsTheme) {
      setKidsTheme('jungle');
      // Broadcast default theme to patients
      if (socket && sessionId) {
        socket.send(JSON.stringify({
          type: 'changeKidsTheme',
          sessionId,
          theme: 'jungle'
        }));
      }
    }
  }, [isKidsMode, kidsTheme, setKidsTheme, socket, sessionId]);

  if (!isKidsMode) return null;

  const handleThemeChange = (theme: 'jungle' | 'ocean' | 'space') => {
    if (!socket || !sessionId) return;
    
    console.log('[ThemeSelector] Changing theme to:', theme);
    
    // Update local state
    setKidsTheme(theme);
    
    // Broadcast to patients
    socket.send(JSON.stringify({
      type: 'changeKidsTheme',
      sessionId,
      theme
    }));
  };

  const themes = [
    {
      id: 'jungle' as const,
      name: 'Jungle Adventure',
      emoji: '🌴',
      colors: ['#6BCB77', '#FFD93D', '#FF6B6B'],
      description: 'Tropical jungle theme with vibrant greens and yellows'
    },
    {
      id: 'ocean' as const,
      name: 'Ocean Friends',
      emoji: '🌊',
      colors: ['#4ECDC4', '#A8E6CF', '#FFD93D'],
      description: 'Calming ocean theme with blues and aqua'
    },
    {
      id: 'space' as const,
      name: 'Space Explorer',
      emoji: '🚀',
      colors: ['#A8E6CF', '#FFD93D', '#FF6B6B'],
      description: 'Cosmic space theme with stars and planets'
    }
  ];

  return (
    <Card
      variant="soft"
      sx={{
        p: 2.5,
        borderRadius: "lg",
        boxShadow: "sm",
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Palette sx={{ fontSize: 24, color: 'primary.500' }} />
          <Typography level="title-md" sx={{ fontWeight: 700 }}>
            Patient Theme
          </Typography>
        </Stack>
        
        <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
          Choose a theme for the patient's session view
        </Typography>
        
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          {themes.map((theme) => (
            <Button
              key={theme.id}
              variant={kidsTheme === theme.id ? "solid" : "outlined"}
              color={kidsTheme === theme.id ? "primary" : "neutral"}
              onClick={() => handleThemeChange(theme.id)}
              sx={{
                flex: 1,
                flexDirection: 'column',
                gap: 1,
                py: 2,
                px: 2,
                minHeight: 100,
                position: 'relative',
                overflow: 'hidden',
                '&::before': kidsTheme === theme.id ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(135deg, ${theme.colors.join(', ')})`,
                  opacity: 0.1,
                  zIndex: 0,
                } : {},
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography sx={{ fontSize: '2rem', mb: 0.5 }}>
                  {theme.emoji}
                </Typography>
                <Typography level="title-sm" sx={{ fontWeight: 600 }}>
                  {theme.name}
                </Typography>
              </Box>
              <Stack direction="row" spacing={0.5} sx={{ position: 'relative', zIndex: 1, mt: 0.5 }}>
                {theme.colors.map((color, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: color,
                      border: '2px solid',
                      borderColor: 'background.surface',
                    }}
                  />
                ))}
              </Stack>
            </Button>
          ))}
        </Stack>
      </Stack>
    </Card>
  );
}
