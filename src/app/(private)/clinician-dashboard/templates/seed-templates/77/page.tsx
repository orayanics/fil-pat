"use client";

import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/joy';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PrivateSidebar from '@/components/Layout/PrivateSidebar';

export default function SeedTemplates77Page() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTemplates, setCreatedTemplates] = useState<Array<{id: number, name: string}>>([]);

  const handleSeed = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/templates/seed-77', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setCreatedTemplates(data.templates || []);
      } else {
        setError(data.error || 'Failed to seed templates');
      }
    } catch (err) {
      console.error('Seed error:', err);
      setError('Failed to seed templates. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.body' }}>
      <PrivateSidebar />

      <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, maxWidth: 900, mx: 'auto', width: '100%' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' },
            gap: 2,
            mb: 4,
          }}
        >
          <Typography level="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CloudUploadIcon /> Seed 77-Item Templates
          </Typography>
          <Link href="/clinician-dashboard/templates/seed-templates" passHref style={{ textDecoration: 'none' }}>
            <Button
              size="sm"
              variant="outlined"
              startDecorator={<ArrowBackIcon />}
              disabled={loading}
            >
              Back
            </Button>
          </Link>
        </Box>

        <Card variant="outlined" sx={{ mb: 3 }}>
          <CardContent>
            <Typography level="h4" sx={{ mb: 2 }}>
              Complete 77-Item Assessment Templates
            </Typography>

            <Typography level="body-md" sx={{ mb: 2, color: 'neutral.600' }}>
              This will create two comprehensive 77-item assessment templates for your account:
            </Typography>

            <Box component="ul" sx={{ pl: 3, mb: 3 }}>
              <li>
                <Typography level="body-md">
                  <strong>Complete Filipino Phonological Assessment (77 Items)</strong>
                  <br />
                  <Typography level="body-sm" sx={{ color: 'neutral.600' }}>
                    Comprehensive assessment covering all Filipino phonemes: 21 consonants, 5 vowels, and 5 diphthongs.
                  </Typography>
                </Typography>
              </li>
              <li style={{ marginTop: '12px' }}>
                <Typography level="body-md">
                  <strong>Filipino Phonological Assessment - Kids Mode (77 Items)</strong>
                  <br />
                  <Typography level="body-sm" sx={{ color: 'neutral.600' }}>
                    Same comprehensive assessment with child-friendly interface and engaging visual themes.
                  </Typography>
                </Typography>
              </li>
            </Box>

            {!success && !error && !loading && (
              <Alert color="primary" variant="soft" sx={{ mb: 2 }}>
                <Typography level="body-sm">
                  <strong>Note:</strong> If you already have these templates, they will be deleted and recreated with fresh data.
                </Typography>
              </Alert>
            )}

            {error && (
              <Alert
                startDecorator={<ErrorIcon />}
                variant="soft"
                color="danger"
                sx={{ mb: 2 }}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                startDecorator={<CheckCircleIcon />}
                variant="soft"
                color="success"
                sx={{ mb: 3 }}
              >
                <Box>
                  <Typography level="body-md" sx={{ fontWeight: 600, mb: 1 }}>
                    Templates seeded successfully!
                  </Typography>
                  {createdTemplates.map((template) => (
                    <Typography key={template.id} level="body-sm">
                      <AssignmentIcon sx={{ fontSize: 14, verticalAlign: 'middle', mr: 0.5 }} />
                      {template.name} (ID: {template.id})
                    </Typography>
                  ))}
                </Box>
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {success ? (
                <>
                  <Button
                    component={Link}
                    href="/clinician-dashboard/templates"
                    variant="solid"
                    color="success"
                    size="lg"
                  >
                    View Templates
                  </Button>
                  <Button
                    variant="outlined"
                    color="neutral"
                    size="lg"
                    onClick={() => {
                      setSuccess(false);
                      setCreatedTemplates([]);
                    }}
                  >
                    Seed Again
                  </Button>
                </>
              ) : (
                <Button
                  variant="solid"
                  color="success"
                  size="lg"
                  startDecorator={loading ? <CircularProgress size="sm" /> : <CloudUploadIcon />}
                  onClick={handleSeed}
                  disabled={loading}
                >
                  {loading ? 'Seeding 77-Item Templates...' : 'Seed 77-Item Templates'}
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
