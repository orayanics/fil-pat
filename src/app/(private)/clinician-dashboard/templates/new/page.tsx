import React from 'react';
import TemplateMaker from '@/modules/templates/TemplateMaker';
import PrivateSidebar from '@/components/Layout/PrivateSidebar';
import { Box, Typography, Button } from '@mui/joy';
import Link from 'next/link';

export default function NewTemplatePage() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.body' }}>
      <PrivateSidebar />

      <Box sx={{ flex: 1, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography level="h2">New Template</Typography>
          <Button component={Link} href="/clinician-dashboard/templates" size="sm" variant="outlined">Back</Button>
        </Box>

        <TemplateMaker />
      </Box>
    </Box>
  );
}
