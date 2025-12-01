"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AuthGuard from "@/components/auth/authGuard";
import { useState } from "react";
import {
  Box,
  Typography,
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Card,
  CardContent,
  Divider,
  Switch,
  Grid,
  Breadcrumbs,
  Link as JoyLink,
} from "@mui/joy";
import { ArrowBack, Save } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AddClinicianPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
    middle_name: "",
    phone: "",
    specialization: "",
    qualification: "",
    license_number: "",
    is_admin: false,
    is_active: true,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/clinicians/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.first_name,
          last_name: formData.last_name,
          middle_name: formData.middle_name || null,
          phone: formData.phone || null,
          specialization: formData.specialization || null,
          qualification: formData.qualification || null,
          license_number: formData.license_number || null,
          is_admin: formData.is_admin,
          is_active: formData.is_active,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/admin-dashboard/clinicians");
        }, 1500);
      } else {
        setError(data.error || "Failed to create clinician");
      }
    } catch (err) {
      console.error("Failed to create clinician:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.level1" }}>
        <AdminSidebar />

        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 8, md: 4 } }}>
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link href="/admin-dashboard" passHref legacyBehavior>
              <JoyLink>Dashboard</JoyLink>
            </Link>
            <Link href="/admin-dashboard/clinicians" passHref legacyBehavior>
              <JoyLink>Clinicians</JoyLink>
            </Link>
            <Typography>Add New</Typography>
          </Breadcrumbs>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Box>
              <Typography level="h2" fontWeight="bold" sx={{ mb: 1 }}>
                Add New Clinician
              </Typography>
              <Typography level="body-md" sx={{ color: "text.secondary" }}>
                Create a new clinician account
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startDecorator={<ArrowBack />}
              onClick={() => router.back()}
            >
              Back
            </Button>
          </Box>

          {error && (
            <Card color="danger" variant="soft" sx={{ mb: 3 }}>
              <CardContent>
                <Typography color="danger">{error}</Typography>
              </CardContent>
            </Card>
          )}

          {success && (
            <Card color="success" variant="soft" sx={{ mb: 3 }}>
              <CardContent>
                <Typography color="success">
                  Clinician created successfully! Redirecting...
                </Typography>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit}>
            <Card variant="outlined">
              <CardContent>
                <Typography level="title-lg" sx={{ mb: 2 }}>
                  Account Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid xs={12} md={6}>
                    <FormControl required>
                      <FormLabel>Username</FormLabel>
                      <Input
                        value={formData.username}
                        onChange={(e) => handleChange("username", e.target.value)}
                        placeholder="Enter username"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={6}>
                    <FormControl required>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="Enter email"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={6}>
                    <FormControl required>
                      <FormLabel>Password</FormLabel>
                      <Input
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                        placeholder="Enter password"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={6}>
                    <FormControl required>
                      <FormLabel>Confirm Password</FormLabel>
                      <Input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                        placeholder="Confirm password"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>

              <Divider />

              <CardContent>
                <Typography level="title-lg" sx={{ mb: 2 }}>
                  Personal Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid xs={12} md={4}>
                    <FormControl required>
                      <FormLabel>First Name</FormLabel>
                      <Input
                        value={formData.first_name}
                        onChange={(e) => handleChange("first_name", e.target.value)}
                        placeholder="Enter first name"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={4}>
                    <FormControl>
                      <FormLabel>Middle Name</FormLabel>
                      <Input
                        value={formData.middle_name}
                        onChange={(e) => handleChange("middle_name", e.target.value)}
                        placeholder="Enter middle name"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={4}>
                    <FormControl required>
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        value={formData.last_name}
                        onChange={(e) => handleChange("last_name", e.target.value)}
                        placeholder="Enter last name"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={6}>
                    <FormControl>
                      <FormLabel>Phone</FormLabel>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>

              <Divider />

              <CardContent>
                <Typography level="title-lg" sx={{ mb: 2 }}>
                  Professional Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid xs={12} md={6}>
                    <FormControl>
                      <FormLabel>Specialization</FormLabel>
                      <Input
                        value={formData.specialization}
                        onChange={(e) => handleChange("specialization", e.target.value)}
                        placeholder="e.g., Speech-Language Pathology"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={6}>
                    <FormControl>
                      <FormLabel>Qualification</FormLabel>
                      <Input
                        value={formData.qualification}
                        onChange={(e) => handleChange("qualification", e.target.value)}
                        placeholder="e.g., Licensed / Intern / Student"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} md={6}>
                    <FormControl>
                      <FormLabel>License Number</FormLabel>
                      <Input
                        value={formData.license_number}
                        onChange={(e) => handleChange("license_number", e.target.value)}
                        placeholder="Enter license number"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>

              <Divider />

              <CardContent>
                <Typography level="title-lg" sx={{ mb: 2 }}>
                  Permissions
                </Typography>
                <Stack spacing={2}>
                  <FormControl orientation="horizontal" sx={{ justifyContent: "space-between" }}>
                    <Box>
                      <FormLabel>Administrator Access</FormLabel>
                      <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                        Grant full admin privileges to this user
                      </Typography>
                    </Box>
                    <Switch
                      checked={formData.is_admin}
                      onChange={(e) => handleChange("is_admin", e.target.checked)}
                    />
                  </FormControl>
                  <FormControl orientation="horizontal" sx={{ justifyContent: "space-between" }}>
                    <Box>
                      <FormLabel>Active Status</FormLabel>
                      <Typography level="body-sm" sx={{ color: "text.tertiary" }}>
                        Allow this user to log in and access the system
                      </Typography>
                    </Box>
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => handleChange("is_active", e.target.checked)}
                    />
                  </FormControl>
                </Stack>
              </CardContent>

              <Divider />

              <CardContent>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button variant="outlined" onClick={() => router.back()}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    startDecorator={<Save />}
                  >
                    Create Clinician
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </form>
        </Box>
      </Box>
    </AuthGuard>
  );
}
