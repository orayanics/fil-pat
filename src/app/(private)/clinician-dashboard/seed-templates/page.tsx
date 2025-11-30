"use client";

import { useState } from 'react';
import { Box, Button, Card, Typography, Alert, CircularProgress, Stack } from '@mui/joy';
import { Add, CheckCircle, Error } from '@mui/icons-material';

export default function SeedTemplatesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string; templates?: { kids: { id: number; name: string; items: number }; general: { id: number; name: string; items: number } }; error?: string } | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/clinician/templates/seed', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Seed error:', err);
      setResult({ error: 'Failed to seed templates' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 800, margin: '0 auto' }}>
      <Card sx={{ p: 4 }}>
        <Typography level="h2" sx={{ mb: 2 }}>
          Seed Assessment Templates
        </Typography>
        
        <Typography level="body-md" sx={{ mb: 3 }}>
          This will create two Filipino Phonological Assessment templates with 20 items each:
        </Typography>

        <Stack spacing={2} sx={{ mb: 3, pl: 2 }}>
          <Box>
            <Typography level="title-md" sx={{ mb: 0.5 }}>
              Kids Edition Template (20 Items)
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Child-friendly vocabulary with playful images. Ideal for ages 3-7.
            </Typography>
          </Box>

          <Box>
            <Typography level="title-md" sx={{ mb: 0.5 }}>
              Standard Assessment Template (20 Items)
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Comprehensive assessment covering wide range of phonemes. General population.
            </Typography>
          </Box>
        </Stack>

        <Button
          size="lg"
          startDecorator={loading ? <CircularProgress size="sm" /> : <Add />}
          onClick={handleSeed}
          disabled={loading}
          fullWidth
        >
          {loading ? 'Creating Templates...' : 'Create Templates'}
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
                      ✅ Kids Template: ID {result.templates.kids.id} ({result.templates.kids.items} items)
                    </Typography>
                    <Typography level="body-sm">
                      ✅ General Template: ID {result.templates.general.id} ({result.templates.general.items} items)
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
