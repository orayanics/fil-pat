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

interface ActivityLog {
  log_id: number;
  action: string;
  description: string;
  user_id: number | null;
  timestamp: string;
  user: {
    first_name: string;
    last_name: string;
  } | null;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm, filterType]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/activity-logs/all");
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterLogs = () => {
    let filtered = [...logs];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.description?.toLowerCase().includes(term) ||
          (log.user && `${log.user.first_name} ${log.user.last_name}`
            .toLowerCase()
            .includes(term))
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((log) => log.action === filterType);
    }

    setFilteredLogs(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "login":
        return "success";
      case "logout":
        return "neutral";
      case "session_create":
      case "patient_create":
        return "primary";
      case "session_update":
      case "patient_update":
        return "warning";
      case "session_delete":
      case "patient_delete":
        return "danger";
      default:
        return "neutral";
    }
  };

  const activityTypes = [
    ...new Set(logs.map((log) => log.action)),
  ];

  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.level1" }}>
        <AdminSidebar />

        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 8, md: 4 } }}>
          <Box sx={{ mb: 4 }}>
            <Typography level="h2" fontWeight="bold" sx={{ mb: 1 }}>
              Activity Logs
            </Typography>
            <Typography level="body-md" sx={{ color: "text.secondary" }}>
              Monitor all system activities and user actions
            </Typography>
          </Box>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Input
                  placeholder="Search activities..."
                  startDecorator={<Search />}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <Select
                  value={filterType}
                  onChange={(_, value) => setFilterType(value as string)}
                  sx={{ minWidth: 200 }}
                >
                  <Option value="all">All Types</Option>
                  {activityTypes.map((type) => (
                    <Option key={type} value={type}>
                      {type.replace("_", " ").toUpperCase()}
                    </Option>
                  ))}
                </Select>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Card variant="soft" color="primary" sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography level="body-sm">Total Activities</Typography>
                    <Typography level="h3">{logs.length}</Typography>
                  </CardContent>
                </Card>
                <Card variant="soft" color="success" sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography level="body-sm">Today</Typography>
                    <Typography level="h3">
                      {
                        logs.filter(
                          (log) =>
                            new Date(log.timestamp).toDateString() ===
                            new Date().toDateString()
                        ).length
                      }
                    </Typography>
                  </CardContent>
                </Card>
                <Card variant="soft" color="neutral" sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography level="body-sm">This Week</Typography>
                    <Typography level="h3">
                      {
                        logs.filter((log) => {
                          const logDate = new Date(log.timestamp);
                          const weekAgo = new Date();
                          weekAgo.setDate(weekAgo.getDate() - 7);
                          return logDate >= weekAgo;
                        }).length
                      }
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            </CardContent>
          </Card>

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
                      <th style={{ width: "20%" }}>Date & Time</th>
                      <th style={{ width: "20%" }}>User</th>
                      <th style={{ width: "15%" }}>Activity Type</th>
                      <th style={{ width: "45%" }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => (
                        <tr key={log.log_id}>
                          <td>
                            <Typography level="body-sm">
                              {formatDate(log.timestamp)}
                            </Typography>
                          </td>
                          <td>
                            <Typography level="body-sm">
                              {log.user
                                ? `${log.user.first_name} ${log.user.last_name}`
                                : "System"}
                            </Typography>
                          </td>
                          <td>
                            <Chip
                              size="sm"
                              variant="soft"
                              color={getActivityColor(log.action)}
                            >
                              {log.action.replace("_", " ")}
                            </Chip>
                          </td>
                          <td>
                            <Typography level="body-sm">{log.description || "—"}</Typography>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4}>
                          <Typography
                            level="body-sm"
                            sx={{ textAlign: "center", py: 4, color: "text.tertiary" }}
                          >
                            No activity logs found
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
