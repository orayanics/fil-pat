"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ModalDialog,
  DialogTitle,
  DialogContent,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Typography,
  Alert,
  Chip,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemContent,
  Radio,
  RadioGroup,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  Autocomplete,
  AutocompleteOption,
  CircularProgress,
} from '@mui/joy';
import { Person, CheckCircle, Add } from '@mui/icons-material';

interface ExistingPatient {
  patient_id: number;
  first_name: string;
  last_name: string;
  age?: number;
  gender?: string;
  date_of_birth?: string;
  session_count: number;
}

interface PatientNamePromptProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (patientData: {
    patient_id?: number;
    first_name: string;
    last_name: string;
    is_existing: boolean;
  }) => void;
}

export default function PatientNamePrompt({ open, onClose, onConfirm }: PatientNamePromptProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [checking, setChecking] = useState(false);
  const [existingPatients, setExistingPatients] = useState<ExistingPatient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [allPatients, setAllPatients] = useState<ExistingPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // Fetch all patients when modal opens
  useEffect(() => {
    if (open) {
      fetchAllPatients();
    }
  }, [open]);

  const fetchAllPatients = async () => {
    setLoadingPatients(true);
    try {
      // Try to get clinician ID from context/auth - for now using query param
      const res = await fetch('/api/clinician/patients/list', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setAllPatients(data.patients || []);
      }
    } catch (err) {
      console.error('Failed to fetch patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  // Filter patients based on search query
  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return allPatients;
    const query = searchQuery.toLowerCase();
    return allPatients.filter(p => 
      p.first_name.toLowerCase().includes(query) ||
      p.last_name.toLowerCase().includes(query) ||
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(query)
    );
  }, [searchQuery, allPatients]);

  const handleSelectExistingPatient = (patient: ExistingPatient) => {
    setFirstName(patient.first_name);
    setLastName(patient.last_name);
    setSelectedPatientId(patient.patient_id);
    setExistingPatients([patient]);
    setChecked(true);
    setSearchQuery('');
  };

  const handleCheck = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both first and last name');
      return;
    }

    setError('');
    setChecking(true);

    try {
      const res = await fetch('/api/clinician/patients/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setExistingPatients(data.patients || []);
        setChecked(true);

        if (data.exists && data.patients.length > 0) {
          // Auto-select first patient if only one match
          if (data.patients.length === 1) {
            setSelectedPatientId(data.patients[0].patient_id);
          }
        } else {
          // No existing patients, set flag to create new
          setSelectedPatientId(-1);
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Patient check failed:', errorData);
        setError(`Failed to check patient records: ${errorData.error || res.statusText}`);
      }
    } catch (err) {
      console.error('Failed to check patient:', err);
      setError(`Network error: ${err instanceof Error ? err.message : 'Please check your connection'}`);
    } finally {
      setChecking(false);
    }
  };

  const handleConfirm = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter both first and last name');
      return;
    }

    // If not checked yet, just proceed with new patient creation
    if (!checked) {
      onConfirm({
        patient_id: undefined,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        is_existing: false,
      });
    } else {
      // If checked and existing patients found, require selection
      if (existingPatients.length > 0 && selectedPatientId === null) {
        setError('Please select a patient or create a new record');
        return;
      }

      onConfirm({
        patient_id: selectedPatientId && selectedPatientId !== -1 ? selectedPatientId : undefined,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        is_existing: selectedPatientId !== null && selectedPatientId !== -1,
      });
    }

    // Reset form
    setFirstName('');
    setLastName('');
    setExistingPatients([]);
    setSelectedPatientId(null);
    setChecked(false);
    setError('');
  };

  const handleCancel = () => {
    setFirstName('');
    setLastName('');
    setExistingPatients([]);
    setSelectedPatientId(null);
    setChecked(false);
    setError('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={(_, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
          return;
        }
        handleCancel();
      }}
    >
      <ModalDialog
        sx={{
          maxWidth: 600,
          borderRadius: 'lg',
          p: 3,
          boxShadow: 'lg',
        }}
      >
        <DialogTitle>
          <Stack direction="row" spacing={1} alignItems="center">
            <Person />
            <Typography level="h4">Patient Information</Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2.5}>
            {error && (
              <Alert color="danger" variant="soft">
                {error}
              </Alert>
            )}

            <Tabs defaultValue={0}>
              <TabList>
                <Tab>Search Existing Patient</Tab>
                <Tab>Enter New Patient</Tab>
              </TabList>

              {/* Search Tab */}
              <TabPanel value={0} sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Typography level="body-md" sx={{ color: 'text.secondary' }}>
                    Search and select from your existing patients
                  </Typography>

                  <Autocomplete
                    placeholder="Search by name..."
                    options={filteredPatients}
                    loading={loadingPatients}
                    getOptionLabel={(option) => `${option.first_name} ${option.last_name}`}
                    onInputChange={(_, value) => setSearchQuery(value)}
                    onChange={(_, value) => {
                      if (value) {
                        handleSelectExistingPatient(value);
                      }
                    }}
                    renderOption={(props, option) => {
                      const { key, ...otherProps } = props;
                      return (
                        <AutocompleteOption key={key} {...otherProps}>
                          <Stack>
                            <Typography level="title-sm">
                              {option.first_name} {option.last_name}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                              {option.age && (
                                <Chip size="sm" variant="soft">
                                  {option.age} years
                                </Chip>
                              )}
                              {option.gender && (
                                <Chip size="sm" variant="soft">
                                  {option.gender}
                                </Chip>
                              )}
                              <Chip size="sm" variant="soft" color="primary">
                                {option.session_count} {option.session_count === 1 ? 'session' : 'sessions'}
                              </Chip>
                            </Stack>
                          </Stack>
                        </AutocompleteOption>
                      );
                    }}
                    endDecorator={
                      loadingPatients ? (
                        <CircularProgress size="sm" sx={{ bgcolor: 'background.surface' }} />
                      ) : null
                    }
                  />

                  {checked && selectedPatientId && selectedPatientId !== -1 && (
                    <Alert color="success" variant="soft" startDecorator={<CheckCircle />}>
                      Selected: <strong>{firstName} {lastName}</strong>
                    </Alert>
                  )}
                </Stack>
              </TabPanel>

              {/* Manual Entry Tab */}
              <TabPanel value={1} sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Typography level="body-md" sx={{ color: 'text.secondary' }}>
                    Enter patient name manually. You can check if they exist in the system.
                  </Typography>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl required sx={{ flex: 1 }}>
                      <FormLabel>First Name</FormLabel>
                      <Input
                        placeholder="Enter first name"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          setChecked(false);
                          setExistingPatients([]);
                          setSelectedPatientId(null);
                        }}
                        disabled={checking}
                      />
                    </FormControl>

                    <FormControl required sx={{ flex: 1 }}>
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        placeholder="Enter last name"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          setChecked(false);
                          setExistingPatients([]);
                          setSelectedPatientId(null);
                        }}
                        disabled={checking}
                      />
                    </FormControl>
                  </Stack>

                  {!checked && (
                    <Button
                      variant="soft"
                      color="neutral"
                      onClick={handleCheck}
                      loading={checking}
                      disabled={!firstName.trim() || !lastName.trim()}
                    >
                      Check for Existing Records
                    </Button>
                  )}

                  {/* Existing Patients List */}
                  {checked && existingPatients.length > 0 && (
                    <Box>
                      <Alert color="success" variant="soft" startDecorator={<CheckCircle />} sx={{ mb: 2 }}>
                        Found {existingPatients.length} existing {existingPatients.length === 1 ? 'record' : 'records'} for this patient
                      </Alert>

                      <Typography level="title-sm" sx={{ mb: 1 }}>
                        Select Patient Record:
                      </Typography>

                      <RadioGroup
                        value={selectedPatientId?.toString() ?? ''}
                        onChange={(e) => setSelectedPatientId(Number(e.target.value))}
                      >
                        <List
                    sx={{
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 'sm',
                      overflow: 'hidden',
                    }}
                  >
                    {existingPatients.map((patient) => (
                      <ListItem key={patient.patient_id} sx={{ p: 0 }}>
                        <ListItemButton
                          selected={selectedPatientId === patient.patient_id}
                          sx={{ py: 1.5 }}
                        >
                          <Radio
                            value={patient.patient_id.toString()}
                            sx={{ mr: 1 }}
                          />
                          <ListItemContent>
                            <Typography level="title-sm">
                              {patient.first_name} {patient.last_name}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                              {patient.age && (
                                <Chip size="sm" variant="soft">
                                  {patient.age} years
                                </Chip>
                              )}
                              {patient.gender && (
                                <Chip size="sm" variant="soft">
                                  {patient.gender}
                                </Chip>
                              )}
                              <Chip size="sm" variant="soft" color="primary">
                                {patient.session_count} {patient.session_count === 1 ? 'session' : 'sessions'}
                              </Chip>
                            </Stack>
                          </ListItemContent>
                        </ListItemButton>
                      </ListItem>
                    ))}

                    {/* Option to create new record */}
                    <ListItem sx={{ p: 0, borderTop: '1px solid', borderColor: 'divider' }}>
                      <ListItemButton
                        selected={selectedPatientId === -1}
                        sx={{ py: 1.5 }}
                      >
                        <Radio value="-1" onChange={() => setSelectedPatientId(-1)} sx={{ mr: 1 }} />
                        <ListItemContent>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Add />
                            <Typography level="title-sm">
                              Create new record for {firstName} {lastName}
                            </Typography>
                          </Stack>
                          <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            This will create a new patient record
                          </Typography>
                        </ListItemContent>
                      </ListItemButton>
                    </ListItem>
                        </List>
                      </RadioGroup>
                    </Box>
                  )}

                  {/* New Patient Message */}
                  {checked && existingPatients.length === 0 && (
                    <Alert color="neutral" variant="soft">
                      <Typography level="body-sm">
                        No existing records found. A new patient record will be created for <strong>{firstName} {lastName}</strong>.
                      </Typography>
                    </Alert>
                  )}
                </Stack>
              </TabPanel>
            </Tabs>

            {/* Action Buttons */}
            <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
              <Button variant="plain" color="neutral" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="solid"
                color="primary"
                onClick={handleConfirm}
                disabled={!firstName.trim() || !lastName.trim() || (checked && existingPatients.length > 0 && selectedPatientId === null)}
              >
                {checked && existingPatients.length === 0 ? 'Create New & Continue' : 'Continue to Session'}
              </Button>
            </Stack>
          </Stack>
        </DialogContent>
      </ModalDialog>
    </Modal>
  );
}
