import {useParams} from "next/navigation";

import {Box, Button, Alert, Table, CircularProgress, Typography, Sheet, Stack, Divider, Chip, Card} from "@mui/joy";
import {usePdfForm} from "./usePdfForm";
// import {ExportedSessionData} from "@/models/variables"; // Unused type
import {CheckCircle, Cancel, Warning, Person, Cake, Wc, CalendarToday, Timer, PlayArrow, Stop} from "@mui/icons-material";

export default function SessionPdf() {
  const params = useParams();
  const sessionId = params?.id as string;
  const {formData, loading, error, isSave, savePdf, targetRef} = usePdfForm(sessionId);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 4 }}>
        <CircularProgress />
        <Typography>Loading session data...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert color="danger" variant="soft">
        Error loading session data: {error}
      </Alert>
    );
  }

  if (!formData) {
    return (
      <Alert color="warning" variant="soft">
        No data available for export or the session form is incomplete.
      </Alert>
    );
  }

  const completionPercentage = formData.meta?.completionPercentage || 0;
  const sessionData = Object.entries(formData.session || {});
  const isKidsTemplate = formData.templateInfo?.is_for_kids || false;
  const responseLabel = isKidsTemplate ? "Child Response" : "Patient Response";

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography level="h3">Session Report</Typography>
        <Button
          variant="solid"
          color="primary"
          onClick={savePdf}
          disabled={!formData || isSave}
          size="lg"
        >
          {isSave ? "Generating PDF..." : "Download PDF"}
        </Button>
      </Box>

      {formData && (
        <Box ref={targetRef} sx={{ bgcolor: 'white', p: 4, borderRadius: 'md', boxShadow: 'lg' }}>
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 4, pb: 3, borderBottom: '3px solid', borderColor: 'primary.500' }}>
            <Typography level="h2" sx={{ color: 'primary.700', fontWeight: 800, mb: 1 }}>
              Filipino Phonological Assessment Report
            </Typography>
            <Typography level="body-md" sx={{ color: 'text.secondary', fontWeight: 600 }}>
              {formData.sessionInfo?.session_name || `Session ${sessionId}`}
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.tertiary', mt: 0.5 }}>
              Generated: {new Date(formData.exportedAt).toLocaleString()}
            </Typography>
          </Box>

          {/* Patient & Session Info Cards */}
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
            {/* Patient Information */}
            {formData.patientInfo && (
              <Card variant="outlined" sx={{ flex: 1, p: 2 }}>
                <Typography level="title-md" sx={{ mb: 1.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person sx={{ fontSize: 20 }} /> Patient Information
                </Typography>
                <Stack spacing={0.5}>
                  <Typography level="body-sm"><strong>Name:</strong> {formData.patientInfo.first_name} {formData.patientInfo.last_name}</Typography>
                  {formData.patientInfo.age && (
                    <Typography level="body-sm" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Cake sx={{ fontSize: 16 }} /> <strong>Age:</strong> {formData.patientInfo.age} years old
                    </Typography>
                  )}
                  {formData.patientInfo.gender && (
                    <Typography level="body-sm" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Wc sx={{ fontSize: 16 }} /> <strong>Gender:</strong> {formData.patientInfo.gender}
                    </Typography>
                  )}
                  {formData.patientInfo.date_of_birth && (
                    <Typography level="body-sm" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarToday sx={{ fontSize: 16 }} /> <strong>DOB:</strong> {new Date(formData.patientInfo.date_of_birth).toLocaleDateString()}
                    </Typography>
                  )}
                </Stack>
              </Card>
            )}

            {/* Clinician Information */}
            {formData.clinicianInfo && (
              <Card variant="outlined" sx={{ flex: 1, p: 2 }}>
                <Typography level="title-md" sx={{ mb: 1.5, fontWeight: 700 }}>
                  Clinician Information
                </Typography>
                <Stack spacing={0.5}>
                  <Typography level="body-sm"><strong>Name:</strong> {formData.clinicianInfo.first_name} {formData.clinicianInfo.last_name}</Typography>
                  <Typography level="body-sm"><strong>Email:</strong> {formData.clinicianInfo.email}</Typography>
                </Stack>
              </Card>
            )}
          </Stack>

          {/* Session Details Card */}
          {formData.sessionInfo && (
            <Card variant="soft" color="primary" sx={{ mb: 3, p: 2 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Box sx={{ flex: 1 }}>
                  <Typography level="body-sm" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <CalendarToday sx={{ fontSize: 16 }} /> <strong>Date:</strong> {formData.sessionInfo.session_date ? new Date(formData.sessionInfo.session_date).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography level="body-sm" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PlayArrow sx={{ fontSize: 16 }} /> <strong>Start:</strong> {formData.sessionInfo.start_time ? new Date(formData.sessionInfo.start_time).toLocaleTimeString() : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography level="body-sm" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                    <Stop sx={{ fontSize: 16 }} /> <strong>End:</strong> {formData.sessionInfo.end_time ? new Date(formData.sessionInfo.end_time).toLocaleTimeString() : 'N/A'}
                  </Typography>
                  <Typography level="body-sm" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Timer sx={{ fontSize: 16 }} /> <strong>Duration:</strong> {formData.sessionInfo.duration_minutes ? `${formData.sessionInfo.duration_minutes} minutes` : 'N/A'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography level="body-sm" sx={{ mb: 0.5 }}>
                    <strong>Template:</strong> {formData.templateInfo?.name || 'N/A'}
                  </Typography>
                  <Typography level="body-sm">
                    <strong>Mode:</strong> {formData.sessionInfo.session_mode === 'kids' || isKidsTemplate ? 'Kids Mode' : 'Standard'}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          )}

          {/* Summary Cards */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
            <Sheet variant="soft" color="primary" sx={{ flex: 1, p: 2.5, borderRadius: 'md', textAlign: 'center' }}>
              <Typography level="h3" sx={{ mb: 0.5, fontWeight: 700 }}>{formData.meta.completedItems}</Typography>
              <Typography level="body-sm" sx={{ fontWeight: 600 }}>Items Completed</Typography>
            </Sheet>
            <Sheet variant="soft" color="neutral" sx={{ flex: 1, p: 2.5, borderRadius: 'md', textAlign: 'center' }}>
              <Typography level="h3" sx={{ mb: 0.5, fontWeight: 700 }}>{formData.meta.totalItems}</Typography>
              <Typography level="body-sm" sx={{ fontWeight: 600 }}>Total Items</Typography>
            </Sheet>
            <Sheet 
              variant="soft" 
              color={completionPercentage >= 80 ? "success" : completionPercentage >= 50 ? "warning" : "danger"}
              sx={{ flex: 1, p: 2.5, borderRadius: 'md', textAlign: 'center' }}
            >
              <Typography level="h3" sx={{ mb: 0.5, fontWeight: 700 }}>{completionPercentage.toFixed(1)}%</Typography>
              <Typography level="body-sm" sx={{ fontWeight: 600 }}>Completion Rate</Typography>
            </Sheet>
            {formData.sessionInfo?.overall_score !== null && formData.sessionInfo?.overall_score !== undefined && (
              <Sheet variant="soft" color="success" sx={{ flex: 1, p: 2.5, borderRadius: 'md', textAlign: 'center' }}>
                <Typography level="h3" sx={{ mb: 0.5, fontWeight: 700 }}>{formData.sessionInfo.overall_score.toFixed(1)}</Typography>
                <Typography level="body-sm" sx={{ fontWeight: 600 }}>Overall Score</Typography>
              </Sheet>
            )}
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Detailed Results Table */}
          <Box>
            <Typography level="h4" sx={{ mb: 2, fontWeight: 700 }}>Phonological Assessment Results</Typography>
            <Sheet variant="outlined" sx={{ borderRadius: 'md', overflow: 'auto' }}>
              <Table 
                variant="plain"
                sx={{
                  tableLayout: 'fixed',
                  width: '100%',
                  '& thead th': {
                    bgcolor: 'primary.100',
                    color: 'primary.900',
                    fontWeight: 700,
                    py: 1.5,
                    px: 1,
                    fontSize: '0.8rem',
                    lineHeight: 1.2,
                    verticalAlign: 'top'
                  },
                  '& tbody td': {
                    py: 1.5,
                    px: 1,
                    fontSize: '0.75rem',
                    lineHeight: 1.3,
                    verticalAlign: 'top',
                    wordWrap: 'break-word',
                    overflow: 'hidden'
                  },
                  '& tbody tr:nth-of-type(odd)': {
                    bgcolor: 'background.level1'
                  }
                }}
              >
                <thead>
                  <tr>
                    <th style={{ width: '4%' }}>Item #</th>
                    <th style={{ width: '10%' }}>Target Word</th>
                    <th style={{ width: '7%' }}>Phoneme Group</th>
                    <th style={{ width: '10%' }}>IPA Key</th>
                    <th style={{ width: '13%' }}>{responseLabel}</th>
                    <th style={{ width: '7%' }}>Consonants</th>
                    <th style={{ width: '7%' }}>Vowels</th>
                    <th style={{ width: '9%' }}>Phoneme Accuracy</th>
                    <th style={{ width: '7%' }}>Score</th>
                    <th style={{ width: '26%' }}>Clinical Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionData.map(([key, value], index) => {
                    const hasResponse = value.childResponse && value.childResponse.trim() !== '';
                    const hasNotes = value.clinicianNotes && value.clinicianNotes.trim() !== '';
                    // Calculate phoneme accuracy based on consonants and vowels
                    const totalPhonemes = (value.consonantsCount || 0) + (value.vowelsCount || 0);
                    const correctPhonemes = (value.consonantsCorrect || 0) + (value.vowelsCorrect || 0);
                    const accuracyPercentage = totalPhonemes > 0 ? (correctPhonemes / totalPhonemes) * 100 : 0;
                    
                    return (
                      <tr key={key}>
                        <td style={{ textAlign: 'center' }}>
                          <Typography level="body-sm" sx={{ fontWeight: 700 }}>{index + 1}</Typography>
                        </td>
                        <td>
                          <Typography level="body-sm" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                            {value.target_word || '—'}
                          </Typography>
                        </td>
                        <td>
                          <Chip size="sm" variant="soft" color="neutral" sx={{ fontSize: '0.7rem', minHeight: 'auto', py: 0.25 }}>
                            {value.group || 'N/A'}
                          </Chip>
                        </td>
                        <td>
                          <Typography level="body-sm" sx={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }}>
                            {value.ipa_key || '—'}
                          </Typography>
                        </td>
                        <td>
                          <Typography level="body-sm" sx={{ fontWeight: hasResponse ? 600 : 400, fontStyle: hasResponse ? 'normal' : 'italic', fontSize: '0.75rem', lineHeight: 1.3 }}>
                            {hasResponse ? value.childResponse : 'No response'}
                          </Typography>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            {value.consonantsCorrect > 0 ? (
                              <CheckCircle sx={{ fontSize: 14, color: 'success.500' }} />
                            ) : value.consonantsCorrect === 0 && hasResponse ? (
                              <Cancel sx={{ fontSize: 14, color: 'danger.500' }} />
                            ) : (
                              <Warning sx={{ fontSize: 14, color: 'warning.500' }} />
                            )}
                            <Typography level="body-sm" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {value.consonantsCorrect || 0}/{value.consonantsCount || 0}
                            </Typography>
                          </Box>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                            {value.vowelsCorrect > 0 ? (
                              <CheckCircle sx={{ fontSize: 14, color: 'success.500' }} />
                            ) : value.vowelsCorrect === 0 && hasResponse ? (
                              <Cancel sx={{ fontSize: 14, color: 'danger.500' }} />
                            ) : (
                              <Warning sx={{ fontSize: 14, color: 'warning.500' }} />
                            )}
                            <Typography level="body-sm" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                              {value.vowelsCorrect || 0}/{value.vowelsCount || 0}
                            </Typography>
                          </Box>
                        </td>
                        <td>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <Box 
                              sx={{ 
                                width: '100%', 
                                height: 6, 
                                bgcolor: 'neutral.200', 
                                borderRadius: 'sm',
                                overflow: 'hidden'
                              }}
                            >
                              <Box 
                                sx={{ 
                                  width: `${accuracyPercentage}%`, 
                                  height: '100%',
                                  bgcolor: accuracyPercentage >= 85 ? 'success.500' : accuracyPercentage >= 65 ? 'warning.500' : 'danger.500'
                                }}
                              />
                            </Box>
                            <Typography level="body-sm" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>
                              {totalPhonemes > 0 ? `${correctPhonemes}/${totalPhonemes} (${accuracyPercentage.toFixed(0)}%)` : '—'}
                            </Typography>
                          </Box>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <Typography level="body-sm" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>
                            {accuracyPercentage === 100 ? '1' : '0'}
                          </Typography>
                        </td>
                        <td>
                          <Typography level="body-sm" sx={{ fontStyle: hasNotes ? 'normal' : 'italic', color: hasNotes ? 'text.primary' : 'text.tertiary', fontSize: '0.7rem', lineHeight: 1.3 }}>
                            {hasNotes ? value.clinicianNotes : 'No notes'}
                          </Typography>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Sheet>
          </Box>

          {/* Final Notes Section */}
          {(formData.sessionInfo?.post_session_notes || formData.sessionInfo?.session_summary || formData.sessionInfo?.recommendations) && (
            <Box sx={{ mt: 4 }}>
              <Typography level="h4" sx={{ mb: 2, fontWeight: 700 }}>Session Notes</Typography>
              {formData.sessionInfo.post_session_notes && (
                <Sheet variant="soft" color="primary" sx={{ p: 3, mb: 2, borderRadius: 'md' }}>
                  <Typography level="title-md" sx={{ mb: 1, fontWeight: 600 }}>Final Notes</Typography>
                  <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {formData.sessionInfo.post_session_notes}
                  </Typography>
                </Sheet>
              )}
              {formData.sessionInfo.session_summary && (
                <Sheet variant="soft" color="neutral" sx={{ p: 3, mb: 2, borderRadius: 'md' }}>
                  <Typography level="title-md" sx={{ mb: 1, fontWeight: 600 }}>Session Summary</Typography>
                  <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {formData.sessionInfo.session_summary}
                  </Typography>
                </Sheet>
              )}
              {formData.sessionInfo.recommendations && (
                <Sheet variant="soft" color="success" sx={{ p: 3, borderRadius: 'md' }}>
                  <Typography level="title-md" sx={{ mb: 1, fontWeight: 600 }}>Recommendations</Typography>
                  <Typography level="body-sm" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {formData.sessionInfo.recommendations}
                  </Typography>
                </Sheet>
              )}
            </Box>
          )}

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
      )}
    </Box>
  );
}
