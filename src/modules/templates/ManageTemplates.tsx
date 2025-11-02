"use client";

import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/joy';
import AlertSuccess from '@/components/Alert/AlertSuccess';
import TemplatesTable from '@/modules/templates/TemplatesTable';
import AlertError from '@/components/Alert/AlertError';

type TemplateSummary = {
  template_id: number;
  name: string;
  description?: string;
  session_items?: Array<Record<string, unknown>>;
  created_at?: string;
};

export default function ManageTemplates({ initialTemplates }: { initialTemplates?: TemplateSummary[] }) {
  const [templates, setTemplates] = useState<TemplateSummary[]>(initialTemplates ?? []);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // router no longer needed; table actions handle navigation and deletion

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/templates', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Failed to fetch templates', err);
    } finally { setLoading(false); }
  };

  // Only fetch on the client if the server didn't provide initial templates
  useEffect(() => { if (!initialTemplates) fetchTemplates(); }, [initialTemplates]);

  // deletion is handled by TemplateActions in the shared table; keep fetch/refresh support here

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography level="h3">Manage Templates</Typography>
        <Box>
          <Button size="sm" variant="outlined" onClick={() => fetchTemplates()} disabled={loading} sx={{ mr: 1 }}>Refresh</Button>
        </Box>
      </Box>
      {loading && <Typography>Loading...</Typography>}

      <TemplatesTable templates={templates} />
      <AlertSuccess isOpen={!!successMsg} message={successMsg ?? ''} onClose={() => setSuccessMsg(null)} />
      <AlertError isOpen={!!errorMsg} message={errorMsg ?? ''} onClose={() => setErrorMsg(null)} />
    </Box>
  );
}
