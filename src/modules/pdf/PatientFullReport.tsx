"use client";

import { useEffect, useState, useRef } from 'react';
import { Box, Button, Typography, Sheet, Stack, Divider, Chip, Table, CircularProgress, Alert } from '@mui/joy';
import { CheckCircle, Cancel, Assessment, CalendarToday, Schedule, Person } from '@mui/icons-material';
import { usePDF, Margin } from 'react-to-pdf';

type PatientReportData = {
  patient: {
    patient_id: number;
    first_name: string;
    last_name: string;
    age: number;
    gender: string;
    email?: string;
    phone?: string;
    date_of_birth?: string;
    created_at: string;
  };
  clinician: {
    name: string;
    email: string;
  } | null;
  sessions: Array<{
    session_id: number;
    session_uuid: string;
    session_name: string | null;
    session_date: string;
    start_time: string | null;
    end_time: string | null;
    duration_minutes: number | null;
    status: string;
    session_mode: string;
    overall_score: number | null;
    percentage_score: number | null;
    post_session_notes: string | null;
    session_summary: string | null;
    template: {
      name: string;
      description: string | null;
      total_items: number;
    } | null;
    items: Array<{
      item_number: number;
      question: string;
      response_text: string | null;
      is_correct: boolean | null;
      score: number | null;
      max_score: number;
      time_taken_seconds: number | null;
      clinician_notes: string | null;
    }>;
  }>;
  meta: {
    total_sessions: number;
    generated_at: string;
  };
};

interface PatientFullReportProps {
  patientId: number;
  onClose?: () => void;
}

