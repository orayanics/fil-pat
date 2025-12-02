import {useParams} from "next/navigation";

import {Box, Button, Alert, Table, CircularProgress, Typography, Sheet, Stack, Divider, Chip} from "@mui/joy";
import {usePdfForm} from "./usePdfForm";
// import {ExportedSessionData} from "@/models/variables"; // Unused type
import {CheckCircle, Cancel, Warning} from "@mui/icons-material";

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
            <Typography level="body-md" sx={{ color: 'text.secondary' }}>
              Session ID: {sessionId}
            </Typography>
            <Typography level="body-sm" sx={{ color: 'text.tertiary', mt: 0.5 }}>
              Generated: {formData.exportedAt}
            </Typography>
          </Box>

          {/* Summary Cards */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 4 }}>
            <Sheet variant="soft" color="primary" sx={{ flex: 1, p: 3, borderRadius: 'md', textAlign: 'center' }}>
              <Typography level="h4" sx={{ mb: 0.5 }}>{formData.meta.completedItems}</Typography>
              <Typography level="body-sm">Completed Items</Typography>
            </Sheet>
            <Sheet variant="soft" color="neutral" sx={{ flex: 1, p: 3, borderRadius: 'md', textAlign: 'center' }}>
              <Typography level="h4" sx={{ mb: 0.5 }}>{formData.meta.totalItems}</Typography>
              <Typography level="body-sm">Total Items</Typography>
            </Sheet>
            <Sheet 
              variant="soft" 
              color={completionPercentage >= 80 ? "success" : completionPercentage >= 50 ? "warning" : "danger"}
              sx={{ flex: 1, p: 3, borderRadius: 'md', textAlign: 'center' }}
            >
              <Typography level="h4" sx={{ mb: 0.5 }}>{completionPercentage}%</Typography>
              <Typography level="body-sm">Completion</Typography>
            </Sheet>
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Detailed Results Table */}
          <Box>
            <Typography level="h4" sx={{ mb: 2, fontWeight: 700 }}>Assessment Details</Typography>
            <Sheet variant="outlined" sx={{ borderRadius: 'md', overflow: 'hidden' }}>
              <Table 
                variant="plain"
                sx={{
                  '& thead th': {
                    bgcolor: 'primary.100',
                    color: 'primary.900',
                    fontWeight: 700,
                    py: 1.5,
                    fontSize: '0.875rem'
                  },
                  '& tbody td': {
                    py: 1.5,
                    fontSize: '0.875rem'
                  },
                  '& tbody tr:nth-of-type(odd)': {
                    bgcolor: 'background.level1'
                  }
                }}
              >
                <thead>
                  <tr>
                    <th style={{ width: '5%' }}>#</th>
                    <th style={{ width: '15%' }}>IPA</th>
                    <th style={{ width: '15%' }}>Group</th>
                    <th style={{ width: '25%' }}>Child Response</th>
                    <th style={{ width: '12%' }}>Consonants</th>
                    <th style={{ width: '12%' }}>Vowels</th>
                    <th style={{ width: '16%' }}>Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {sessionData.map(([key, value], index) => {
                    const hasResponse = value.childResponse && value.childResponse.trim() !== '';
                    // Calculate phoneme accuracy based on consonants and vowels
                    const totalPhonemes = (value.consonantsCount || 0) + (value.vowelsCount || 0);
                    const correctPhonemes = (value.consonantsCorrect || 0) + (value.vowelsCorrect || 0);
                    const accuracyPercentage = totalPhonemes > 0 ? (correctPhonemes / totalPhonemes) * 100 : 0;
                    
                    return (
                      <tr key={key}>
                        <td><strong>{index + 1}</strong></td>
                        <td>
                          <Typography level="body-sm" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                            {value.ipa_key || '—'}
                          </Typography>
                        </td>
                        <td>
                          <Chip size="sm" variant="soft" color="neutral">
                            {value.group || 'N/A'}
                          </Chip>
                        </td>
                        <td>
                          <Typography level="body-sm" sx={{ fontWeight: hasResponse ? 600 : 400, fontStyle: hasResponse ? 'normal' : 'italic' }}>
                            {hasResponse ? value.childResponse : 'No response'}
                          </Typography>
                        </td>
                        <td>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {value.consonantsCorrect > 0 ? (
                              <CheckCircle sx={{ fontSize: 16, color: 'success.500' }} />
                            ) : value.consonantsCorrect === 0 && hasResponse ? (
                              <Cancel sx={{ fontSize: 16, color: 'danger.500' }} />
                            ) : (
                              <Warning sx={{ fontSize: 16, color: 'warning.500' }} />
                            )}
                            <Typography level="body-sm">{value.consonantsCorrect || 0}</Typography>
                          </Box>
                        </td>
                        <td>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {value.vowelsCorrect > 0 ? (
                              <CheckCircle sx={{ fontSize: 16, color: 'success.500' }} />
                            ) : value.vowelsCorrect === 0 && hasResponse ? (
                              <Cancel sx={{ fontSize: 16, color: 'danger.500' }} />
                            ) : (
                              <Warning sx={{ fontSize: 16, color: 'warning.500' }} />
                            )}
                            <Typography level="body-sm">{value.vowelsCorrect || 0}</Typography>
                          </Box>
                        </td>
                        <td>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box 
                              sx={{ 
                                width: 60, 
                                height: 8, 
                                bgcolor: 'neutral.200', 
                                borderRadius: 'sm',
                                overflow: 'hidden'
                              }}
                            >
                              <Box 
                                sx={{ 
                                  width: `${accuracyPercentage}%`, 
                                  height: '100%',
                                  bgcolor: accuracyPercentage >= 85 ? 'success.500' : accuracyPercentage >= 65 ? 'warning.500' : 'danger.500',
                                  transition: 'width 0.3s'
                                }}
                              />
                            </Box>
                            <Typography level="body-sm" sx={{ fontWeight: 700 }}>
                              {totalPhonemes > 0 ? `${correctPhonemes}/${totalPhonemes}` : '—'}
                            </Typography>
                          </Box>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </Sheet>
          </Box>

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
