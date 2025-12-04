"use client";
import PrivateSidebar from "@/components/Layout/PrivateSidebar";
import AuthGuard from "@/components/auth/authGuard";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Box, Typography, Sheet, CircularProgress, Alert, Stack, Divider, Chip, Button, Accordion, AccordionSummary, AccordionDetails, Modal, ModalDialog, ModalClose } from "@mui/joy";
import { CheckCircle, Cancel, PictureAsPdf, Edit } from "@mui/icons-material";
import PatientFormModal from "@/components/crud/PatientFormModal";
import { useSocketStore } from "@/context/socketStore";
import dynamic from "next/dynamic";

const PatientFullReport = dynamic(() => import("@/modules/pdf/PatientFullReport"), { ssr: false });

type SessionItem = {
  item_id: number;
  item_number: number;
  question: string;
  target_word?: string;
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
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  status?: string;
  overall_score?: number;
  percentage_score?: number;
  post_session_notes?: string;
  session_summary?: string;
  template?: SessionTemplate;
  responses?: SessionResponse[];
  activity_log?: string;
  clinician_left_count?: number;
  total_pause_duration?: number;
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
  const [showFullReport, setShowFullReport] = useState(false);

  const handleGenerateReport = () => {
    setShowFullReport(true);
  };

  const handleEditPatient = () => {
    setEditModalOpen(true);
  };

  const handleSavePatient = async () => {
    // Reload patient data after save
    if (!patientId) return;
    try {
      console.log('[Patient Record] Reloading patient after edit...');
      const res = await fetch(`/api/clinician/patients/${patientId}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        console.log('[Patient Record] Patient data reloaded');
        setPatient(data.patient);
      }
    } catch (err) {
      console.error('Failed to reload patient:', err);
    }
    setEditModalOpen(false);
  };

  const loadPatient = useCallback(async () => {
    if (!patientId) return;
    let attempts = 0;
    const load = async () => {
      try {
        setLoading(true);
        console.log('[Patient Record] Loading patient data...');
        const res = await fetch(`/api/clinician/patients/${patientId}`, { credentials: 'include' });
        if (!res.ok) throw new Error(`Failed to load patient (${res.status})`);
        const data = await res.json();
        console.log('[Patient Record] API response:', data.patient);
        if (data.patient?.sessions) {
          data.patient.sessions.forEach((session: Session, idx: number) => {
            console.log(`[Patient Record] Session ${idx}:`, {
              session_id: session.session_id,
              status: session.status,
              template_items: session.template?.session_items?.length,
              responses: session.responses?.length
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

  useEffect(() => {
    loadPatient();
  }, [loadPatient]);

  // Auto-refresh when page becomes visible (e.g., navigating back from dashboard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && patientId) {
        console.log('[Patient Record] Page visible, refreshing patient data');
        loadPatient();
      }
    };

    const handleSessionStatusChange = () => {
      console.log('[Patient Record] Session status changed, refreshing patient data');
      loadPatient();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('sessionStatusChanged', handleSessionStatusChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('sessionStatusChanged', handleSessionStatusChange);
    };
  }, [patientId, loadPatient]);

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
                            {s.start_time && s.end_time && (() => {
                              const startTime = new Date(s.start_time);
                              const endTime = new Date(s.end_time);
                              const durationMs = endTime.getTime() - startTime.getTime();
                              const durationMinutes = Math.floor(durationMs / 60000);
                              const hours = Math.floor(durationMinutes / 60);
                              const minutes = durationMinutes % 60;
                              return (
                                <Typography level="body-xs" sx={{ color: 'text.tertiary', fontWeight: 600 }}>
                                  Duration: {hours > 0 ? `${hours}h ` : ''}{minutes}m
                                </Typography>
                              );
                            })()}
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

                            {s.activity_log && (() => {
                              try {
                                const activities = JSON.parse(s.activity_log);
                                if (activities && activities.length > 0) {
                                  return (
                                    <Box>
                                      <Typography level="body-sm" sx={{ fontWeight: 600, mb: 0.5 }}>Session Activity Timeline</Typography>
                                      <Sheet variant="outlined" sx={{ p: 1.5, borderRadius: 'sm' }}>
                                        <Stack spacing={0.75}>
                                          {activities.map((activity: any, idx: number) => {
                                            const timestamp = new Date(activity.timestamp);
                                            const timeStr = timestamp.toLocaleTimeString();
                                            const dateStr = timestamp.toLocaleDateString();
                                            
                                            let icon = '•';
                                            let color = 'neutral';
                                            let label = activity.type;
                                            
                                            if (activity.type === 'session_started') {
                                              icon = '▶';
                                              color = 'success';
                                              label = 'Session Started';
                                            } else if (activity.type === 'clinician_left') {
                                              icon = '⏸';
                                              color = 'warning';
                                              label = 'Clinician Left';
                                            } else if (activity.type === 'clinician_rejoined') {
                                              icon = '↻';
                                              color = 'primary';
                                              label = 'Clinician Rejoined';
                                            } else if (activity.type === 'session_ended') {
                                              icon = '■';
                                              color = 'danger';
                                              label = 'Session Ended';
                                            }
                                            
                                            return (
                                              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography level="body-xs" sx={{ fontWeight: 700, color: `${color}.500` }}>
                                                  {icon}
                                                </Typography>
                                                <Typography level="body-xs" sx={{ flex: 1 }}>
                                                  <strong>{label}</strong> - {timeStr} ({dateStr})
                                                </Typography>
                                              </Box>
                                            );
                                          })}
                                        </Stack>
                                        {s.clinician_left_count > 0 && (
                                          <Typography level="body-xs" sx={{ mt: 1, color: 'text.tertiary', fontStyle: 'italic' }}>
                                            Total pauses: {s.clinician_left_count} 
                                            {s.total_pause_duration && s.total_pause_duration > 0 && 
                                              ` (${Math.floor(s.total_pause_duration / 60)}m ${s.total_pause_duration % 60}s total pause time)`
                                            }
                                          </Typography>
                                        )}
                                      </Sheet>
                                    </Box>
                                  );
                                }
                              } catch (e) {
                                console.error('Failed to parse activity log:', e);
                              }
                              return null;
                            })()}

                            {/* Assessment Items - show even if template is deleted by reconstructing from responses */}
                            {(() => {
                              // Get items from template if available, otherwise reconstruct from responses
                              let items = s.template?.session_items || [];
                              
                              if (!s.template && s.responses && s.responses.length > 0) {
                                // Template was deleted, reconstruct items from responses
                                const uniqueItems = new Map();
                                s.responses.forEach(response => {
                                  if (response.session_item && !uniqueItems.has(response.session_item_id)) {
                                    uniqueItems.set(response.session_item_id, {
                                      item_id: response.session_item_id,
                                      item_number: uniqueItems.size + 1,
                                      question: (response as any).session_item?.question || 'N/A',
                                      target_word: (response as any).session_item?.target_word,
                                      sound: (response as any).session_item?.sound,
                                      max_score: (response as any).session_item?.max_score || 1,
                                      consonants_count: (response as any).session_item?.consonants_count,
                                      vowels_count: (response as any).session_item?.vowels_count,
                                    });
                                  }
                                });
                                items = Array.from(uniqueItems.values()).sort((a, b) => a.item_number - b.item_number);
                              }
                              
                              if (items.length === 0) return null;
                              
                              return (
                                <Box>
                                  <Typography level="body-sm" sx={{ fontWeight: 600, mb: 1 }}>
                                    Assessment Items ({s.responses?.length || 0} of {items.length} completed)
                                    {!s.template && ' (Template Deleted)'}
                                  </Typography>
                                  <Stack spacing={1}>
                                    {items.map((templateItem) => {
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
                                          
                                          {templateItem.target_word && (
                                            <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                                              <strong>Target Word:</strong> {templateItem.target_word}
                                            </Typography>
                                          )}
                                          
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
                            );
                          })()}
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

      {/* Full Report Modal */}
      <Modal open={showFullReport} onClose={() => setShowFullReport(false)}>
        <ModalDialog sx={{ maxWidth: '95vw', width: '1400px', maxHeight: '95vh', overflow: 'auto' }}>
          <ModalClose />
          {patientId && (
            <PatientFullReport 
              patientId={Number(patientId)} 
              onClose={() => setShowFullReport(false)}
            />
          )}
        </ModalDialog>
      </Modal>
    </AuthGuard>
  );
}
