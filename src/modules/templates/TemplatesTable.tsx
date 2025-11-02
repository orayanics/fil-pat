"use client";

import React, { useEffect, useState } from 'react';
import { Box, Sheet, Typography } from '@mui/joy';
import TemplateActions from './TemplateActions';

type TemplateSummary = {
  template_id: number;
  name: string;
  description?: string | undefined;
  session_items?: Array<Record<string, unknown>>;
  created_at?: string | undefined;
};

export default function TemplatesTable({ templates }: { templates: TemplateSummary[] }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width:900px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  if (isMobile) {
    // Card/list view for mobile
    return (
      <Box sx={{ display: 'grid', gap: 2 }}>
        {templates.map(t => (
          <Sheet key={t.template_id} variant="outlined" sx={{ p: 2, borderRadius: 2, transition: 'box-shadow 0.18s, transform 0.18s', '&:hover': { boxShadow: 6, transform: 'translateY(-3px)' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography level="title-md">{t.name}</Typography>
                <Typography level="body-sm" sx={{ color: 'neutral.600', mt: 0.5 }}>{t.description}</Typography>
                <Typography level="body-xs" sx={{ color: 'neutral.500', mt: 1 }}>{t.session_items ? t.session_items.length : 0} items</Typography>
              </Box>
              <Box>
                <TemplateActions templateId={t.template_id} />
              </Box>
            </Box>
          </Sheet>
        ))}
      </Box>
    );
  }

  // Desktop table view
  return (
    <Box component="div" sx={{ overflowX: 'auto', '& tbody tr:hover': { backgroundColor: 'action.hover', boxShadow: '0 6px 18px rgba(2,6,23,0.06)' }, '& tbody tr': { transition: 'background 0.12s, box-shadow 0.12s' } }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid', borderColor: 'divider' }}>Name</th>
            <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid', borderColor: 'divider' }}>Description</th>
            <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid', borderColor: 'divider', width: 100 }}>Items</th>
            <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid', borderColor: 'divider', width: 200 }}>Created</th>
            <th style={{ textAlign: 'left', padding: '12px 8px', borderBottom: '1px solid', borderColor: 'divider', width: 220 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.map(t => (
            <tr key={t.template_id}>
              <td style={{ padding: '12px 8px', borderBottom: '1px solid', borderColor: 'divider' }}>{t.name}</td>
              <td style={{ padding: '12px 8px', color: 'var(--joy-palette-neutral-600)', borderBottom: '1px solid', borderColor: 'divider' }}>{t.description}</td>
              <td style={{ padding: '12px 8px', borderBottom: '1px solid', borderColor: 'divider' }}>{t.session_items ? t.session_items.length : 0}</td>
              <td style={{ padding: '12px 8px', borderBottom: '1px solid', borderColor: 'divider' }}>{t.created_at ? new Date(t.created_at).toLocaleString() : '-'}</td>
              <td style={{ padding: '12px 8px', borderBottom: '1px solid', borderColor: 'divider' }}>
                <TemplateActions templateId={t.template_id} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}
