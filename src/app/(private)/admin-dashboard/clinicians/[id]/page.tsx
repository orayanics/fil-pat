"use client";
import PrivateSidebar from "@/components/Layout/PrivateSidebar";
import { Box, Typography, Card, Grid, FormControl, FormLabel, Input, Button, CircularProgress, Alert } from "@mui/joy";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Clinician = {
  clinician_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  mobile?: string;
  address?: string;
  license_number?: string;
  specialization?: string;
  qualification?: string;
  institution?: string;
  years_of_experience?: number;
  is_admin: boolean;
  is_active: boolean;
};

export default function ClinicianDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const [clinician, setClinician] = useState<Clinician | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/clinicians/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setClinician(data.clinician);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Fetch error:", err);
        setError("Failed to fetch clinician");
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setClinician((prev) => prev ? {
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    } : prev);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch(`/api/admin/clinicians/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinician),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update clinician");
      setSuccess(true);
    } catch (err) {
      console.log("Save error:", err);
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert color="danger">{error}</Alert>;
  if (!clinician) return <Alert color="warning">Clinician not found.</Alert>;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <PrivateSidebar />
      <Box sx={{ p: 4, flex: 1 }}>
        <Typography level="h2" sx={{ mb: 2 }}>
          Edit Clinician
        </Typography>
        <Card sx={{ maxWidth: 700, mx: "auto", p: 3, boxShadow: "lg" }}>
          <form onSubmit={handleSave}>
            <Grid container spacing={2}>
              <Grid xs={6}><FormControl><FormLabel>First Name</FormLabel><Input name="first_name" value={clinician.first_name || ""} onChange={handleChange} /></FormControl></Grid>
              <Grid xs={6}><FormControl><FormLabel>Last Name</FormLabel><Input name="last_name" value={clinician.last_name || ""} onChange={handleChange} /></FormControl></Grid>
              <Grid xs={6}><FormControl><FormLabel>Email</FormLabel><Input name="email" value={clinician.email || ""} onChange={handleChange} /></FormControl></Grid>
              <Grid xs={6}><FormControl><FormLabel>Username</FormLabel><Input name="username" value={clinician.username || ""} onChange={handleChange} /></FormControl></Grid>
              <Grid xs={6}><FormControl><FormLabel>Phone</FormLabel><Input name="phone" value={clinician.phone || ""} onChange={handleChange} /></FormControl></Grid>
              <Grid xs={6}><FormControl><FormLabel>Mobile</FormLabel><Input name="mobile" value={clinician.mobile || ""} onChange={handleChange} /></FormControl></Grid>
              <Grid xs={12}><FormControl><FormLabel>Address</FormLabel><Input name="address" value={clinician.address || ""} onChange={handleChange} /></FormControl></Grid>
              <Grid xs={6}><FormControl><FormLabel>License Number</FormLabel><Input name="license_number" value={clinician.license_number || ""} onChange={handleChange} /></FormControl></Grid>
              <Grid xs={6}><FormControl><FormLabel>Specialization</FormLabel><Input name="specialization" value={clinician.specialization || ""} onChange={handleChange} /></FormControl></Grid>
              <Grid xs={6}><FormControl><FormLabel>Qualification</FormLabel><Input name="qualification" value={clinician.qualification || ""} onChange={handleChange} /></FormControl></Grid>
              <Grid xs={6}><FormControl><FormLabel>Institution</FormLabel><Input name="institution" value={clinician.institution || ""} onChange={handleChange} /></FormControl></Grid>
              <Grid xs={6}><FormControl><FormLabel>Years of Experience</FormLabel><Input name="years_of_experience" type="number" value={clinician.years_of_experience || ""} onChange={handleChange} /></FormControl></Grid>
              <Grid xs={6}><FormControl><label><input type="checkbox" name="is_admin" checked={clinician.is_admin || false} onChange={handleChange} /> Admin</label></FormControl></Grid>
              <Grid xs={6}><FormControl><label><input type="checkbox" name="is_active" checked={clinician.is_active || false} onChange={handleChange} /> Active</label></FormControl></Grid>
              <Grid xs={12}><Button type="submit" fullWidth disabled={loading} variant="solid" sx={{ mt: 2 }}>{loading ? <CircularProgress size="sm" /> : "Save Changes"}</Button></Grid>
            </Grid>
          </form>
          {error && <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>}
          {success && <Alert color="success" sx={{ mt: 2 }}>Clinician updated successfully!</Alert>}
        </Card>
      </Box>
    </Box>
  );
}
