"use client";

import React, { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Sheet,
  Chip,
  Input,
  IconButton,
  Modal,
  ModalDialog,
  Card,
  CardContent,
  AspectRatio,
  Divider,
  Alert,
} from '@mui/joy';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AlertSuccess from '@/components/Alert/AlertSuccess';
import AlertError from '@/components/Alert/AlertError';

type TemplateSummary = {
  template_id: number;
  name: string;
  description?: string;
  is_for_kids?: boolean;
  difficulty_level?: string;
  estimated_duration_minutes?: number;
  session_items?: Array<Record<string, unknown>>;
  created_at?: string;
};

interface TemplatesClientProps {
  templates: TemplateSummary[];
}

export default function TemplatesClient({ templates }: TemplatesClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [forceDeleteInfo, setForceDeleteInfo] = useState<{ sessionsCount: number } | null>(null);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const q = searchQuery.toLowerCase();
    return templates.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.difficulty_level?.toLowerCase().includes(q)
    );
  }, [templates, searchQuery]);

  const itemsPerPage = 3;
  const totalPages = Math.ceil(filteredTemplates.length / itemsPerPage);
  const currentPageTemplates = filteredTemplates.slice(
    carouselIndex * itemsPerPage,
    (carouselIndex + 1) * itemsPerPage
  );

  const handleDelete = async (force = false) => {
    if (!templateToDelete) return;
    setDeleting(true);
    setErrorMsg(null);
    try {
      const url = force 
        ? `/api/templates/${templateToDelete}?force=true`
        : `/api/templates/${templateToDelete}`;
      
      const res = await fetch(url, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.ok || res.status === 204) {
        const endedSessions = data?.endedSessions || 0;
        const message = endedSessions > 0 
          ? `Template deleted successfully. ${endedSessions} session(s) were ended.`
          : 'Template deleted successfully';
        setSuccessMsg(message);
        setDeleteModalOpen(false);
        setTemplateToDelete(null);
        setForceDeleteInfo(null);
        router.refresh();
      } else if (res.status === 400 && data?.canForceDelete) {
        // Template is in use, show force delete option
        setForceDeleteInfo({ sessionsCount: data.sessionsCount });
      } else {
        setErrorMsg(data?.message || data?.error || 'Delete failed');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const handlePrev = () => {
    setCarouselIndex((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNext = () => {
    setCarouselIndex((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography level="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon /> Assessment Templates
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            component={Link}
            href="/clinician-dashboard"
            size="sm"
            variant="outlined"
            startDecorator={<ArrowBackIcon />}
          >
            Back
          </Button>
          <Button
            component={Link}
            href="/clinician-dashboard/templates/new"
            size="sm"
            variant="solid"
            startDecorator={<AddIcon />}
          >
            New Template
          </Button>
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <Input
          placeholder="Search templates by name, description, or difficulty..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startDecorator={<SearchIcon />}
          size="lg"
          sx={{ maxWidth: 600 }}
        />
      </Box>

      {filteredTemplates.length === 0 && !searchQuery ? (
        <Sheet
          variant="outlined"
          sx={{
            p: 6,
            borderRadius: 8,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <AssignmentIcon sx={{ fontSize: 64, color: 'neutral.400' }} />
          <Typography level="h4">No templates yet</Typography>
          <Typography level="body-md" sx={{ color: 'neutral.600', maxWidth: 540 }}>
            You haven&apos;t created any assessment templates. Templates let you quickly run
            standardized sessions for patients.
          </Typography>
          <Button
            component={Link}
            href="/clinician-dashboard/templates/new"
            size="lg"
            variant="solid"
            startDecorator={<AddIcon />}
          >
            Create your first template
          </Button>
        </Sheet>
      ) : filteredTemplates.length === 0 && searchQuery ? (
        <Sheet variant="outlined" sx={{ p: 4, borderRadius: 8, textAlign: 'center' }}>
          <Typography level="h4">No templates found</Typography>
          <Typography level="body-md" sx={{ color: 'neutral.600', mt: 1 }}>
            Try adjusting your search query.
          </Typography>
        </Sheet>
      ) : (
        <>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
              },
              gap: 3,
              mb: 3,
            }}
          >
            {currentPageTemplates.map((template) => (
              <Card
                key={template.template_id}
                variant="outlined"
                sx={{
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 'lg',
                  },
                }}
              >
                <AspectRatio ratio="21/9" sx={{ bgcolor: 'primary.softBg' }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                    }}
                  >
                    <AssignmentIcon sx={{ fontSize: 48, color: 'primary.solidBg' }} />
                  </Box>
                </AspectRatio>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography level="title-lg" sx={{ fontWeight: 700 }}>
                      {template.name}
                    </Typography>
                    {template.is_for_kids && (
                      <Chip size="sm" color="success" startDecorator={<ChildCareIcon />}>
                        Kids
                      </Chip>
                    )}
                  </Box>

                  <Typography level="body-sm" sx={{ color: 'neutral.600', mb: 2, minHeight: 40 }}>
                    {template.description || 'No description provided'}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip size="sm" variant="soft">
                      {template.difficulty_level || 'Standard'}
                    </Chip>
                    <Chip size="sm" variant="soft" startDecorator={<AssignmentIcon />}>
                      {template.session_items?.length || 0} items
                    </Chip>
                    {template.estimated_duration_minutes && (
                      <Chip size="sm" variant="soft" startDecorator={<AccessTimeIcon />}>
                        {template.estimated_duration_minutes} min
                      </Chip>
                    )}
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      size="sm"
                      variant="soft"
                      startDecorator={<VisibilityIcon />}
                      component={Link}
                      href={`/clinician-dashboard/templates/edit/${template.template_id}`}
                      sx={{ flex: 1 }}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="outlined"
                      startDecorator={<EditIcon />}
                      component={Link}
                      href={`/clinician-dashboard/templates/edit/${template.template_id}`}
                      sx={{ flex: 1 }}
                    >
                      Edit
                    </Button>
                    <IconButton
                      size="sm"
                      color="danger"
                      variant="soft"
                      onClick={() => {
                        setTemplateToDelete(template.template_id);
                        setDeleteModalOpen(true);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {totalPages > 1 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 2,
                mt: 4,
              }}
            >
              <IconButton size="lg" variant="outlined" onClick={handlePrev}>
                <ArrowBackIcon />
              </IconButton>
              <Typography level="body-md">
                Page {carouselIndex + 1} of {totalPages}
              </Typography>
              <IconButton size="lg" variant="outlined" onClick={handleNext}>
                <ArrowForwardIcon />
              </IconButton>
            </Box>
          )}
        </>
      )}

      <Modal open={deleteModalOpen} onClose={() => {
        setDeleteModalOpen(false);
        setForceDeleteInfo(null);
        setErrorMsg(null);
      }}>
        <ModalDialog>
          <Typography level="h4" sx={{ mb: 1 }}>
            Delete Template
          </Typography>
          
          {!forceDeleteInfo ? (
            <>
              <Typography level="body-sm" sx={{ mb: 2 }}>
                Are you sure you want to delete this template? This action cannot be undone.
              </Typography>
              
              {errorMsg && (
                <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
                  {errorMsg}
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  color="neutral" 
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setErrorMsg(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="solid" 
                  color="danger" 
                  onClick={() => handleDelete(false)} 
                  loading={deleting}
                >
                  Delete
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Alert color="warning" variant="soft" sx={{ mb: 2 }}>
                <Typography level="body-sm">
                  This template is currently being used in <strong>{forceDeleteInfo.sessionsCount} session(s)</strong>.
                </Typography>
              </Alert>
              
              <Typography level="body-sm" sx={{ mb: 2 }}>
                If you proceed with force delete:
              </Typography>
              <ul style={{ marginTop: 0, paddingLeft: '20px', marginBottom: '16px' }}>
                <li><Typography level="body-sm">All {forceDeleteInfo.sessionsCount} session(s) will be marked as "Cancelled"</Typography></li>
                <li><Typography level="body-sm">Session end times will be set to now</Typography></li>
                <li><Typography level="body-sm">A note will be added: "Session ended due to template deletion"</Typography></li>
                <li><Typography level="body-sm">The template will be permanently deleted</Typography></li>
              </ul>
              
              <Typography level="body-sm" sx={{ mb: 2, fontWeight: 'bold', color: 'danger.500' }}>
                This action cannot be undone. Are you sure?
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  color="neutral" 
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setForceDeleteInfo(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  variant="solid" 
                  color="danger" 
                  onClick={() => handleDelete(true)} 
                  loading={deleting}
                >
                  Force Delete & End Sessions
                </Button>
              </Box>
            </>
          )}
        </ModalDialog>
      </Modal>

      <AlertSuccess
        isOpen={!!successMsg}
        message={successMsg ?? ''}
        onClose={() => setSuccessMsg(null)}
      />
      <AlertError isOpen={!!errorMsg} message={errorMsg ?? ''} onClose={() => setErrorMsg(null)} />
    </>
  );
}
