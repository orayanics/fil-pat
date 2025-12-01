"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AuthGuard from "@/components/auth/authGuard";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Card,
  CardContent,
  FormControl,
  FormLabel,
  Input,
  Button,
  Stack,
  Switch,
  CircularProgress,
  Breadcrumbs,
  Link as JoyLink,
  Divider,
  Grid,
} from "@mui/joy";
import { ArrowBack, Save } from "@mui/icons-material";

interface Clinician {
  clinician_id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  license_number: string | null;
  specialization: string | null;
  is_admin: boolean;
  is_active: boolean;
}

export default function EditClinicianPage() {
  const params = useParams();
  const router = useRouter();
  const clinicianId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    license_number: "",
    specialization: "",
    is_admin: false,
    is_active: true,
  });

  useEffect(() => {
    if (clinicianId) {
      fetchClinician();
    }
  }, [clinicianId]);

  const fetchClinician = async () => {
    try {
      const res = await fetch(`/api/admin/clinicians/${clinicianId}`);
      if (res.ok) {
        const data = await res.json();
        const clinician: Clinician = data.clinician;
        setFormData({
          username: clinician.username,
          first_name: clinician.first_name,
          last_name: clinician.last_name,
          email: clinician.email,
          phone: clinician.phone || "",
          license_number: clinician.license_number || "",
          specialization: clinician.specialization || "",
          is_admin: clinician.is_admin,
          is_active: clinician.is_active,
        });
      } else {
        setError("Failed to load clinician");
      }
    } catch (err) {
      console.error("Failed to fetch clinician:", err);
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/clinicians/${clinicianId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/admin-dashboard/clinicians/${clinicianId}`);
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update clinician");
      }
    } catch (err) {
      console.error("Failed to update clinician:", err);
      setError("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard adminOnly={true}>
        <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.level1" }}>
          <AdminSidebar />
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CircularProgress />
          </Box>
        </Box>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.level1" }}>
        <AdminSidebar />

        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 8, md: 4 } }}>
          <Breadcrumbs sx={{ mb: 3 }}>
            <JoyLink onClick={() => router.push("/admin-dashboard")}>Admin</JoyLink>
            <JoyLink onClick={() => router.push("/admin-dashboard/clinicians")}>
              Clinicians
            </JoyLink>
            <JoyLink onClick={() => router.push(`/admin-dashboard/clinicians/${clinicianId}`)}>
              {formData.first_name} {formData.last_name}
            </JoyLink>
            <Typography>Edit</Typography>
          </Breadcrumbs>

          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
            <Button
              variant="outlined"
              startDecorator={<ArrowBack />}
              onClick={() => router.back()}
            >
              Back
            </Button>
            <Box sx={{ flex: 1 }}>
              <Typography level="h2" fontWeight="bold">
                Edit Clinician
              </Typography>
            </Box>
          </Stack>

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
                  Clinician updated successfully! Redirecting...
                </Typography>
              </CardContent>
            </Card>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography level="title-lg" sx={{ mb: 3 }}>
                    Account Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid xs={12} md={6}>
                      <FormControl required>
                        <FormLabel>Username</FormLabel>
                        <Input
                          value={formData.username}
                          onChange={(e) => handleChange("username", e.target.value)}
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
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography level="title-lg" sx={{ mb: 3 }}>
                    Personal Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid xs={12} md={6}>
                      <FormControl required>
                        <FormLabel>First Name</FormLabel>
                        <Input
                          value={formData.first_name}
                          onChange={(e) => handleChange("first_name", e.target.value)}
                        />
                      </FormControl>
                    </Grid>
                    <Grid xs={12} md={6}>
                      <FormControl required>
                        <FormLabel>Last Name</FormLabel>
                        <Input
                          value={formData.last_name}
                          onChange={(e) => handleChange("last_name", e.target.value)}
                        />
                      </FormControl>
                    </Grid>
                    <Grid xs={12} md={6}>
                      <FormControl>
                        <FormLabel>Phone</FormLabel>
                        <Input
                          value={formData.phone}
                          onChange={(e) => handleChange("phone", e.target.value)}
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography level="title-lg" sx={{ mb: 3 }}>
                    Professional Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid xs={12} md={6}>
                      <FormControl>
                        <FormLabel>License Number</FormLabel>
                        <Input
                          value={formData.license_number}
                          onChange={(e) => handleChange("license_number", e.target.value)}
                        />
                      </FormControl>
                    </Grid>
                    <Grid xs={12} md={6}>
                      <FormControl>
                        <FormLabel>Specialization</FormLabel>
                        <Input
                          value={formData.specialization}
                          onChange={(e) => handleChange("specialization", e.target.value)}
                        />
                      </FormControl>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography level="title-lg" sx={{ mb: 3 }}>
                    Permissions & Status
                  </Typography>
                  <Stack spacing={2}>
                    <FormControl orientation="horizontal" sx={{ justifyContent: "space-between" }}>
                      <Box>
                        <FormLabel>Administrator</FormLabel>
                        <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                          Grant full administrative access
                        </Typography>
                      </Box>
                      <Switch
                        checked={formData.is_admin}
                        onChange={(e) => handleChange("is_admin", e.target.checked)}
                      />
                    </FormControl>
                    <Divider />
                    <FormControl orientation="horizontal" sx={{ justifyContent: "space-between" }}>
                      <Box>
                        <FormLabel>Active Status</FormLabel>
                        <Typography level="body-sm" sx={{ color: "text.secondary" }}>
                          Disable to prevent login
                        </Typography>
                      </Box>
                      <Switch
                        checked={formData.is_active}
                        onChange={(e) => handleChange("is_active", e.target.checked)}
                      />
                    </FormControl>
                  </Stack>
                </CardContent>
              </Card>

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving} startDecorator={<Save />}>
                  Save Changes
                </Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Box>
    </AuthGuard>
  );
}
