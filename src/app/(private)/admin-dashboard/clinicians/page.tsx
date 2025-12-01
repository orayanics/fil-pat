"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AuthGuard from "@/components/auth/authGuard";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  Sheet,
  Chip,
  IconButton,
  Input,
  Select,
  Option,
  Modal,
  ModalDialog,
  ModalClose,
  Stack,
  CircularProgress,
  Card,
  CardContent,
  Divider,
} from "@mui/joy";
import {
  Add,
  Edit,
  Delete,
  Search,
  PersonOff,
  CheckCircle,
  Visibility,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface Clinician {
  clinician_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  specialization: string | null;
  qualification: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export default function CliniciansPage() {
  const router = useRouter();
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [filteredClinicians, setFilteredClinicians] = useState<Clinician[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedClinician, setSelectedClinician] = useState<Clinician | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchClinicians();
  }, []);

  useEffect(() => {
    filterClinicians();
  }, [clinicians, searchTerm, filterStatus]);

  const fetchClinicians = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/clinicians/list");
      const data = await res.json();
      setClinicians(data.clinicians || []);
    } catch (error) {
      console.error("Failed to fetch clinicians:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterClinicians = () => {
    let filtered = [...clinicians];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.first_name.toLowerCase().includes(term) ||
          c.last_name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.username.toLowerCase().includes(term)
      );
    }

    if (filterStatus === "active") {
      filtered = filtered.filter((c) => c.is_active);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((c) => !c.is_active);
    } else if (filterStatus === "admin") {
      filtered = filtered.filter((c) => c.is_admin);
    }

    setFilteredClinicians(filtered);
  };

  const handleToggleStatus = async (clinician: Clinician) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/clinicians/${clinician.clinician_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !clinician.is_active }),
      });

      if (res.ok) {
        fetchClinicians();
      }
    } catch (error) {
      console.error("Failed to toggle status:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClinician = async () => {
    if (!selectedClinician) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/clinicians/${selectedClinician.clinician_id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDeleteModalOpen(false);
        setSelectedClinician(null);
        fetchClinicians();
      }
    } catch (error) {
      console.error("Failed to delete clinician:", error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.level1" }}>
        <AdminSidebar />

        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 8, md: 4 } }}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography level="h2" fontWeight="bold" sx={{ mb: 1 }}>
                  Clinicians Management
                </Typography>
                <Typography level="body-md" sx={{ color: "text.secondary" }}>
                  Manage all clinicians and their permissions
                </Typography>
              </Box>
              <Button
                startDecorator={<Add />}
                onClick={() => router.push("/admin-dashboard/clinicians/add")}
              >
                Add Clinician
              </Button>
            </Box>
          </Box>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Input
                  placeholder="Search by name, email, or username..."
                  startDecorator={<Search />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Select
                  value={filterStatus}
                  onChange={(_, value) => setFilterStatus(value as string)}
                  sx={{ minWidth: 200 }}
                >
                  <Option value="all">All Status</Option>
                  <Option value="active">Active Only</Option>
                  <Option value="inactive">Inactive Only</Option>
                  <Option value="admin">Admins Only</Option>
                </Select>
              </Stack>
            </CardContent>
          </Card>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
            <Card variant="soft" color="primary" sx={{ flex: 1 }}>
              <CardContent>
                <Typography level="body-sm">Total Clinicians</Typography>
                <Typography level="h3">{clinicians.length}</Typography>
              </CardContent>
            </Card>
            <Card variant="soft" color="success" sx={{ flex: 1 }}>
              <CardContent>
                <Typography level="body-sm">Active</Typography>
                <Typography level="h3">
                  {clinicians.filter((c) => c.is_active).length}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="soft" color="warning" sx={{ flex: 1 }}>
              <CardContent>
                <Typography level="body-sm">Inactive</Typography>
                <Typography level="h3">
                  {clinicians.filter((c) => !c.is_active).length}
                </Typography>
              </CardContent>
            </Card>
          </Stack>

          <Card variant="outlined">
            <Sheet sx={{ overflow: "auto" }}>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Table sx={{ minWidth: 800 }}>
                  <thead>
                    <tr>
                      <th style={{ width: "25%" }}>Name</th>
                      <th style={{ width: "20%" }}>Email</th>
                      <th style={{ width: "15%" }}>Specialization</th>
                      <th style={{ width: "15%" }}>Status</th>
                      <th style={{ width: "10%" }}>Role</th>
                      <th style={{ width: "15%", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClinicians.length > 0 ? (
                      filteredClinicians.map((clinician) => (
                        <tr key={clinician.clinician_id}>
                          <td>
                            <Box>
                              <Typography level="title-sm">
                                {clinician.first_name} {clinician.last_name}
                              </Typography>
                              <Typography level="body-xs" sx={{ color: "text.tertiary" }}>
                                @{clinician.username}
                              </Typography>
                            </Box>
                          </td>
                          <td>
                            <Typography level="body-sm">{clinician.email}</Typography>
                          </td>
                          <td>
                            <Typography level="body-sm">
                              {clinician.specialization || "—"}
                            </Typography>
                          </td>
                          <td>
                            <Chip
                              size="sm"
                              variant="soft"
                              color={clinician.is_active ? "success" : "neutral"}
                              startDecorator={
                                clinician.is_active ? <CheckCircle /> : <PersonOff />
                              }
                            >
                              {clinician.is_active ? "Active" : "Inactive"}
                            </Chip>
                          </td>
                          <td>
                            {clinician.is_admin ? (
                              <Chip size="sm" color="primary" variant="solid">
                                Admin
                              </Chip>
                            ) : (
                              <Chip size="sm" variant="outlined">
                                Clinician
                              </Chip>
                            )}
                          </td>
                          <td>
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <IconButton
                                size="sm"
                                variant="soft"
                                color="primary"
                                onClick={() =>
                                  router.push(
                                    `/admin-dashboard/clinicians/${clinician.clinician_id}`
                                  )
                                }
                              >
                                <Visibility />
                              </IconButton>
                              <IconButton
                                size="sm"
                                variant="soft"
                                color="neutral"
                                onClick={() =>
                                  router.push(
                                    `/admin-dashboard/clinicians/${clinician.clinician_id}/edit`
                                  )
                                }
                              >
                                <Edit />
                              </IconButton>
                              <IconButton
                                size="sm"
                                variant="soft"
                                color={clinician.is_active ? "warning" : "success"}
                                onClick={() => handleToggleStatus(clinician)}
                                disabled={actionLoading}
                              >
                                {clinician.is_active ? <PersonOff /> : <CheckCircle />}
                              </IconButton>
                              <IconButton
                                size="sm"
                                variant="soft"
                                color="danger"
                                onClick={() => {
                                  setSelectedClinician(clinician);
                                  setDeleteModalOpen(true);
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </Stack>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6}>
                          <Typography
                            level="body-sm"
                            sx={{ textAlign: "center", py: 4, color: "text.tertiary" }}
                          >
                            No clinicians found
                          </Typography>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              )}
            </Sheet>
          </Card>
        </Box>
      </Box>

      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <ModalDialog variant="outlined" role="alertdialog">
          <ModalClose />
          <Typography level="h4">Confirm Deletion</Typography>
          <Divider />
          <Typography level="body-md">
            Are you sure you want to delete{" "}
            <strong>
              {selectedClinician?.first_name} {selectedClinician?.last_name}
            </strong>
            ? This action cannot be undone.
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="solid"
              color="danger"
              onClick={handleDeleteClinician}
              loading={actionLoading}
              sx={{ flex: 1 }}
            >
              Delete
            </Button>
            <Button
              variant="outlined"
              color="neutral"
              onClick={() => setDeleteModalOpen(false)}
              sx={{ flex: 1 }}
            >
              Cancel
            </Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </AuthGuard>
  );
}
