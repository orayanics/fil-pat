"use client";
import PrivateSidebar from "@/components/Layout/PrivateSidebar";
import AuthGuard from "@/components/auth/authGuard";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Box, Typography, Sheet, CircularProgress, Alert, Stack, Divider, Chip, Button, Accordion, AccordionSummary, AccordionDetails } from "@mui/joy";
import { CheckCircle, Cancel, PictureAsPdf, Edit } from "@mui/icons-material";
import PatientFormModal from "@/components/crud/PatientFormModal";
import { useSocketStore } from "@/context/socketStore";

type SessionItem = {
  item_id: number;
  item_number: number;
  question: string;
  sound?: string;
  max_score?: number;
  image_url?: string;
  consonants_count?: number;
  vowels_count?: number;
};

type SessionResponse = {
  response_id: number;
  session_item_id: number;
  response_text?: string;
  is_correct?: boolean;
  score?: number;
  time_taken_seconds?: number;
  clinician_notes?: string;
  timestamp?: string;
  consonants_correct?: number | null;
  vowels_correct?: number | null;
};

type SessionTemplate = {
  name: string;
  description?: string;
  total_items: number;
  session_items?: SessionItem[];
};

type Session = {
  session_id: number;
  session_uuid: string;
  session_name?: string;
  session_date?: string;
  status?: string;
  overall_score?: number;
  percentage_score?: number;
  post_session_notes?: string;
  session_summary?: string;
  template?: SessionTemplate;
  responses?: SessionResponse[];
};

type PatientData = {
  patient_id: number;
  first_name: string;
  last_name: string;
  age?: number;
  gender?: string;
  email?: string;
  phone?: string;
  notes?: string;
  is_active: boolean;
  created_at?: string;
  sessions?: Session[];
};

