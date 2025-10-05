"use client";
import PrivateSidebar from "@/components/Layout/PrivateSidebar";
import AuthGuard from "@/components/auth/authGuard";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Box, Typography, Card, Button, Grid, CircularProgress } from "@mui/joy";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ clinicians: number; patients: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const [clinRes, patRes] = await Promise.all([
          fetch("/api/admin/clinicians/count"),
          fetch("/api/admin/patients/count"),
        ]);
        const clinicians = await clinRes.json();
        const patients = await patRes.json();
        setStats({ clinicians: clinicians.count, patients: patients.count });
      } catch (err) {
        console.log(err);
        setError("Failed to load stats");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <PrivateSidebar />
        <Box sx={{ p: 4, flex: 1 }}>
          <Typography level="h2" sx={{ mb: 2 }}>
            Admin Dashboard
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Typography color="danger">{error}</Typography>
          ) : (
            <Grid container spacing={2}>
              <Grid xs={12} md={6}>
                <Card>
                  <Typography level="h4">Clinicians</Typography>
                  <Typography level="h1">{stats?.clinicians ?? 0}</Typography>
                  <Link href="/admin-dashboard/clinicians" passHref legacyBehavior>
                    <Button component="a" variant="soft" sx={{ mt: 2 }}>
                      Manage Clinicians
                    </Button>
                  </Link>
                </Card>
              </Grid>
              <Grid xs={12} md={6}>
                <Card>
                  <Typography level="h4">Patients</Typography>
                  <Typography level="h1">{stats?.patients ?? 0}</Typography>
                  <Link href="/admin-dashboard/patients" passHref legacyBehavior>
                    <Button component="a" variant="soft" sx={{ mt: 2 }}>
                      View Patients
                    </Button>
                  </Link>
                </Card>
              </Grid>
            </Grid>
          )}
          <Box sx={{ mt: 4 }}>
            <Link href="/admin-dashboard/add-clinician" passHref legacyBehavior>
              <Button component="a" variant="solid">
                Add New Clinician
              </Button>
            </Link>
          </Box>
        </Box>
      </Box>
    </AuthGuard>
  );
}