export default function PatientFullReport({ patientId, onClose }: PatientFullReportProps) {
  const [data, setData] = useState<PatientReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  const { toPDF } = usePDF({
    filename: `patient_${patientId}_full_report.pdf`,
    page: { margin: Margin.MEDIUM, format: 'letter', orientation: 'portrait' },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/clinician/patients/${patientId}/report`, {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const reportData = await response.json();
        setData(reportData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch patient report:', err);
        setError(err instanceof Error ? err.message : 'Failed to load report');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId]);

  const handleGeneratePDF = async () => {
    try {
      setGenerating(true);
      await toPDF();
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 4 }}>
        <CircularProgress />
        <Typography>Loading patient report...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert color="danger" variant="soft" sx={{ m: 3 }}>
        Error loading report: {error}
      </Alert>
    );
  }

  if (!data) {
    return (
      <Alert color="warning" variant="soft" sx={{ m: 3 }}>
        No data available for this patient.
      </Alert>
    );
  }

  const completedSessions = data.sessions.filter(s => s.status === 'Completed').length;
  const totalResponses = data.sessions.reduce((sum, s) => sum + s.items.length, 0);
  const avgScore = data.sessions.length > 0
    ? data.sessions.reduce((sum, s) => sum + (s.percentage_score || 0), 0) / data.sessions.length
    : 0;

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography level="h3">Full Patient Report</Typography>
        <Stack direction="row" spacing={2}>
          {onClose && (
            <Button variant="outlined" color="neutral" onClick={onClose}>
              Close
            </Button>
          )}
          <Button
            variant="solid"
            color="primary"
            onClick={handleGeneratePDF}
            disabled={generating}
            size="lg"
          >
            {generating ? 'Generating PDF...' : 'Download PDF'}
          </Button>
        </Stack>
      </Box>

      <Box ref={targetRef} sx={{ bgcolor: 'white', p: 4, borderRadius: 'md', boxShadow: 'lg' }}>
        {/* Header Section */}
        <Box sx={{ textAlign: 'center', mb: 4, pb: 3, borderBottom: '3px solid', borderColor: 'primary.500' }}>
          <Typography level="h2" sx={{ color: 'primary.700', fontWeight: 800, mb: 1 }}>
            Comprehensive Patient Assessment Report
          </Typography>
          <Typography level="h4" sx={{ color: 'text.primary', mt: 2 }}>
            {data.patient.first_name} {data.patient.last_name}
          </Typography>
          <Typography level="body-sm" sx={{ color: 'text.tertiary', mt: 0.5 }}>
            Generated: {new Date(data.meta.generated_at).toLocaleDateString()} at {new Date(data.meta.generated_at).toLocaleTimeString()}
          </Typography>
        </Box>

        {/* Patient Information */}
        <Box sx={{ mb: 4 }}>
          <Typography level="h4" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Person /> Patient Information
          </Typography>
          <Sheet variant="soft" color="neutral" sx={{ p: 3, borderRadius: 'md' }}>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <Box>
                  <Typography level="body-sm" sx={{ fontWeight: 600 }}>Age:</Typography>
                  <Typography level="body-md">{data.patient.age} years</Typography>
                </Box>
                <Box>
                  <Typography level="body-sm" sx={{ fontWeight: 600 }}>Gender:</Typography>
                  <Typography level="body-md">{data.patient.gender}</Typography>
                </Box>
                {data.patient.date_of_birth && (
                  <Box>
                    <Typography level="body-sm" sx={{ fontWeight: 600 }}>Date of Birth:</Typography>
                    <Typography level="body-md">{new Date(data.patient.date_of_birth).toLocaleDateString()}</Typography>
                  </Box>
                )}
              </Box>
              {data.patient.email && (
                <Box>
                  <Typography level="body-sm" sx={{ fontWeight: 600 }}>Email:</Typography>
                  <Typography level="body-md">{data.patient.email}</Typography>
                </Box>
              )}
              {data.patient.phone && (
                <Box>
                  <Typography level="body-sm" sx={{ fontWeight: 600 }}>Phone:</Typography>
                  <Typography level="body-md">{data.patient.phone}</Typography>
                </Box>
              )}
              {data.clinician && (
                <Box>
                  <Typography level="body-sm" sx={{ fontWeight: 600 }}>Assigned Clinician:</Typography>
                  <Typography level="body-md">{data.clinician.name} ({data.clinician.email})</Typography>
                </Box>
              )}
            </Stack>
          </Sheet>
        </Box>

        {/* Summary Statistics */}
        <Box sx={{ mb: 4 }}>
          <Typography level="h4" sx={{ mb: 2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment /> Overall Statistics
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Sheet variant="soft" color="primary" sx={{ flex: 1, p: 3, borderRadius: 'md', textAlign: 'center' }}>
              <Typography level="h3" sx={{ mb: 0.5 }}>{data.meta.total_sessions}</Typography>
              <Typography level="body-sm">Total Sessions</Typography>
            </Sheet>
            <Sheet variant="soft" color="success" sx={{ flex: 1, p: 3, borderRadius: 'md', textAlign: 'center' }}>
              <Typography level="h3" sx={{ mb: 0.5 }}>{completedSessions}</Typography>
              <Typography level="body-sm">Completed Sessions</Typography>
            </Sheet>
            <Sheet variant="soft" color="neutral" sx={{ flex: 1, p: 3, borderRadius: 'md', textAlign: 'center' }}>
              <Typography level="h3" sx={{ mb: 0.5 }}>{totalResponses}</Typography>
              <Typography level="body-sm">Total Responses</Typography>
            </Sheet>
            <Sheet 
              variant="soft" 
              color={avgScore >= 80 ? "success" : avgScore >= 60 ? "warning" : "danger"}
              sx={{ flex: 1, p: 3, borderRadius: 'md', textAlign: 'center' }}
            >
              <Typography level="h3" sx={{ mb: 0.5 }}>{avgScore.toFixed(1)}%</Typography>
              <Typography level="body-sm">Average Score</Typography>
            </Sheet>
          </Stack>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Session Details */}
        {data.sessions.map((session, sessionIndex) => (
          <Box key={session.session_id} sx={{ mb: 4, pageBreakInside: 'avoid' }}>
            <Box sx={{ mb: 2, bgcolor: 'primary.50', p: 2, borderRadius: 'md', borderLeft: '4px solid', borderColor: 'primary.500' }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography level="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Session {sessionIndex + 1}: {session.session_name || 'Unnamed Session'}
                  </Typography>
                  {session.template && (
                    <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
                      Template: {session.template.name}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1}>
                  <Chip 
                    size="sm" 
                    variant="soft" 
                    color={session.status === 'Completed' ? 'success' : session.status === 'In Progress' ? 'warning' : 'neutral'}
                  >
                    {session.status}
                  </Chip>
                  {session.percentage_score !== null && (
                    <Chip size="sm" variant="solid" color="primary">
                      Score: {session.percentage_score}%
                    </Chip>
                  )}
                </Stack>
              </Stack>
              <Stack direction="row" spacing={3} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarToday sx={{ fontSize: 16 }} />
                  <Typography level="body-xs">{new Date(session.session_date).toLocaleDateString()}</Typography>
                </Box>
                {session.start_time && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Schedule sx={{ fontSize: 16 }} />
                    <Typography level="body-xs">
                      {new Date(session.start_time).toLocaleTimeString()} 
                      {session.end_time && ` - ${new Date(session.end_time).toLocaleTimeString()}`}
                    </Typography>
                  </Box>
                )}
                {session.duration_minutes && (
                  <Typography level="body-xs">Duration: {session.duration_minutes} min</Typography>
                )}
              </Stack>
            </Box>

            {/* Session Items Table */}
            {session.items.length > 0 && (
              <Sheet variant="outlined" sx={{ borderRadius: 'md', overflow: 'auto', mb: 2 }}>
                <Table 
                  size="sm"
                  variant="plain"
                  sx={{
                    '& thead th': {
                      bgcolor: 'neutral.100',
                      fontWeight: 700,
                      py: 1,
                      fontSize: '0.75rem'
                    },
                    '& tbody td': {
                      py: 1,
                      fontSize: '0.75rem',
                      wordBreak: 'break-word',
                      whiteSpace: 'normal'
                    },
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '25%' }}>Question</th>
                      <th style={{ width: '20%' }}>Response</th>
                      <th style={{ width: '10%' }}>Score</th>
                      <th style={{ width: '10%' }}>Time</th>
                      <th style={{ width: '30%' }}>Clinician Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {session.items.map((item) => (
                      <tr key={item.item_number}>
                        <td><strong>{item.item_number}</strong></td>
                        <td>
                          <Typography level="body-sm" sx={{ wordBreak: 'break-word' }}>
                            {item.question}
                          </Typography>
                        </td>
                        <td>
                          <Typography level="body-sm" sx={{ fontStyle: item.response_text ? 'normal' : 'italic', wordBreak: 'break-word' }}>
                            {item.response_text || 'No response'}
                          </Typography>
                        </td>
                        <td>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {item.is_correct === true && <CheckCircle sx={{ fontSize: 14, color: 'success.500' }} />}
                            {item.is_correct === false && <Cancel sx={{ fontSize: 14, color: 'danger.500' }} />}
                            <Typography level="body-sm">
                              {item.score !== null ? `${item.score}/${item.max_score}` : '—'}
                            </Typography>
                          </Box>
                        </td>
                        <td>
                          <Typography level="body-sm">
                            {item.time_taken_seconds ? `${item.time_taken_seconds}s` : '—'}
                          </Typography>
                        </td>
                        <td>
                          <Typography level="body-sm" sx={{ fontStyle: item.clinician_notes ? 'normal' : 'italic', wordBreak: 'break-word' }}>
                            {item.clinician_notes || '—'}
                          </Typography>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Sheet>
            )}

            {/* Session Notes */}
            {(session.post_session_notes || session.session_summary) && (
              <Stack spacing={1.5}>
                {session.post_session_notes && (
                  <Sheet variant="soft" color="primary" sx={{ p: 2, borderRadius: 'md' }}>
                    <Typography level="title-sm" sx={{ mb: 0.5, fontWeight: 600 }}>Final Notes:</Typography>
                    <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {session.post_session_notes}
                    </Typography>
                  </Sheet>
                )}
                {session.session_summary && (
                  <Sheet variant="soft" color="neutral" sx={{ p: 2, borderRadius: 'md' }}>
                    <Typography level="title-sm" sx={{ mb: 0.5, fontWeight: 600 }}>Summary:</Typography>
                    <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {session.session_summary}
                    </Typography>
                  </Sheet>
                )}
              </Stack>
            )}
          </Box>
        ))}

        {/* Footer */}
        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            This report is confidential and intended for professional use only.
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
            Generated by Filipino Phonological Assessment Tool (FilPAT)
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
