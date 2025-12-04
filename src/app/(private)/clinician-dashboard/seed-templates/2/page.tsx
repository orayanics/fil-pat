"use client";

import { useState } from 'react';
import { Box, Button, Card, Typography, Alert, CircularProgress, Stack } from '@mui/joy';
import { Add, CheckCircle, Error } from '@mui/icons-material';

export default function SeedComprehensiveTemplatesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; templates?: { standard: { id: number; name: string; items: number }; kids: { id: number; name: string; items: number } }; error?: string } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/clinician/templates/seed-comprehensive', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Seed error:', err);
      setResult({ error: 'Failed to seed comprehensive templates' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, margin: '0 auto' }}>
      <Card sx={{ p: 4 }}>
        <Typography level="h2" sx={{ mb: 2 }}>
          Seed Comprehensive Assessment Templates
        </Typography>
        
        <Typography level="body-md" sx={{ mb: 3 }}>
          This will create two comprehensive Filipino Phonological Assessment templates with 77 items each:
        </Typography>

        <Stack spacing={2} sx={{ mb: 3, pl: 2 }}>
          <Box>
            <Typography level="title-md" sx={{ mb: 0.5 }}>
              Complete Filipino Phonological Assessment (77 Items)
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Comprehensive assessment covering all Filipino phonemes: 21 consonants, 5 vowels, and 5 diphthongs. 
              Standardized for clinical use with complete phonological coverage across all consonant groups (m, b, p, n, d, w, j, h, t, ŋ, k, g, ʔ, l, s, r, ʃ, ʧ, dʒ, f, v, z) and diphthongs.
            </Typography>
          </Box>

          <Box>
            <Typography level="title-md" sx={{ mb: 0.5 }}>
              Filipino Phonological Assessment - Kids Mode (77 Items)
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Complete phonological assessment with child-friendly interface and engaging visual themes. 
              Same comprehensive coverage as standard template but optimized for pediatric assessment.
            </Typography>
          </Box>
        </Stack>

        <Alert sx={{ mb: 3 }} color="warning">
          <Typography level="body-sm">
            ⚠️ This will create 154 items in total (77 items × 2 templates). 
            The comprehensive templates provide complete phonological assessment coverage and replace the need for basic 20-item templates.
          </Typography>
        </Alert>

        <Button
          size="lg"
          startDecorator={loading ? <CircularProgress size="sm" /> : <Add />}
          onClick={handleSeed}
          disabled={loading}
          fullWidth
        >
          {loading ? 'Creating Comprehensive Templates...' : 'Create Comprehensive Templates (77 Items Each)'}
        </Button>

        {result && (
          <Alert
            sx={{ mt: 3 }}
            color={result.success ? 'success' : 'danger'}
            startDecorator={result.success ? <CheckCircle /> : <Error />}
          >
            {result.success ? (
              <Box>
                <Typography level="title-sm">{result.message}</Typography>
                {result.templates && (
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <Typography level="body-sm">
                      ✅ Standard Template: ID {result.templates.standard.id} ({result.templates.standard.items} items)
                    </Typography>
                    <Typography level="body-sm">
                      ✅ Kids Template: ID {result.templates.kids.id} ({result.templates.kids.items} items)
                    </Typography>
                    <Typography level="body-sm" sx={{ mt: 1, fontWeight: 'bold' }}>
                      Total Items Created: 154
                    </Typography>
                  </Stack>
                )}
              </Box>
            ) : (
              result.error || result.message
            )}
          </Alert>
        )}
      </Card>
    </Box>
  );
}
