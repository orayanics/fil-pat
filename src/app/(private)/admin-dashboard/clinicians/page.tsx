"use client";
import PrivateSidebar from "@/components/Layout/PrivateSidebar";
import AuthGuard from "@/components/auth/authGuard";
import { Box, Typography, Grid, Card, Chip, CircularProgress } from "@mui/joy";
import Link from "next/link";
import { useEffect, useState } from "react";

type Clinician = {
  clinician_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  is_active: boolean;
};

export default function CliniciansPage() {
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/clinicians/list")
      .then((res) => res.json())
      .then((data) => {
        setClinicians(data.clinicians || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Fetch error:", err);
        setError("Failed to fetch clinicians");
        setLoading(false);
      });
  }, []);

  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <PrivateSidebar />
        <Box sx={{ p: 4, flex: 1 }}>
          <Typography level="h2" sx={{ mb: 2 }}>
            Clinicians List
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Typography color="danger">{error}</Typography>
          ) : (
            <Grid container spacing={3}>
              {clinicians.map((clinician) => (
                <Grid key={clinician.clinician_id} xs={12} sm={6} md={4}>
                  <Link
                    href={`/admin-dashboard/clinicians/${clinician.clinician_id}`}
                    style={{ textDecoration: "none" }}
                  >
                    <Card
                      variant="outlined"
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        transition: "box-shadow 0.2s",
                        "&:hover": { boxShadow: "lg" },
                      }}
                    >
                      <Typography level="h4" sx={{ mb: 1 }}>
                        {clinician.first_name} {clinician.last_name}
                      </Typography>
                      <Typography level="title-md" sx={{ mb: 1 }}>
                        {clinician.email}
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1,
                          alignItems: "center",
                          flexWrap: "wrap",
                        }}
                      >
                        <Chip
                          color={clinician.is_admin ? "primary" : "neutral"}
                          variant="soft"
                        >
                          {clinician.is_admin ? "Admin" : "Clinician"}
                        </Chip>
                        <Chip
                          color={clinician.is_active ? "success" : "danger"}
                          variant="soft"
                        >
                          {clinician.is_active ? "Active" : "Inactive"}
                        </Chip>
                      </Box>
                    </Card>
                  </Link>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </AuthGuard>
  );
}
