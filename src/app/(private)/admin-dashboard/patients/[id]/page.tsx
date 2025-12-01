"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AuthGuard from "@/components/auth/authGuard";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  CircularProgress,
  Table,
  Sheet,
  Button,
  Breadcrumbs,
  Link as JoyLink,
} from "@mui/joy";
import {
  ArrowBack,
  Person,
  Cake,
  Phone,
  Email,
  MedicalServices,
  CheckCircle,
  PersonOff,
} from "@mui/icons-material";

interface Patient {
  patient_id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  clinician: {
    clinician_id: number;
    first_name: string;
    last_name: string;
  } | null;
}

interface Session {
  session_id: number;
  session_uuid: string;
  session_name: string;
  status: string;
  session_date: string;
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params?.id as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      fetchPatientData();
      fetchPatientSessions();
    }
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      const res = await fetch(`/api/admin/patients/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setPatient(data.patient);
      }
    } catch (error) {
      console.error("Failed to fetch patient:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientSessions = async () => {
    try {
      const res = await fetch(`/api/admin/patients/${patientId}/sessions`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "success";
      case "In Progress":
        return "primary";
      case "Scheduled":
        return "neutral";
      default:
        return "neutral";
    }
  };

  if (loading) {
    return (
      <AuthGuard adminOnly={true}>
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.level1" }}>
          <AdminSidebar />
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        </Box>
      </AuthGuard>
    );
  }

  if (!patient) {
    return (
      <AuthGuard adminOnly={true}>
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.level1" }}>
          <AdminSidebar />
          <Box sx={{ flex: 1, p: 4 }}>
            <Typography>Patient not found</Typography>
          </Box>
        </Box>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.level1" }}>
        <AdminSidebar />

        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 8, md: 4 } }}>
          <Breadcrumbs sx={{ mb: 3 }}>
            <JoyLink onClick={() => router.push("/admin-dashboard")}>Admin</JoyLink>
            <JoyLink onClick={() => router.push("/admin-dashboard/patients")}>Patients</JoyLink>
            <Typography>
              {patient.first_name} {patient.last_name}
            </Typography>
          </Breadcrumbs>

          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
            <Button variant="outlined" startDecorator={<ArrowBack />} onClick={() => router.back()}>
              Back
            </Button>
            <Box sx={{ flex: 1 }}>
              <Typography level="h2" fontWeight="bold">
                {patient.first_name} {patient.last_name}
              </Typography>
            </Box>
            <Chip
              variant="soft"
              color={patient.is_active ? "success" : "neutral"}
              startDecorator={patient.is_active ? <CheckCircle /> : <PersonOff />}
            >
              {patient.is_active ? "Active" : "Inactive"}
            </Chip>
          </Stack>

          <Stack spacing={3}>
            <Card variant="outlined">
              <CardContent>
                <Typography level="title-lg" sx={{ mb: 3 }}>
                  Personal Information
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={2}>
                    <Person sx={{ color: "text.secondary" }} />
                    <Box>
                      <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                        Full Name
                      </Typography>
                      <Typography level="title-md">
                        {patient.first_name} {patient.last_name}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={2}>
                    <Cake sx={{ color: "text.secondary" }} />
                    <Box>
                      <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                        Date of Birth
                      </Typography>
                      <Typography level="title-md">
                        {formatDate(patient.date_of_birth)} ({calculateAge(patient.date_of_birth)}{" "}
                        years old)
                      </Typography>
                    </Box>
                  </Stack>

                  {patient.gender && (
                    <Stack direction="row" spacing={2}>
                      <Person sx={{ color: "text.secondary" }} />
                      <Box>
                        <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                          Gender
                        </Typography>
                        <Typography level="title-md">{patient.gender}</Typography>
                      </Box>
                    </Stack>
                  )}

                  {patient.phone && (
                    <Stack direction="row" spacing={2}>
                      <Phone sx={{ color: "text.secondary" }} />
                      <Box>
                        <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                          Phone
                        </Typography>
                        <Typography level="title-md">{patient.phone}</Typography>
                      </Box>
                    </Stack>
                  )}

                  {patient.email && (
                    <Stack direction="row" spacing={2}>
                      <Email sx={{ color: "text.secondary" }} />
                      <Box>
                        <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                          Email
                        </Typography>
                        <Typography level="title-md">{patient.email}</Typography>
                      </Box>
                    </Stack>
                  )}

                  <Stack direction="row" spacing={2}>
                    <MedicalServices sx={{ color: "text.secondary" }} />
                    <Box>
                      <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                        Assigned Clinician
                      </Typography>
                      <Typography level="title-md">
                        {patient.clinician ? (
                          <JoyLink
                            onClick={() =>
                              router.push(
                                `/admin-dashboard/clinicians/${patient.clinician?.clinician_id}`
                              )
                            }
                            sx={{ cursor: "pointer" }}
                          >
                            {patient.clinician.first_name} {patient.clinician.last_name}
                          </JoyLink>
                        ) : (
                          "Unassigned"
                        )}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography level="title-lg" sx={{ mb: 3 }}>
                  Session History ({sessions.length})
                </Typography>
                <Sheet sx={{ overflow: "auto" }}>
                  <Table>
                    <thead>
                      <tr>
                        <th>Session Name</th>
                        <th>Date</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.length > 0 ? (
                        sessions.map((session) => (
                          <tr key={session.session_id}>
                            <td>
                              <Box>
                                <Typography level="title-sm">
                                  {session.session_name || "Untitled Session"}
                                </Typography>
                                <Typography level="body-xs" sx={{ color: "text.tertiary" }}>
                                  {session.session_uuid}
                                </Typography>
                              </Box>
                            </td>
                            <td>
                              <Typography level="body-sm">
                                {formatDate(session.session_date)}
                              </Typography>
                            </td>
                            <td>
                              <Chip
                                size="sm"
                                variant="soft"
                                color={getStatusColor(session.status)}
                              >
                                {session.status}
                              </Chip>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3}>
                            <Typography
                              level="body-sm"
                              sx={{ textAlign: "center", py: 4, color: "text.tertiary" }}
                            >
                              No sessions found
                            </Typography>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Sheet>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Box>
    </AuthGuard>
  );
}
