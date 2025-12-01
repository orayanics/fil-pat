"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import StatsCard from "@/components/admin/StatsCard";
import AuthGuard from "@/components/auth/authGuard";
import { useEffect, useState } from "react";
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  CircularProgress,
  Table,
  Sheet,
  Button,
  Stack
} from "@mui/joy";
import { 
  People, 
  AccessibleForward, 
  Assessment, 
  Schedule
} from "@mui/icons-material";
import { useRouter } from "next/navigation";

interface DashboardStats {
  totalClinicians: number;
  activeClinicians: number;
  totalPatients: number;
  activePatients: number;
  totalSessions: number;
  completedSessions: number;
  scheduledSessions: number;
  clinicianTrend: number;
  patientTrend: number;
  sessionTrend: number;
}

interface RecentActivity {
  log_id: number;
  action: string;
  description: string | null;
  timestamp: string;
  user_name?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/activity-logs/recent"),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setRecentActivity(activityData.logs || []);
        }
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.level1" }}>
        <AdminSidebar />
        
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 8, md: 4 } }}>
          {/* Header */}
          <Box sx={{ mb: 4 }}>
            <Typography level="h2" fontWeight="bold" sx={{ mb: 1 }}>
              Dashboard Overview
            </Typography>
            <Typography level="body-md" sx={{ color: "text.secondary", mb: 4 }}>
              Welcome back! Here&apos;s what&apos;s happening with your system.
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Card color="danger" variant="soft">
              <CardContent>
                <Typography color="danger">{error}</Typography>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Grid */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid xs={12} sm={6} md={3}>
                  <StatsCard
                    title="Total Clinicians"
                    value={stats?.totalClinicians || 0}
                    icon={<People sx={{ fontSize: 28 }} />}
                    color="primary"
                    subtitle={`${stats?.activeClinicians || 0} active`}
                    trend={stats?.clinicianTrend ? {
                      value: stats.clinicianTrend,
                      isPositive: stats.clinicianTrend > 0
                    } : undefined}
                  />
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                  <StatsCard
                    title="Total Patients"
                    value={stats?.totalPatients || 0}
                    icon={<AccessibleForward sx={{ fontSize: 28 }} />}
                    color="success"
                    subtitle={`${stats?.activePatients || 0} active`}
                    trend={stats?.patientTrend ? {
                      value: stats.patientTrend,
                      isPositive: stats.patientTrend > 0
                    } : undefined}
                  />
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                  <StatsCard
                    title="Total Sessions"
                    value={stats?.totalSessions || 0}
                    icon={<Assessment sx={{ fontSize: 28 }} />}
                    color="warning"
                    subtitle={`${stats?.completedSessions || 0} completed`}
                    trend={stats?.sessionTrend ? {
                      value: stats.sessionTrend,
                      isPositive: stats.sessionTrend > 0
                    } : undefined}
                  />
                </Grid>
                <Grid xs={12} sm={6} md={3}>
                  <StatsCard
                    title="Scheduled"
                    value={stats?.scheduledSessions || 0}
                    icon={<Schedule sx={{ fontSize: 28 }} />}
                    color="neutral"
                    subtitle="Upcoming sessions"
                  />
                </Grid>
              </Grid>

              {/* Quick Actions */}
              <Card variant="outlined" sx={{ mb: 4 }}>
                <CardContent>
                  <Typography level="title-lg" sx={{ mb: 2 }}>
                    Quick Actions
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <Button 
                      variant="solid" 
                      color="primary"
                      onClick={() => router.push("/admin-dashboard/clinicians/add")}
                    >
                      Add Clinician
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="neutral"
                      onClick={() => router.push("/admin-dashboard/clinicians")}
                    >
                      Manage Clinicians
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="neutral"
                      onClick={() => router.push("/admin-dashboard/reports")}
                    >
                      View Reports
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="neutral"
                      onClick={() => router.push("/admin-dashboard/activity-logs")}
                    >
                      Activity Logs
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Typography level="title-lg">Recent Activity</Typography>
                    <Button 
                      variant="plain" 
                      size="sm"
                      onClick={() => router.push("/admin-dashboard/activity-logs")}
                    >
                      View All
                    </Button>
                  </Box>
                  
                  <Sheet variant="outlined" sx={{ borderRadius: "sm", overflow: "auto" }}>
                    <Table>
                      <thead>
                        <tr>
                          <th style={{ width: "30%" }}>Action</th>
                          <th style={{ width: "50%" }}>Description</th>
                          <th style={{ width: "20%" }}>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentActivity.length > 0 ? (
                          recentActivity.slice(0, 10).map((activity) => (
                            <tr key={activity.log_id}>
                              <td>
                                <Typography level="body-sm" fontWeight="md">
                                  {activity.action.replace(/_/g, " ").toUpperCase()}
                                </Typography>
                              </td>
                              <td>
                                <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                                  {activity.description || "—"}
                                </Typography>
                              </td>
                              <td>
                                <Typography level="body-xs" sx={{ color: "text.tertiary" }}>
                                  {formatDate(activity.timestamp)}
                                </Typography>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3}>
                              <Typography level="body-sm" sx={{ textAlign: "center", py: 2, color: "text.tertiary" }}>
                                No recent activity
                              </Typography>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </Sheet>
                </CardContent>
              </Card>
            </>
          )}
        </Box>
      </Box>
    </AuthGuard>
  );
}
