/**
 * Kids Theme Preview Component
 * 
 * Example component demonstrating how to use the kids mode themes
 * This can be used as a theme selector or preview in the application
 */

'use client';

import React from 'react';
import { Box, Button, Card, Stack, Typography, Chip } from '@mui/joy';
import { useKidsTheme } from './useKidsTheme';
import { kidsThemesList, KidsThemeId } from './index';

interface KidsThemePreviewProps {
  onThemeSelect?: (themeId: KidsThemeId) => void;
  showDemo?: boolean;
}

export default function KidsThemePreview({ 
  onThemeSelect,
  showDemo = true 
}: KidsThemePreviewProps) {
  const {
    theme,
    currentThemeId,
    switchTheme,
    getAnimation,
    getCharacter,
    getFeedback,
    getRandomDecoration,
  } = useKidsTheme();

  const handleThemeChange = (themeId: KidsThemeId) => {
    switchTheme(themeId);
    if (onThemeSelect) {
      onThemeSelect(themeId);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      {/* Theme Selector */}
      <Stack spacing={3}>
        <Typography level="h2" sx={{ textAlign: 'center', mb: 2 }}>
          Choose Your Adventure Theme!
        </Typography>

        <Stack 
          direction={{ xs: 'column', md: 'row' }} 
          spacing={2}
          sx={{ justifyContent: 'center', flexWrap: 'wrap' }}
        >
          {kidsThemesList.map((t) => (
            <Card
              key={t.id}
              variant={currentThemeId === t.id ? 'solid' : 'outlined'}
              color={currentThemeId === t.id ? 'primary' : 'neutral'}
              sx={{
                flex: { xs: '1 1 100%', md: '1 1 30%' },
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-8px)',
                  boxShadow: 'lg',
                },
                background: currentThemeId === t.id 
                  ? `linear-gradient(135deg, ${t.colors.primary} 0%, ${t.colors.secondary} 100%)`
                  : 'white',
              }}
              onClick={() => handleThemeChange(t.id as KidsThemeId)}
            >
              <Stack spacing={2} alignItems="center">
                <Typography 
                  level="h1" 
                  sx={{ fontSize: '3rem' }}
                >
                  {t.characters.mascot}
                </Typography>
                <Typography 
                  level="h4"
                  sx={{ 
                    color: currentThemeId === t.id ? 'white' : t.colors.primary,
                    fontFamily: t.fonts.headings,
                  }}
                >
                  {t.name}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
                  {t.characters.decorative.slice(0, 4).map((emoji, i) => (
                    <Typography key={i} sx={{ fontSize: '1.5rem' }}>
                      {emoji}
                    </Typography>
                  ))}
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>

        {/* Demo Section */}
        {showDemo && (
          <Box 
            sx={{ 
              mt: 4,
              p: 4,
              borderRadius: '24px',
              background: theme.colors.background,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Typography 
              level="h3" 
              sx={{ 
                mb: 3, 
                textAlign: 'center',
                color: theme.colors.primary,
                fontFamily: theme.fonts.headings,
              }}
            >
              {getCharacter('mascot')} {theme.name} Demo
            </Typography>

            <Stack spacing={3}>
              {/* Animated Elements */}
              <Card
                sx={{
                  ...theme.components.card,
                  ...getAnimation('bounce'),
                }}
              >
                <Typography 
                  level="title-lg"
                  sx={{ 
                    color: theme.colors.text.primary,
                    fontFamily: theme.fonts.primary,
                  }}
                >
                  {getCharacter('encouragement')} Bouncing Animation!
                </Typography>
              </Card>

              {/* Button Examples */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  size="lg"
                  sx={{
                    ...theme.components.button,
                    flex: 1,
                  }}
                >
                  {getCharacter('success')} Primary Button
                </Button>
                <Button
                  size="lg"
                  variant="outlined"
                  sx={{
                    flex: 1,
                    borderRadius: theme.components.button.borderRadius,
                    borderWidth: '3px',
                    fontFamily: theme.fonts.primary,
                  }}
                >
                  Secondary Button
                </Button>
              </Stack>

              {/* Feedback Examples */}
              <Stack spacing={2}>
                <Box
                  sx={{
                    ...getFeedback('correct'),
                    p: 2,
                    borderRadius: '16px',
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>
                    {getFeedback('correct').icon} {getFeedback('correct').message}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    ...getFeedback('incorrect'),
                    p: 2,
                    borderRadius: '16px',
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>
                    {getFeedback('incorrect').icon} {getFeedback('incorrect').message}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    ...getFeedback('encouragement'),
                    p: 2,
                    borderRadius: '16px',
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontWeight: 600 }}>
                    {getFeedback('encouragement').icon} {getFeedback('encouragement').messages[0]}
                  </Typography>
                </Box>
              </Stack>

              {/* Decorative Elements */}
              <Stack 
                direction="row" 
                spacing={2} 
                justifyContent="center"
                flexWrap="wrap"
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  <Typography 
                    key={i}
                    sx={{ 
                      fontSize: '2rem',
                      ...getAnimation(i % 2 === 0 ? 'bounce' : 'float'),
                      animationDelay: `${i * 0.2}s`,
                    }}
                  >
                    {getRandomDecoration()}
                  </Typography>
                ))}
              </Stack>
            </Stack>
          </Box>
        )}

        {/* Theme Info */}
        <Card variant="outlined" sx={{ mt: 2 }}>
          <Typography level="title-md" sx={{ mb: 1 }}>
            Current Theme: {theme.name}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1 }}>
            <Chip color="primary" variant="soft">
              Primary: {theme.colors.primary}
            </Chip>
            <Chip color="success" variant="soft">
              Secondary: {theme.colors.secondary}
            </Chip>
            <Chip color="warning" variant="soft">
              Accent: {theme.colors.accent}
            </Chip>
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}

// Example usage in a page:
/*
import KidsThemePreview from '@/styles/kids-themes/KidsThemePreview';

export default function ThemeSettingsPage() {
  const handleThemeSelect = (themeId) => {
    console.log('Theme selected:', themeId);
    // Save to user preferences, context, etc.
  };

  return (
    <KidsThemePreview 
      onThemeSelect={handleThemeSelect}
      showDemo={true}
    />
  );
}
*/
