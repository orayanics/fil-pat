"use client";

import React from 'react';
import { Button, IconButton, Modal, ModalDialog, Box, Typography } from '@mui/joy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AlertSuccess from '@/components/Alert/AlertSuccess';
import AlertError from '@/components/Alert/AlertError';

export default function TemplateActions({ templateId }: { templateId: number }) {
  const [open, setOpen] = React.useState(false);
  const [successOpen, setSuccessOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/templates/${templateId}`, { method: 'DELETE', credentials: 'include' });
      if (res.status === 204) {
        setSuccessOpen(true);
        setOpen(false);
        // revalidate the server component
        router.refresh();
      } else {
        const data = await res.json();
        setErrorMsg(data?.error || 'Delete failed');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Delete failed');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <Button size="sm" startDecorator={<EditIcon />} component={Link} href={`/clinician-dashboard/templates/edit/${templateId}`}>Edit</Button>
      <IconButton color="danger" onClick={() => setOpen(true)}>
        <DeleteIcon />
      </IconButton>

      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalDialog>
          <Typography component="h6" sx={{ fontWeight: 700 }}>Delete Template</Typography>
          <Typography level="body-sm" sx={{ mb: 2 }}>Are you sure you want to delete this template? This action cannot be undone.</Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button variant="outlined" color="neutral" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="solid" color="danger" onClick={handleDelete} loading={loading}>Delete</Button>
          </Box>
        </ModalDialog>
      </Modal>

      <AlertSuccess isOpen={successOpen} message="Template deleted" onClose={() => setSuccessOpen(false)} />
      <AlertError isOpen={!!errorMsg} message={errorMsg ?? ''} onClose={() => setErrorMsg(null)} />
    </Box>
  );
}
