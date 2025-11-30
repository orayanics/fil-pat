import { Box } from '@mui/joy';
import PrivateSidebar from '@/components/Layout/PrivateSidebar';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/auth';
import { prisma } from '@/lib/database/client';
import { redirect } from 'next/navigation';
import TemplatesClient from './TemplatesClient';

export default async function ClinicianTemplatesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  if (!token) {
    redirect('/login');
  }

  const user = verifyToken(token!);
  if (!user) {
    redirect('/login');
  }

  const clinicianId = user.clinician_id;

  const templates = await prisma.assessmentTemplate.findMany({
    where: { created_by: clinicianId },
    include: { session_items: true },
    orderBy: { created_at: 'desc' }
  });

  const initialTemplates = templates.map(t => ({
    template_id: t.template_id,
    name: t.name,
    description: t.description ?? undefined,
    is_for_kids: t.is_for_kids ?? false,
    difficulty_level: t.difficulty_level ?? undefined,
    estimated_duration_minutes: t.estimated_duration_minutes ?? undefined,
    session_items: t.session_items ?? [],
    created_at: t.created_at ? t.created_at.toISOString() : undefined,
  }));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.body' }}>
      <PrivateSidebar />

      <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto', width: '100%' }}>
        <TemplatesClient templates={initialTemplates} />
      </Box>
    </Box>
  );
}
