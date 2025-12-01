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

interface Report {
  report_id: number;
  title: string;
  report_type: string;
  patient?: { first_name: string; last_name: string };
  clinician?: { first_name: string; last_name: string };
  report_date: string;
  is_finalized: boolean;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    let filtered = [...reports];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.title?.toLowerCase().includes(term) ||
          r.report_type?.toLowerCase().includes(term) ||
          (r.patient && `${r.patient.first_name} ${r.patient.last_name}`.toLowerCase().includes(term)) ||
          (r.clinician && `${r.clinician.first_name} ${r.clinician.last_name}`.toLowerCase().includes(term))
      );
    }

    if (filterStatus === "finalized") {
      filtered = filtered.filter((r) => r.is_finalized);
    } else if (filterStatus === "draft") {
      filtered = filtered.filter((r) => !r.is_finalized);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, filterStatus]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reports/list");
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.level1" }}>
        <AdminSidebar />

        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 8, md: 4 } }}>
          <Box sx={{ mb: 4 }}>
            <Typography level="h2" fontWeight="bold" sx={{ mb: 1 }}>
              Reports Management
            </Typography>
            <Typography level="body-md" sx={{ color: "text.secondary" }}>
              View and manage all generated reports
            </Typography>
          </Box>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Input
                  placeholder="Search by title, type, patient, or clinician..."
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
                  <Option value="finalized">Finalized Only</Option>
                  <Option value="draft">Draft Only</Option>
                </Select>
              </Stack>
            </CardContent>
          </Card>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
            <Card variant="soft" color="primary" sx={{ flex: 1 }}>
              <CardContent>
                <Typography level="body-sm">Total Reports</Typography>
                <Typography level="h3">{reports.length}</Typography>
              </CardContent>
            </Card>
            <Card variant="soft" color="success" sx={{ flex: 1 }}>
              <CardContent>
                <Typography level="body-sm">Finalized</Typography>
                <Typography level="h3">
                  {reports.filter((r) => r.is_finalized).length}
                </Typography>
              </CardContent>
            </Card>
            <Card variant="soft" color="warning" sx={{ flex: 1 }}>
              <CardContent>
                <Typography level="body-sm">Drafts</Typography>
                <Typography level="h3">
                  {reports.filter((r) => !r.is_finalized).length}
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
                      <th style={{ width: "8%" }}>ID</th>
                      <th style={{ width: "22%" }}>Title</th>
                      <th style={{ width: "12%" }}>Type</th>
                      <th style={{ width: "18%" }}>Patient</th>
                      <th style={{ width: "18%" }}>Clinician</th>
                      <th style={{ width: "12%" }}>Date</th>
                      <th style={{ width: "10%" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length > 0 ? (
                      filteredReports.map((report) => (
                        <tr key={report.report_id}>
                          <td>
                            <Typography level="body-sm">{report.report_id}</Typography>
                          </td>
                          <td>
                            <Typography level="title-sm">{report.title || "Untitled"}</Typography>
                          </td>
                          <td>
                            <Typography level="body-sm">{report.report_type}</Typography>
                          </td>
                          <td>
                            <Typography level="body-sm">
                              {report.patient
                                ? `${report.patient.first_name} ${report.patient.last_name}`
                                : "—"}
                            </Typography>
                          </td>
                          <td>
                            <Typography level="body-sm">
                              {report.clinician
                                ? `${report.clinician.first_name} ${report.clinician.last_name}`
                                : "—"}
                            </Typography>
                          </td>
                          <td>
                            <Typography level="body-sm">
                              {formatDate(report.report_date)}
                            </Typography>
                          </td>
                          <td>
                            <Chip
                              size="sm"
                              variant="soft"
                              color={report.is_finalized ? "success" : "warning"}
                            >
                              {report.is_finalized ? "Finalized" : "Draft"}
                            </Chip>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7}>
                          <Typography
                            level="body-sm"
                            sx={{ textAlign: "center", py: 4, color: "text.tertiary" }}
                          >
                            No reports found
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