export default function PatientRecordPage() {
  const params = useParams();
  const patientId = params?.id as string | undefined;
  const user = useSocketStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleGenerateReport = async () => {
    if (!patientId) return;
    try {
      setGeneratingPdf(true);
      const res = await fetch(`/api/clinician/patients/${patientId}/report`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to generate report');
      const report = await res.json();
      
      // Open in new tab for now - could enhance with actual PDF generation
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write('<pre>' + JSON.stringify(report, null, 2) + '</pre>');
        newWindow.document.title = `Patient Report - ${report.patient.first_name} ${report.patient.last_name}`;
      }
    } catch (err) {
      console.error('Report generation error:', err);
      alert('Failed to generate report');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleEditPatient = () => {
    setEditModalOpen(true);
  };

  const handleSavePatient = async () => {
    // Reload patient data after save
    if (!patientId) return;
    try {
      const res = await fetch(`/api/clinician/patients/${patientId}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setPatient(data);
      }
    } catch (err) {
      console.error('Failed to reload patient:', err);
    }
    setEditModalOpen(false);
  };

  useEffect(() => {
    if (!patientId) return;
    let attempts = 0;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/clinician/patients/${patientId}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to load patient (${res.status})`);
        const data = await res.json();
        console.log('[Patient Record] API response:', data.patient);
        if (data.patient?.sessions) {
          data.patient.sessions.forEach((session: Session, idx: number) => {
            console.log(`[Patient Record] Session ${idx}:`, {
              session_id: session.session_id,
              template_items: session.template?.session_items?.length,
              responses: session.responses?.length,
              responses_detail: session.responses
            });
          });
        }
        setPatient(data.patient);
        setError(null);
      } catch (err) {
        console.error("Patient record load error:", err);
        attempts += 1;
        if (attempts < 2) {
          setTimeout(load, 400);
          return;
        }
        setError("Failed to load patient record");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [patientId]);

  return (
    <AuthGuard>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <PrivateSidebar />
        <Box sx={{ p: { xs: 3, sm: 4 }, flex: 1, '@media (max-width: 900px)': { pt: '80px' } }}>
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button variant="outlined" color="neutral" component={Link} href="/clinician-dashboard/patients">Back</Button>
              <Typography level="h2">Patient Record</Typography>
            </Box>
            {patient && (
              <Button 
                variant="solid" 
                color="primary" 
                startDecorator={<PictureAsPdf />}
                loading={generatingPdf}
                onClick={handleGenerateReport}
              >
                Generate Full Report
              </Button>
            )}
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert color="danger" variant="soft">{error}</Alert>
          ) : !patient ? (
            <Alert color="warning" variant="soft">No patient found.</Alert>
          ) : (
            <Stack spacing={3}>
              <Sheet variant="outlined" sx={{ p: 3, borderRadius: 'md' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                  <Typography level="h3">{patient.first_name} {patient.last_name}</Typography>
                  <Button 
                    variant="outlined" 
                    size="sm" 
                    startDecorator={<Edit />}
                    onClick={handleEditPatient}
                  >
                    Edit Details
                  </Button>
                </Box>
                <Chip size="sm" variant="soft" color={patient.is_active ? "success" : "neutral"} startDecorator={patient.is_active ? <CheckCircle /> : <Cancel />}>{patient.is_active ? "Active" : "Inactive"}</Chip>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1.5}>
                  <Typography level="body-sm"><strong>Age:</strong> {patient.age ?? '—'}</Typography>
                  <Typography level="body-sm"><strong>Gender:</strong> {patient.gender ?? '—'}</Typography>
                  <Typography level="body-sm"><strong>Email:</strong> {patient.email ?? '—'}</Typography>
                  <Typography level="body-sm"><strong>Phone:</strong> {patient.phone ?? '—'}</Typography>
                  {patient.created_at && (
                    <Typography level="body-sm"><strong>Created:</strong> {new Date(patient.created_at).toLocaleString()}</Typography>
                  )}
                  {patient.notes && <Typography level="body-sm"><strong>Notes:</strong> {patient.notes}</Typography>}
                </Stack>
              </Sheet>

              <Sheet variant="outlined" sx={{ p: 3, borderRadius: 'md' }}>
                <Typography level="h4" sx={{ mb: 2 }}>Assessment Sessions</Typography>
                {Array.isArray(patient.sessions) && patient.sessions.length > 0 ? (
                  <Stack spacing={2}>
                    {patient.sessions.map((s) => (
                      <Accordion key={s.session_id}>
                        <AccordionSummary>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 0.5 }}>
                              <Typography level="title-sm">{s.session_name || `Session ${s.session_uuid}`}</Typography>
                              {s.template && (
                                <Chip size="sm" variant="outlined">{s.template.name}</Chip>
                              )}
                              {s.template && s.template.session_items && (
                                <Chip size="sm" color="primary" variant="soft">
                                  {Math.round(((s.responses?.length || 0) / s.template.session_items.length) * 100)}% Complete
                                </Chip>
                              )}
                            </Stack>
                            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                              {s.session_date ? new Date(s.session_date).toLocaleString() : 'Date unknown'}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1} sx={{ ml: 2 }}>
                            <Button variant="outlined" size="sm" component={Link} href={`/pdf/${s.session_uuid}`}>PDF</Button>
                            {s.status === 'In Progress' && (
                              <Button variant="solid" size="sm" component={Link} href={`/session/clinician/${s.session_uuid}`}>Resume</Button>
                            )}
                          </Stack>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Stack spacing={2}>
                            {s.template && (
                              <Box>
                                <Typography level="body-sm" sx={{ fontWeight: 600, mb: 0.5 }}>Template</Typography>
                                <Typography level="body-sm">{s.template.name}</Typography>
                                {s.template.description && (
                                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>{s.template.description}</Typography>
                                )}
                                <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>Total items: {s.template.total_items}</Typography>
                              </Box>
                            )}

                            {s.session_summary && (
                              <Box>
                                <Typography level="body-sm" sx={{ fontWeight: 600, mb: 0.5 }}>Session Summary</Typography>
                                <Sheet variant="soft" sx={{ p: 1.5, borderRadius: 'sm' }}>
                                  <Typography level="body-sm">{s.session_summary}</Typography>
                                </Sheet>
                              </Box>
                            )}

                            {s.post_session_notes && (
                              <Box>
                                <Typography level="body-sm" sx={{ fontWeight: 600, mb: 0.5 }}>Clinician Notes</Typography>
                                <Sheet variant="soft" sx={{ p: 1.5, borderRadius: 'sm' }}>
                                  <Typography level="body-sm">{s.post_session_notes}</Typography>
                                </Sheet>
                              </Box>
                            )}

                            {s.template && Array.isArray(s.template.session_items) && (
                              <Box>
                                <Typography level="body-sm" sx={{ fontWeight: 600, mb: 1 }}>
                                  Assessment Items ({s.responses?.length || 0} of {s.template.session_items.length} completed)
                                </Typography>
                                <Stack spacing={1}>
                                  {s.template.session_items.map((templateItem) => {
                                    const response = s.responses?.find(r => r.session_item_id === templateItem.item_id);
                                    console.log(`[Patient Record] Item ${templateItem.item_number}:`, {
                                      item_id: templateItem.item_id,
                                      looking_for: templateItem.item_id,
                                      all_response_item_ids: s.responses?.map(r => r.session_item_id),
                                      found_response: response,
                                      response_data: response ? {
                                        response_text: response.response_text,
                                        consonants_correct: response.consonants_correct,
                                        vowels_correct: response.vowels_correct,
                                        clinician_notes: response.clinician_notes
                                      } : null
                                    });
                                    const isAnswered = response && (
                                      !!response.response_text ||
                                      (response.consonants_correct !== null && response.consonants_correct !== undefined) ||
                                      (response.vowels_correct !== null && response.vowels_correct !== undefined) ||
                                      !!response.clinician_notes
                                    );
                                    const isCorrect = response?.is_correct;
                                    
                                    return (
                                      <Sheet 
                                        key={templateItem.item_id} 
                                        variant="outlined" 
                                        sx={{ 
                                          p: 1.5, 
                                          borderRadius: 'sm',
                                          bgcolor: !isAnswered ? 'neutral.50' : isCorrect ? 'success.50' : 'danger.50',
                                          borderColor: !isAnswered ? 'neutral.300' : isCorrect ? 'success.400' : 'danger.400'
                                        }}
                                      >
                                        <Stack spacing={0.5}>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 1 }}>
                                            <Typography level="body-xs" sx={{ fontWeight: 600, flex: 1 }}>
                                              Item {templateItem.item_number}: {templateItem.question}
                                            </Typography>
                                            <Chip 
                                              size="sm" 
                                              color={!isAnswered ? "neutral" : isCorrect ? "success" : "danger"} 
                                              variant="soft"
                                            >
                                              {!isAnswered ? "Unanswered" : isCorrect ? "✓ Correct" : "✗ Wrong"}
                                            </Chip>
                                          </Box>
                                          
                                          {templateItem.sound && (
                                            <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                                              <strong>Target Sound:</strong> {templateItem.sound}
                                            </Typography>
                                          )}
                                          
                                          {response?.response_text && (
                                            <Typography level="body-xs">
                                              <strong>Patient Response:</strong> {response.response_text}
                                            </Typography>
                                          )}
                                          
                                          {response && (
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                                              {response.score !== undefined && response.score !== null && (
                                                <Typography level="body-xs">Score: {response.score}/{templateItem.max_score || 1}</Typography>
                                              )}
                                              {(response.consonants_correct !== undefined && response.consonants_correct !== null) && (
                                                <Typography level="body-xs">Consonants: {response.consonants_correct}/{templateItem.consonants_count || 0}</Typography>
                                              )}
                                              {(response.vowels_correct !== undefined && response.vowels_correct !== null) && (
                                                <Typography level="body-xs">Vowels: {response.vowels_correct}/{templateItem.vowels_count || 0}</Typography>
                                              )}
                                              {response.time_taken_seconds && (
                                                <Typography level="body-xs">Time: {response.time_taken_seconds}s</Typography>
                                              )}
                                            </Box>
                                          )}
                                          
                                          {response?.clinician_notes && (
                                            <Typography level="body-xs" sx={{ fontStyle: 'italic', color: 'text.tertiary', mt: 0.5 }}>
                                              📝 {response.clinician_notes}
                                            </Typography>
                                          )}
                                        </Stack>
                                      </Sheet>
                                    );
                                  })}
                                </Stack>
                              </Box>
                            )}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Stack>
                ) : (
                  <Sheet variant="soft" sx={{ p: 2, borderRadius: 'sm' }}>
                    <Typography level="body-sm">No sessions found for this patient yet.</Typography>
                  </Sheet>
                )}
              </Sheet>
            </Stack>
          )}
        </Box>
      </Box>

      {/* Edit Patient Modal */}
      {user && patient && (
        <PatientFormModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSavePatient}
          patient={patient}
          clinicianId={user.clinician_id}
        />
      )}
    </AuthGuard>
  );
}
