"use client";

import React, { useEffect, useState } from 'react';
import { Box, Button, Typography, Card, CardContent, IconButton } from '@mui/joy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useRouter } from 'next/navigation';

type TemplateSummary = {
  template_id: number;
  name: string;
  description?: string;
};

export default function ManageTemplates() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  useEffect(() => { fetchTemplates(); }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this template?')) return;
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE', credentials: 'include' });
      if (res.status === 204) {
        setTemplates(t => t.filter(x => x.template_id !== id));
      } else {
        const data = await res.json();
        alert(data.error || 'Delete failed');
      }
    } catch (err) { console.error(err); alert('Delete failed'); }
  };

  return (
    <Box>
      <Typography level="h3" sx={{ mb: 2 }}>Manage Templates</Typography>
      {loading && <Typography>Loading...</Typography>}
      {templates.map(t => (
        <Card key={t.template_id} variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Typography level="title-lg">{t.name}</Typography>
            <Typography level="body-sm" sx={{ color: 'neutral.600' }}>{t.description}</Typography>
            <Box sx={{ mt: 1 }}>
              <Button size="sm" startDecorator={<EditIcon />} onClick={() => router.push(`/templates/edit/${t.template_id}`)}>Edit</Button>
              <IconButton color="danger" onClick={() => handleDelete(t.template_id)} sx={{ ml: 1 }}>
                <DeleteIcon />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
