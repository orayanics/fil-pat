import Link from 'next/link';
import { Box, Button, Typography } from '@mui/joy';
import TemplatesTable from '@/modules/templates/TemplatesTable';
import PrivateSidebar from '@/components/Layout/PrivateSidebar';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/auth';
import { prisma } from '@/lib/database/client';
import { redirect } from 'next/navigation';

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
    session_items: t.session_items ?? [],
    created_at: t.created_at ? t.created_at.toISOString() : undefined,
  }));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.body' }}>
      <PrivateSidebar />

      <Box sx={{ flex: 1, p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography level="h2">Templates</Typography>
          <Button component={Link} href="/clinician-dashboard/templates/new" size="sm" variant="solid">New Template</Button>
        </Box>

        {initialTemplates.length === 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 6, gap: 2 }}>
            <Typography level="h4">No templates yet</Typography>
            <Typography level="body-md" sx={{ color: 'neutral.600', textAlign: 'center', maxWidth: 540 }}>
              You haven&apos;t created any assessment templates. Templates let you quickly run standardized sessions for patients.
            </Typography>
            <Button component={Link} href="/clinician-dashboard/templates/new" size="md" variant="solid">Create your first template</Button>
          </Box>
        ) : (
          <TemplatesTable templates={initialTemplates} />
        )}
      </Box>
    </Box>
  );
}
