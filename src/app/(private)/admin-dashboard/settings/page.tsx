"use client";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AuthGuard from "@/components/auth/authGuard";
import { useState, useEffect } from "react";
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
  Grid,
} from "@mui/joy";
import { Save, Person } from "@mui/icons-material";
import { useSocketContext } from "@/context/SocketProvider";

export default function AdminSettingsPage() {
  const { user } = useSocketContext();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/clinician/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/clinician/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setFormData((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to change password");
      }
    } catch (err) {
      console.error("Failed to change password:", err);
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard adminOnly={true}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.level1" }}>
        <AdminSidebar />

        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: 8, md: 4 } }}>
          <Box sx={{ mb: 4 }}>
            <Typography level="h2" fontWeight="bold" sx={{ mb: 1 }}>
              Admin Settings
            </Typography>
            <Typography level="body-md" sx={{ color: "text.secondary" }}>
              Manage your admin account settings and preferences
            </Typography>
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
                <Typography color="success">Settings updated successfully!</Typography>
              </CardContent>
            </Card>
          )}

          <Grid container spacing={3}>
            <Grid xs={12} md={6}>
              <Card variant="outlined">
                <form onSubmit={handleSaveProfile}>
                  <CardContent>
                    <Typography level="title-lg" startDecorator={<Person />} sx={{ mb: 2 }}>
                      Profile Information
                    </Typography>
                    <Stack spacing={2}>
                      <FormControl>
                        <FormLabel>First Name</FormLabel>
                        <Input
                          value={formData.first_name}
                          onChange={(e) => handleChange("first_name", e.target.value)}
                          required
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Last Name</FormLabel>
                        <Input
                          value={formData.last_name}
                          onChange={(e) => handleChange("last_name", e.target.value)}
                          required
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange("email", e.target.value)}
                          required
                        />
                      </FormControl>
                      <Button type="submit" loading={loading} startDecorator={<Save />}>
                        Save Profile
                      </Button>
                    </Stack>
                  </CardContent>
                </form>
              </Card>
            </Grid>

            <Grid xs={12} md={6}>
              <Card variant="outlined">
                <form onSubmit={handleChangePassword}>
                  <CardContent>
                    <Typography level="title-lg" sx={{ mb: 2 }}>
                      Change Password
                    </Typography>
                    <Stack spacing={2}>
                      <FormControl>
                        <FormLabel>Current Password</FormLabel>
                        <Input
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => handleChange("currentPassword", e.target.value)}
                          required
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>New Password</FormLabel>
                        <Input
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => handleChange("newPassword", e.target.value)}
                          required
                        />
                      </FormControl>
                      <FormControl>
                        <FormLabel>Confirm New Password</FormLabel>
                        <Input
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleChange("confirmPassword", e.target.value)}
                          required
                        />
                      </FormControl>
                      <Button type="submit" loading={loading} color="warning">
                        Change Password
                      </Button>
                    </Stack>
                  </CardContent>
                </form>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </AuthGuard>
  );
}
