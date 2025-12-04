"use client";

import React from 'react';
import {
  Box,
  Button,
  Typography,
  Card,
  CardContent,
  Chip,
} from '@mui/joy';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PrivateSidebar from '@/components/Layout/PrivateSidebar';

export default function SeedTemplatesPage() {
  const router = useRouter();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.body' }}>
      <PrivateSidebar />

      <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1200, mx: 'auto', width: '100%' }}>
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
            <CloudUploadIcon /> Seed Templates
          </Typography>
          <Link href="/clinician-dashboard/templates" passHref style={{ textDecoration: 'none' }}>
            <Button
              size="sm"
              variant="outlined"
              startDecorator={<ArrowBackIcon />}
            >
              Back to Templates
            </Button>
          </Link>
        </Box>

        <Typography level="body-lg" sx={{ mb: 4, color: 'neutral.600' }}>
          Choose which template set to seed to your account.
          You can create either the 20-item simplified templates or the complete 77-item comprehensive assessment.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
          }}
        >
          <Card
            variant="outlined"
            sx={{
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 'lg',
                borderColor: 'primary.500',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PersonIcon sx={{ fontSize: 48, color: 'primary.500' }} />
                <Box>
                  <Typography level="h3" sx={{ mb: 0.5 }}>
                    20-Item Templates
                  </Typography>
                  <Chip size="sm" color="primary" variant="soft">
                    Simplified Version
                  </Chip>
                </Box>
              </Box>

              <Typography level="body-md" sx={{ mb: 2, color: 'neutral.600' }}>
                Create simplified 20-item assessment templates with playful themes.
                Ideal for quick assessments or younger children.
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography level="body-sm" sx={{ fontWeight: 600, mb: 1 }}>
                  <AssignmentIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} /> What will be created:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li><Typography level="body-sm">Filipino PAT - Kids Edition (20 Items)</Typography></li>
                  <li><Typography level="body-sm">Filipino PAT - Standard Assessment (20 Items)</Typography></li>
                </ul>
              </Box>

              <Link href="/clinician-dashboard/templates/seed-templates/20" passHref style={{ textDecoration: 'none' }}>
                <Button
                  size="lg"
                  variant="solid"
                  color="primary"
                  fullWidth
                  startDecorator={<CloudUploadIcon />}
                >
                  Seed 20-Item Templates
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card
            variant="outlined"
            sx={{
              transition: 'all 0.2s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 'lg',
                borderColor: 'success.500',
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PersonIcon sx={{ fontSize: 48, color: 'success.500' }} />
                <Box>
                  <Typography level="h3" sx={{ mb: 0.5 }}>
                    77-Item Templates
                  </Typography>
                  <Chip size="sm" color="success" variant="soft">
                    Complete Version
                  </Chip>
                </Box>
              </Box>

              <Typography level="body-md" sx={{ mb: 2, color: 'neutral.600' }}>
                Create comprehensive 77-item assessment templates covering all Filipino phonemes.
                Complete clinical assessment tool for thorough evaluations.
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography level="body-sm" sx={{ fontWeight: 600, mb: 1 }}>
                  <AssignmentIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} /> What will be created:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li><Typography level="body-sm">Complete Filipino Phonological Assessment (77 Items)</Typography></li>
                  <li><Typography level="body-sm">Filipino Phonological Assessment - Kids Mode (77 Items)</Typography></li>
                </ul>
              </Box>

              <Link href="/clinician-dashboard/templates/seed-templates/77" passHref style={{ textDecoration: 'none' }}>
                <Button
                  size="lg"
                  variant="solid"
                  color="success"
                  fullWidth
                  startDecorator={<CloudUploadIcon />}
                >
                  Seed 77-Item Templates
                </Button>
              </Link>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}
