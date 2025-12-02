"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AuthGuard from "@/components/auth/authGuard";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  Sheet,
  Chip,
  IconButton,
  Input,
  Select,
  Option,
  Stack,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/joy";
import {
  Search,
  Visibility,
  CheckCircle,
  PersonOff,
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  is_active: boolean;
  created_at: string;
  assigned_clinician: {
    first_name: string;
    last_name: string;
  } | null;
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    let filtered = [...patients];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.first_name.toLowerCase().includes(term) ||
          p.last_name.toLowerCase().includes(term)
      );
    }

    if (filterStatus === "active") {
      filtered = filtered.filter((p) => p.is_active);
    } else if (filterStatus === "inactive") {
      filtered = filtered.filter((p) => !p.is_active);
    }

    setFilteredPatients(filtered);
  }, [patients, searchTerm, filterStatus]);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/patients/list");
      const data = await res.json();
      setPatients(data.patients || []);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateString: string) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.level1" }}>
        <AdminSidebar />

        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 8, md: 4 } }}>
          <Box sx={{ mb: 4 }}>
            <Typography level="h2" fontWeight="bold" sx={{ mb: 1 }}>
              Patients Management
            </Typography>
            <Typography level="body-md" sx={{ color: "text.secondary" }}>
              View and manage all patients in the system
            </Typography>
          </Box>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Input
                  placeholder="Search by name..."
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
                </Select>
              </Stack>
            </CardContent>
          </Card>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
            <Card variant="soft" color="primary" sx={{ flex: 1 }}>
              <CardContent>
                <Typography level="body-sm">Total Patients</Typography>
                <Typography level="h3">{patients.length}</Typography>
              </CardContent>
            </Card>
            <Card variant="soft" color="success" sx={{ flex: 1 }}>
              <CardContent>
                <Typography level="body-sm">Active</Typography>
                <Typography level="h3">
                  {patients.filter((p) => p.is_active).length}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="soft" color="warning" sx={{ flex: 1 }}>
              <CardContent>
                <Typography level="body-sm">Inactive</Typography>
                <Typography level="h3">
                  {patients.filter((p) => !p.is_active).length}
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
                      <th style={{ width: "15%" }}>Age</th>
                      <th style={{ width: "10%" }}>Gender</th>
                      <th style={{ width: "25%" }}>Assigned Clinician</th>
                      <th style={{ width: "15%" }}>Status</th>
                      <th style={{ width: "10%", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <tr key={patient.patient_id}>
                          <td>
                            <Typography level="title-sm">
                              {patient.first_name} {patient.last_name}
                            </Typography>
                          </td>
                          <td>
                            <Typography level="body-sm">
                              {calculateAge(patient.date_of_birth)} years
                            </Typography>
                          </td>
                          <td>
                            <Typography level="body-sm">
                              {patient.gender || "—"}
                            </Typography>
                          </td>
                          <td>
                            <Typography level="body-sm">
                              {patient.assigned_clinician
                                ? `${patient.assigned_clinician.first_name} ${patient.assigned_clinician.last_name}`
                                : "Unassigned"}
                            </Typography>
                          </td>
                          <td>
                            <Chip
                              size="sm"
                              variant="soft"
                              color={patient.is_active ? "success" : "neutral"}
                              startDecorator={
                                patient.is_active ? <CheckCircle /> : <PersonOff />
                              }
                            >
                              {patient.is_active ? "Active" : "Inactive"}
                            </Chip>
                          </td>
                          <td>
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <IconButton
                                size="sm"
                                variant="soft"
                                color="primary"
                                onClick={() =>
                                  router.push(
                                    `/admin-dashboard/patients/${patient.patient_id}`
                                  )
                                }
                              >
                                <Visibility />
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
                            No patients found
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
    </AuthGuard>
  );
}
