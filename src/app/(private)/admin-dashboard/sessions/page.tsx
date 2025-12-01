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
  Input,
  Select,
  Option,
  Stack,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/joy";
import { Search } from "@mui/icons-material";

interface Session {
  session_id: number;
  session_uuid: string;
  session_name: string;
  status: string;
  session_date: string;
  clinician: {
    first_name: string;
    last_name: string;
  };
  patient: {
    first_name: string;
    last_name: string;
  } | null;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    let filtered = [...sessions];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.session_name?.toLowerCase().includes(term) ||
          s.session_uuid.toLowerCase().includes(term) ||
          `${s.clinician.first_name} ${s.clinician.last_name}`.toLowerCase().includes(term)
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((s) => s.status === filterStatus);
    }

    setFilteredSessions(filtered);
  }, [sessions, searchTerm, filterStatus]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/sessions/list");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
      case "Cancelled":
        return "danger";
      default:
        return "neutral";
    }
  };

  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.level1" }}>
        <AdminSidebar />

        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 8, md: 4 } }}>
          <Box sx={{ mb: 4 }}>
            <Typography level="h2" fontWeight="bold" sx={{ mb: 1 }}>
              Sessions Management
            </Typography>
            <Typography level="body-md" sx={{ color: "text.secondary" }}>
              View and monitor all assessment sessions
            </Typography>
          </Box>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Input
                  placeholder="Search by session name, ID, or clinician..."
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
                  <Option value="Scheduled">Scheduled</Option>
                  <Option value="In Progress">In Progress</Option>
                  <Option value="Completed">Completed</Option>
                  <Option value="Cancelled">Cancelled</Option>
                </Select>
              </Stack>
            </CardContent>
          </Card>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
            <Card variant="soft" color="primary" sx={{ flex: 1 }}>
              <CardContent>
                <Typography level="body-sm">Total Sessions</Typography>
                <Typography level="h3">{sessions.length}</Typography>
              </CardContent>
            </Card>
            <Card variant="soft" color="success" sx={{ flex: 1 }}>
              <CardContent>
                <Typography level="body-sm">Completed</Typography>
                <Typography level="h3">
                  {sessions.filter((s) => s.status === "Completed").length}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="soft" color="warning" sx={{ flex: 1 }}>
              <CardContent>
                <Typography level="body-sm">In Progress</Typography>
                <Typography level="h3">
                  {sessions.filter((s) => s.status === "In Progress").length}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="soft" color="neutral" sx={{ flex: 1 }}>
              <CardContent>
                <Typography level="body-sm">Scheduled</Typography>
                <Typography level="h3">
                  {sessions.filter((s) => s.status === "Scheduled").length}
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
                <Table sx={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th style={{ width: "25%" }}>Session Name</th>
                      <th style={{ width: "20%" }}>Clinician</th>
                      <th style={{ width: "20%" }}>Patient</th>
                      <th style={{ width: "20%" }}>Date</th>
                      <th style={{ width: "15%" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.length > 0 ? (
                      filteredSessions.map((session) => (
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
                              {session.clinician.first_name} {session.clinician.last_name}
                            </Typography>
                          </td>
                          <td>
                            <Typography level="body-sm">
                              {session.patient
                                ? `${session.patient.first_name} ${session.patient.last_name}`
                                : "—"}
                            </Typography>
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
                        <td colSpan={5}>
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
              )}
            </Sheet>
          </Card>
        </Box>
      </Box>
    </AuthGuard>
  );
}
