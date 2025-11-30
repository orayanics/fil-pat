"use client";
import PrivateSidebar from "@/components/Layout/PrivateSidebar";
import AuthGuard from "@/components/auth/authGuard";
import PatientFormModal from "@/components/crud/PatientFormModal";
import { useEffect, useState, useCallback, useMemo, useDeferredValue } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Sheet,
  Table,
  Chip,
  IconButton,
  Input,
  Select,
  Option,
  Button,
  Modal,
  ModalDialog,
  ModalClose,
  DialogTitle,
  DialogContent,
  Stack,
  Divider,
  Avatar,
  Tooltip,
  Checkbox,
} from "@mui/joy";
import {
  Search,
  Visibility,
  Delete,
  FilterList,
  CheckCircle,
  Cancel,
  DeleteSweep,
  Add,
  Edit,
} from "@mui/icons-material";
import { useSocketContext } from "@/context/SocketProvider";
import Link from "next/link";

type Patient = {
  patient_id: number;
  first_name: string;
  last_name: string;
  email?: string;
  age?: number;
  gender?: string;
  phone?: string;
  notes?: string;
  date_of_birth?: string;
  is_active: boolean;
  created_at?: string;
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  // Derived state is memoized for performance on large lists
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedPatients, setSelectedPatients] = useState<Set<number>>(new Set());
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const { user } = useSocketContext();

  const fetchPatients = useCallback(() => {
    if (!user || !user.clinician_id) {
      setError("Please log in to view your patients");
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();
    const { signal } = controller;
    fetch(`/api/clinician/patients/list?clinicianId=${user.clinician_id}` , { signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data) => {
        setPatients(data.patients || []);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        console.log("Patients fetch error:", err);
        setError("Failed to fetch patients");
        setLoading(false);
      });
    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Filter patients based on search and status with memoization
  const filteredPatients = useMemo(() => {
    let filtered = patients;
    if (statusFilter === "active") {
      filtered = filtered.filter((p) => p.is_active);
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((p) => !p.is_active);
    }
    const q = (deferredSearch || "").toLowerCase();
    if (q) {
      filtered = filtered.filter((p) => {
        const first = p.first_name?.toLowerCase() || "";
        const last = p.last_name?.toLowerCase() || "";
        const email = p.email?.toLowerCase() || "";
        return first.includes(q) || last.includes(q) || email.includes(q);
      });
    }
    return filtered;
  }, [patients, statusFilter, deferredSearch]);

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient);
  };

  const handleDeleteClick = (patient: Patient) => {
    setPatientToDelete(patient);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!patientToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/clinician/patients/${patientToDelete.patient_id}`, {
        method: "DELETE",
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteSuccess(data.message || 'Patient deleted successfully');
        setDeleteModalOpen(false);
        setPatientToDelete(null);
        fetchPatients(); // Refresh the list
        
        // Clear success message after 3 seconds
        setTimeout(() => setDeleteSuccess(null), 3000);
      } else {
        setDeleteError(data.error || 'Failed to delete patient');
      }
    } catch (err) {
      console.error("Delete error:", err);
      setDeleteError('Network error: Failed to delete patient');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleStatus = async (patient: Patient) => {
    try {
      const response = await fetch(`/api/clinician/patients/${patient.patient_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ is_active: !patient.is_active }),
      });

      if (response.ok) {
        fetchPatients(); // Refresh the list
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update patient status');
      }
    } catch (err) {
      console.error("Toggle status error:", err);
      setError('Failed to update patient status');
    }
  };

  const handleSelectPatient = (patientId: number) => {
    setSelectedPatients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        newSet.add(patientId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedPatients.size === filteredPatients.length) {
      setSelectedPatients(new Set());
    } else {
      setSelectedPatients(new Set(filteredPatients.map((p) => p.patient_id)));
    }
  };

  const handleBulkDeleteClick = () => {
    if (selectedPatients.size === 0) return;
    setBulkDeleteModalOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedPatients.size === 0) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch('/api/clinician/patients/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ patient_ids: Array.from(selectedPatients) }),
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteSuccess(data.message || 'Patients deleted successfully');
        setBulkDeleteModalOpen(false);
        setSelectedPatients(new Set());
        fetchPatients();
        
        setTimeout(() => setDeleteSuccess(null), 3000);
      } else {
        setDeleteError(data.error || 'Failed to delete patients');
      }
    } catch (err) {
      console.error('Bulk delete error:', err);
      setDeleteError('Network error: Failed to delete patients');
    } finally {
      setDeleting(false);
    }
  };

  const handleAddPatient = () => {
    setPatientToEdit(null);
    setFormModalOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setPatientToEdit(patient);
    setFormModalOpen(true);
  };

  const handleFormSave = () => {
    fetchPatients();
    setFormModalOpen(false);
    setPatientToEdit(null);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <AuthGuard>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <PrivateSidebar />
        <Box sx={{ p: { xs: 3, sm: 4 }, flex: 1, '@media (max-width: 900px)': { pt: '80px' } }}>
          {/* Header */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" color="neutral" component={Link} href="/clinician-dashboard">
              Back
            </Button>
            <Box sx={{ flex: 1, minWidth: 250 }}>
              <Typography level="h2" sx={{ mb: 1 }}>
                Patient Management
              </Typography>
              <Typography level="body-md" sx={{ color: "text.secondary" }}>
                Manage your patient records, view assessment history, and track progress
              </Typography>
            </Box>
            <Button
              variant="solid"
              color="primary"
              startDecorator={<Add />}
              onClick={handleAddPatient}
              size="lg"
            >
              Add Patient
            </Button>
          </Box>

          {/* Success Alert */}
          {deleteSuccess && (
            <Alert color="success" variant="soft" sx={{ mb: 3 }}>
              {deleteSuccess}
            </Alert>
          )}

          {/* Stats Cards */}
          <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <Sheet
              variant="soft"
              color="primary"
              sx={{ p: 2, borderRadius: "md", flex: 1, minWidth: 200 }}
            >
              <Typography level="body-sm" sx={{ mb: 0.5 }}>
                Total Patients
              </Typography>
              <Typography level="h3">{patients.length}</Typography>
            </Sheet>
            <Sheet
              variant="soft"
              color="success"
              sx={{ p: 2, borderRadius: "md", flex: 1, minWidth: 200 }}
            >
              <Typography level="body-sm" sx={{ mb: 0.5 }}>
                Active Patients
              </Typography>
              <Typography level="h3">
                {patients.filter((p) => p.is_active).length}
              </Typography>
            </Sheet>
            <Sheet
              variant="soft"
              color="neutral"
              sx={{ p: 2, borderRadius: "md", flex: 1, minWidth: 200 }}
            >
              <Typography level="body-sm" sx={{ mb: 0.5 }}>
                Inactive Patients
              </Typography>
              <Typography level="h3">
                {patients.filter((p) => !p.is_active).length}
              </Typography>
            </Sheet>
          </Box>

          {/* Filters and Search */}
          <Sheet variant="outlined" sx={{ p: 2, borderRadius: "md", mb: 3 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
              <Input
                placeholder="Search by name or email..."
                startDecorator={<Search />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flex: 1, minWidth: 250 }}
              />
              <Select
                placeholder="Filter by status"
                startDecorator={<FilterList />}
                value={statusFilter}
                onChange={(_, value) => setStatusFilter(value as "all" | "active" | "inactive")}
                sx={{ minWidth: 180 }}
              >
                <Option value="all">All Patients</Option>
                <Option value="active">Active Only</Option>
                <Option value="inactive">Inactive Only</Option>
              </Select>
              {selectedPatients.size > 0 && (
                <Button
                  color="danger"
                  variant="solid"
                  startDecorator={<DeleteSweep />}
                  onClick={handleBulkDeleteClick}
                >
                  Delete {selectedPatients.size} Selected
                </Button>
              )}
            </Stack>
          </Sheet>

          {/* Patients Table */}
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert color="danger" variant="soft">
              {error}
            </Alert>
          ) : filteredPatients.length === 0 ? (
            <Sheet variant="soft" sx={{ p: 4, textAlign: "center", borderRadius: "md" }}>
              <Typography level="body-lg" sx={{ mb: 2 }}>
                {patients.length === 0
                  ? "No patients yet"
                  : "No patients match your filters"}
              </Typography>
              <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                {patients.length === 0
                  ? "Patients will appear here after they complete a session and save their information."
                  : "Try adjusting your search or filter criteria"}
              </Typography>
            </Sheet>
          ) : (
            <Sheet variant="outlined" sx={{ borderRadius: "md", overflow: "hidden" }}>
              <Table
                sx={{
                  "& thead th": {
                    bgcolor: "background.level1",
                    fontWeight: 600,
                  },
                }}
              >
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>
                      <Checkbox
                        checked={selectedPatients.size === filteredPatients.length && filteredPatients.length > 0}
                        indeterminate={selectedPatients.size > 0 && selectedPatients.size < filteredPatients.length}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th style={{ width: 60 }}>Avatar</th>
                    <th>Name</th>
                    <th>Contact</th>
                    <th>Age / Gender</th>
                    <th>Status</th>
                    <th style={{ width: 200 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr key={patient.patient_id}>
                      <td>
                        <Checkbox
                          checked={selectedPatients.has(patient.patient_id)}
                          onChange={() => handleSelectPatient(patient.patient_id)}
                        />
                      </td>
                      <td>
                        <Avatar size="sm" color="primary">
                          {getInitials(patient.first_name, patient.last_name)}
                        </Avatar>
                      </td>
                      <td>
                        <Typography level="title-sm">
                          {patient.first_name} {patient.last_name}
                        </Typography>
                      </td>
                      <td>
                        <Typography level="body-sm">
                          {patient.email || "—"}
                        </Typography>
                        {patient.phone && (
                          <Typography level="body-xs" sx={{ color: "text.tertiary" }}>
                            {patient.phone}
                          </Typography>
                        )}
                      </td>
                      <td>
                        <Typography level="body-sm">
                          {patient.age ? `${patient.age} years` : "—"}
                          {patient.gender && ` • ${patient.gender}`}
                        </Typography>
                      </td>
                      <td>
                        <Chip
                          size="sm"
                          variant="soft"
                          color={patient.is_active ? "success" : "neutral"}
                          startDecorator={patient.is_active ? <CheckCircle /> : <Cancel />}
                        >
                          {patient.is_active ? "Active" : "Inactive"}
                        </Chip>
                      </td>
                      <td>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "nowrap" }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="sm"
                              variant="plain"
                              color="primary"
                              onClick={() => handleViewPatient(patient)}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Patient">
                            <IconButton
                              size="sm"
                              variant="plain"
                              color="primary"
                              onClick={() => handleEditPatient(patient)}
                            >
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={patient.is_active ? "Deactivate" : "Activate"}>
                            <IconButton
                              size="sm"
                              variant="plain"
                              color={patient.is_active ? "warning" : "success"}
                              onClick={() => handleToggleStatus(patient)}
                            >
                              {patient.is_active ? <Cancel /> : <CheckCircle />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Patient">
                            <IconButton
                              size="sm"
                              variant="plain"
                              color="danger"
                              onClick={() => handleDeleteClick(patient)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Sheet>
          )}

          {/* Patient Details Modal */}
          <Modal open={!!selectedPatient} onClose={() => setSelectedPatient(null)}>
            <ModalDialog sx={{ maxWidth: 600, p: 0 }}>
              <ModalClose />
              {selectedPatient && (
                <>
                  <Box
                    sx={{
                      p: 3,
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      color: "white",
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar size="lg" sx={{ bgcolor: "white", color: "primary.500" }}>
                        {getInitials(selectedPatient.first_name, selectedPatient.last_name)}
                      </Avatar>
                      <Box>
                        <Typography level="h4" sx={{ color: "white", mb: 0.5 }}>
                          {selectedPatient.first_name} {selectedPatient.last_name}
                        </Typography>
                        <Chip
                          size="sm"
                          variant="soft"
                          sx={{
                            bgcolor: selectedPatient.is_active
                              ? "rgba(255,255,255,0.3)"
                              : "rgba(0,0,0,0.3)",
                            color: "white",
                          }}
                        >
                          {selectedPatient.is_active ? "Active" : "Inactive"}
                        </Chip>
                      </Box>
                    </Stack>
                  </Box>

                  <DialogContent sx={{ p: 3 }}>
                    <Stack spacing={3}>
                      <Box>
                        <Typography level="title-sm" sx={{ mb: 1, color: "text.tertiary" }}>
                          Personal Information
                        </Typography>
                        <Stack spacing={1.5}>
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography level="body-sm" sx={{ fontWeight: 600 }}>
                              Age:
                            </Typography>
                            <Typography level="body-sm">
                              {selectedPatient.age || "Not provided"}
                            </Typography>
                          </Box>
                          <Divider />
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography level="body-sm" sx={{ fontWeight: 600 }}>
                              Gender:
                            </Typography>
                            <Typography level="body-sm">
                              {selectedPatient.gender || "Not provided"}
                            </Typography>
                          </Box>
                          <Divider />
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography level="body-sm" sx={{ fontWeight: 600 }}>
                              Email:
                            </Typography>
                            <Typography level="body-sm">
                              {selectedPatient.email || "Not provided"}
                            </Typography>
                          </Box>
                          <Divider />
                          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                            <Typography level="body-sm" sx={{ fontWeight: 600 }}>
                              Phone:
                            </Typography>
                            <Typography level="body-sm">
                              {selectedPatient.phone || "Not provided"}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>

                      {selectedPatient.notes && (
                        <Box>
                          <Typography level="title-sm" sx={{ mb: 1, color: "text.tertiary" }}>
                            Notes
                          </Typography>
                          <Sheet variant="soft" sx={{ p: 2, borderRadius: "md" }}>
                            <Typography level="body-sm">{selectedPatient.notes}</Typography>
                          </Sheet>
                        </Box>
                      )}

                      <Box>
                        <Typography level="title-sm" sx={{ mb: 1, color: "text.tertiary" }}>
                          Quick Actions
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          <Link
                            href={`/clinician-dashboard/patients/${selectedPatient.patient_id}`}
                            style={{ textDecoration: "none", flex: 1 }}
                          >
                            <Button variant="solid" color="primary" fullWidth>
                              View Full Record
                            </Button>
                          </Link>
                          <Button
                            variant="outlined"
                            color={selectedPatient.is_active ? "warning" : "success"}
                            onClick={() => {
                              handleToggleStatus(selectedPatient);
                              setSelectedPatient(null);
                            }}
                          >
                            {selectedPatient.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </Stack>
                      </Box>
                    </Stack>
                  </DialogContent>
                </>
              )}
            </ModalDialog>
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal 
            open={deleteModalOpen} 
            onClose={() => {
              if (!deleting) {
                setDeleteModalOpen(false);
                setDeleteError(null);
              }
            }}
          >
            <ModalDialog variant="outlined" role="alertdialog" sx={{ maxWidth: 400 }}>
              <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Delete />
                Confirm Deletion
              </DialogTitle>
              <Divider />
              <DialogContent>
                {deleteError && (
                  <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
                    {deleteError}
                  </Alert>
                )}
                <Typography level="body-md">
                  Are you sure you want to delete{" "}
                  <strong>
                    {patientToDelete?.first_name} {patientToDelete?.last_name}
                  </strong>
                  ? This action cannot be undone and will remove all associated records.
                </Typography>
              </DialogContent>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="plain"
                  color="neutral"
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setDeleteError(null);
                  }}
                  disabled={deleting}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  color="danger"
                  onClick={handleDeleteConfirm}
                  loading={deleting}
                  fullWidth
                >
                  Delete
                </Button>
              </Stack>
            </ModalDialog>
          </Modal>

          {/* Bulk Delete Confirmation Modal */}
          <Modal 
            open={bulkDeleteModalOpen} 
            onClose={() => {
              if (!deleting) {
                setBulkDeleteModalOpen(false);
                setDeleteError(null);
              }
            }}
          >
            <ModalDialog variant="outlined" role="alertdialog" sx={{ maxWidth: 500 }}>
              <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DeleteSweep />
                Confirm Bulk Deletion
              </DialogTitle>
              <Divider />
              <DialogContent>
                {deleteError && (
                  <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
                    {deleteError}
                  </Alert>
                )}
                <Typography level="body-md" sx={{ mb: 2 }}>
                  Are you sure you want to delete <strong>{selectedPatients.size}</strong> selected patient{selectedPatients.size !== 1 ? 's' : ''}?
                </Typography>
                <Alert color="warning" variant="soft">
                  <Typography level="body-sm">
                    This action cannot be undone and will permanently remove all selected patients and their associated records (sessions, responses, etc.).
                  </Typography>
                </Alert>
              </DialogContent>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="plain"
                  color="neutral"
                  onClick={() => {
                    setBulkDeleteModalOpen(false);
                    setDeleteError(null);
                  }}
                  disabled={deleting}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  variant="solid"
                  color="danger"
                  onClick={handleBulkDeleteConfirm}
                  loading={deleting}
                  fullWidth
                  startDecorator={<DeleteSweep />}
                >
                  Delete {selectedPatients.size} Patient{selectedPatients.size !== 1 ? 's' : ''}
                </Button>
              </Stack>
            </ModalDialog>
          </Modal>

          {/* Patient Form Modal */}
          <PatientFormModal
            open={formModalOpen}
            onClose={() => {
              setFormModalOpen(false);
              setPatientToEdit(null);
            }}
            onSave={handleFormSave}
            patient={patientToEdit}
            clinicianId={user?.clinician_id || 0}
          />
        </Box>
      </Box>
    </AuthGuard>
  );
}
