import React from 'react';
import TemplateMaker from '@/modules/templates/TemplateMaker';
import { prisma } from '@/lib/database/client';
import { notFound } from 'next/navigation';
import PrivateSidebar from '@/components/Layout/PrivateSidebar';
import { Box, Typography, Button } from '@mui/joy';
import Link from 'next/link';

type Props = { params: Promise<{ id: string }> };

export default async function EditTemplatePage({ params }: Props) {
  const { id: idString } = await params;
  const id = Number(idString);
  if (!id) return notFound();

  const template = await prisma.assessmentTemplate.findUnique({
    where: { template_id: id },
    include: { session_items: true }
  });

  if (!template) return notFound();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.body' }}>
      <PrivateSidebar />

      <Box sx={{ flex: 1, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography level="h2">Edit Template</Typography>
          <Button component={Link} href="/clinician-dashboard/templates" size="sm" variant="outlined">Back</Button>
        </Box>

        {/* @ts-expect-error server -> client prop */}
        <TemplateMaker template={template} />
      </Box>
    </Box>
  );
}
