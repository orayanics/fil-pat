"use client";
import { useEffect, useState } from "react";
import { Box, Typography, Table, Sheet, CircularProgress } from "@mui/joy";
import PrivateSidebar from "@/components/Layout/PrivateSidebar";
import AuthGuard from "@/components/auth/authGuard";

export default function ActivityLogsPage() {
  type ActivityLog = {
    log_id: number;
    user?: { username?: string };
    user_id?: number;
    action: string;
    entity_type?: string;
    entity_id?: number;
    timestamp: string;
    success: boolean;
    description?: string;
  };
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/activity-logs/list")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Activity logs fetch error:", err);
        setError("Failed to fetch activity logs");
        setLoading(false);
      });
  }, []);

  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <PrivateSidebar />
        <Box sx={{ p: 4, flex: 1 }}>
          <Typography level="h2" sx={{ mb: 2 }}>
            Activity Logs
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
              <Table aria-label="Activity Logs Table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Time</th>
                    <th>Success</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.log_id}>
                      <td>{log.log_id}</td>
                      <td>{log.user?.username || log.user_id}</td>
                      <td>{log.action}</td>
                      <td>
                        {log.entity_type} {log.entity_id}
                      </td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.success ? "Yes" : "No"}</td>
                      <td>{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Sheet>
          )}
        </Box>
      </Box>
    </AuthGuard>
  );
}
