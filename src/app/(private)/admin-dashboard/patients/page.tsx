"use client";
import PrivateSidebar from "@/components/Layout/PrivateSidebar";
import AuthGuard from "@/components/auth/authGuard";
import { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, Chip, CircularProgress } from "@mui/joy";
import Link from "next/link";

export default function PatientsPage() {
  type Patient = {
    patient_id: number;
    first_name: string;
    last_name: string;
    email?: string;
    is_active: boolean;
  };
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/patients/list")
      .then((res) => res.json())
      .then((data) => {
        setPatients(data.patients || []);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Patients fetch error:", err);
        setError("Failed to fetch patients");
        setLoading(false);
      });
  }, []);
  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <PrivateSidebar />
        <Box sx={{ p: 4, flex: 1 }}>
          <Typography level="h2" sx={{ mb: 2 }}>
            Patients List
          </Typography>
          {loading ? (
            <CircularProgress />
          ) : error ? (
            <Typography color="danger">{error}</Typography>
          ) : (
            <Grid container spacing={3}>
              {patients.map((patient) => (
                <Grid key={patient.patient_id} xs={12} sm={6} md={4}>
                  <Link
                    href={`/admin-dashboard/patients/${patient.patient_id}`}
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
                        {patient.first_name} {patient.last_name}
                      </Typography>
                      <Typography level="title-md" sx={{ mb: 1 }}>
                        {patient.email}
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
                          color={patient.is_active ? "success" : "danger"}
                          variant="soft"
                        >
                          {patient.is_active ? "Active" : "Inactive"}
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
