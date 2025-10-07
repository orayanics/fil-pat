"use client";
import PrivateSidebar from "@/components/Layout/PrivateSidebar";
import AuthGuard from "@/components/auth/authGuard";
import { Box, Typography, Card, Button, Grid, FormControl, FormLabel, Input, Alert, CircularProgress } from "@mui/joy";
import { useState } from "react";
export default function Page() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    date_of_birth: "",
    age: "",
    gender: "",
    phone: "",
    mobile: "",
    address: "",
    city: "",
    state_province: "",
    postal_code: "",
    country: "Philippines",
    license_number: "",
    license_expiry_date: "",
    specialization: "",
    qualification: "",
    years_of_experience: "",
    institution: "",
    is_admin: false,
    is_active: true,
    profile_picture_path: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/admin/clinicians/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add clinician");
      setSuccess(true);
      setForm({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        middle_name: "",
        date_of_birth: "",
        age: "",
        gender: "",
        phone: "",
        mobile: "",
        address: "",
        city: "",
        state_province: "",
        postal_code: "",
        country: "Philippines",
        license_number: "",
        license_expiry_date: "",
        specialization: "",
        qualification: "",
        years_of_experience: "",
        institution: "",
        is_admin: false,
        is_active: true,
        profile_picture_path: ""
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <PrivateSidebar />
        <Box sx={{ p: 4, flex: 1 }}>
          <Typography level="h2" sx={{ mb: 2 }}>
            Add New Clinician
          </Typography>
          <Card sx={{ maxWidth: 700, mx: "auto", p: 3, boxShadow: "lg" }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Account Section */}
                <Grid xs={12}><FormLabel sx={{ fontWeight: "bold", fontSize: 18 }}>Account Info</FormLabel></Grid>
                <Grid xs={6}><FormControl required><FormLabel>Username</FormLabel><Input name="username" value={form.username} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={6}><FormControl required><FormLabel>Email</FormLabel><Input name="email" type="email" value={form.email} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={6}><FormControl required><FormLabel>Password</FormLabel><Input name="password" type="password" value={form.password} onChange={handleChange} /></FormControl></Grid>
                {/* Personal Section */}
                <Grid xs={12}><FormLabel sx={{ fontWeight: "bold", fontSize: 18, mt: 2 }}>Personal Info</FormLabel></Grid>
                <Grid xs={4}><FormControl required><FormLabel>First Name</FormLabel><Input name="first_name" value={form.first_name} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={4}><FormControl required><FormLabel>Last Name</FormLabel><Input name="last_name" value={form.last_name} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={4}><FormControl><FormLabel>Middle Name</FormLabel><Input name="middle_name" value={form.middle_name} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={4}><FormControl><FormLabel>Date of Birth</FormLabel><Input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={4}><FormControl><FormLabel>Age</FormLabel><Input name="age" type="number" value={form.age} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={4}><FormControl><FormLabel>Gender</FormLabel><Input name="gender" value={form.gender} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={6}><FormControl><FormLabel>Phone</FormLabel><Input name="phone" value={form.phone} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={6}><FormControl><FormLabel>Mobile</FormLabel><Input name="mobile" value={form.mobile} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={12}><FormControl><FormLabel>Address</FormLabel><Input name="address" value={form.address} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={4}><FormControl><FormLabel>City</FormLabel><Input name="city" value={form.city} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={4}><FormControl><FormLabel>State/Province</FormLabel><Input name="state_province" value={form.state_province} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={4}><FormControl><FormLabel>Postal Code</FormLabel><Input name="postal_code" value={form.postal_code} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={12}><FormControl><FormLabel>Country</FormLabel><Input name="country" value={form.country} onChange={handleChange} /></FormControl></Grid>
                {/* Professional Section */}
                <Grid xs={12}><FormLabel sx={{ fontWeight: "bold", fontSize: 18, mt: 2 }}>Professional Info</FormLabel></Grid>
                <Grid xs={6}><FormControl><FormLabel>License Number</FormLabel><Input name="license_number" value={form.license_number} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={6}><FormControl><FormLabel>License Expiry Date</FormLabel><Input name="license_expiry_date" type="date" value={form.license_expiry_date} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={6}><FormControl><FormLabel>Specialization</FormLabel><Input name="specialization" value={form.specialization} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={6}><FormControl><FormLabel>Qualification</FormLabel><Input name="qualification" value={form.qualification} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={6}><FormControl><FormLabel>Years of Experience</FormLabel><Input name="years_of_experience" type="number" value={form.years_of_experience} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={6}><FormControl><FormLabel>Institution</FormLabel><Input name="institution" value={form.institution} onChange={handleChange} /></FormControl></Grid>
                {/* System Section */}
                <Grid xs={12}><FormLabel sx={{ fontWeight: "bold", fontSize: 18, mt: 2 }}>System Info</FormLabel></Grid>
                <Grid xs={6}><FormControl><FormLabel>Profile Picture Path</FormLabel><Input name="profile_picture_path" value={form.profile_picture_path} onChange={handleChange} /></FormControl></Grid>
                <Grid xs={3}><FormControl><label><input type="checkbox" name="is_admin" checked={form.is_admin} onChange={handleChange} /> Admin</label></FormControl></Grid>
                <Grid xs={3}><FormControl><label><input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} /> Active</label></FormControl></Grid>
                <Grid xs={12}><Button type="submit" fullWidth disabled={loading} variant="solid" sx={{ mt: 2 }}>{loading ? <CircularProgress size="sm" /> : "Add Clinician"}</Button></Grid>
              </Grid>
            </form>
            {error && <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>}
            {success && <Alert color="success" sx={{ mt: 2 }}>Clinician added successfully!</Alert>}
          </Card>
        </Box>
      </Box>
    </AuthGuard>
  );
}
