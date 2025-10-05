"use client";
import { useEffect, useState } from "react";
import { Box, Typography, Table, Sheet, CircularProgress } from "@mui/joy";
import PrivateSidebar from "@/components/Layout/PrivateSidebar";

export default function ReportsPage() {
  type Report = {
    report_id: number;
    title: string;
    report_type: string;
    patient?: { first_name: string; last_name: string };
    clinician?: { first_name: string; last_name: string };
    report_date: string;
    is_finalized: boolean;
  };
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/reports/list")
      .then((res) => res.json())
      .then((data) => {
        setReports(data.reports || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Reports fetch error:", err);
        setError("Failed to fetch reports");
        setLoading(false);
      });
  }, []);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <PrivateSidebar />
      <Box sx={{ p: 4, flex: 1 }}>
        <Typography level="h2" sx={{ mb: 2 }}>
          Reports
        </Typography>
        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="danger">{error}</Typography>
        ) : (
          <Sheet
            variant="outlined"
            sx={{
              width: "100%",
              overflow: "auto",
              borderRadius: "sm",
              padding: 2,
            }}
          >
            <Table aria-label="Reports Table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Patient</th>
                  <th>Clinician</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.report_id}>
                    <td>{report.report_id}</td>
                    <td>{report.title}</td>
                    <td>{report.report_type}</td>
                    <td>
                      {report.patient?.first_name} {report.patient?.last_name}
                    </td>
                    <td>
                      {report.clinician?.first_name} {report.clinician?.last_name}
                    </td>
                    <td>{new Date(report.report_date).toLocaleDateString()}</td>
                    <td>{report.is_finalized ? "Finalized" : "Draft"}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Sheet>
        )}
      </Box>
    </Box>
  );
}
