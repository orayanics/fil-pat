"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import {
  Box,
  Card,
  Typography,
  Stack,
  Divider,
  Input,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Alert,
  Avatar,
  Grid,
  Switch,
  Chip,
} from "@mui/joy";
import {
  Person,
  Email,
  Phone,
  Badge,
  Lock,
  Save,
  PhotoCamera,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";
import PrivateSidebar from "@/components/Layout/PrivateSidebar";
import AuthGuard from "@/components/auth/authGuard";
import { useSocketContext } from "@/context/SocketProvider";

interface ClinicianSettings {
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string;
  license_number: string;
  specialization: string;
  qualification: string;
  address: string;
  city: string;
  state_province: string;
  postal_code: string;
  years_of_experience: number;
  is_active: boolean;
  profile_picture_path: string;
}

interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SettingsPage() {
  const { user, refreshUser } = useSocketContext();
  const [settings, setSettings] = useState<ClinicianSettings>({
    first_name: "",
    last_name: "",
    middle_name: "",
    email: "",
    phone: "",
    license_number: "",
    specialization: "",
    qualification: "",
    address: "",
    city: "",
    state_province: "",
    postal_code: "",
    years_of_experience: 0,
    is_active: true,
    profile_picture_path: "",
  });
  
  const [passwordData, setPasswordData] = useState<PasswordChange>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState<{ type: 'success' | 'danger', text: string } | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoRemoving, setPhotoRemoving] = useState(false);
  const currentPhoto = photoPreview || (settings.profile_picture_path ? settings.profile_picture_path : null);

  useEffect(() => {
    if (user?.clinician_id) {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/clinician/settings', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Ensure all string fields are never null, use empty string instead
        setSettings({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          middle_name: data.middle_name || "",
          email: data.email || "",
          phone: data.phone || "",
          license_number: data.license_number || "",
          specialization: data.specialization || "",
          qualification: data.qualification || "",
          address: data.address || "",
          city: data.city || "",
          state_province: data.state_province || "",
          postal_code: data.postal_code || "",
          years_of_experience: data.years_of_experience || 0,
          is_active: data.is_active !== undefined ? data.is_active : true,
          profile_picture_path: data.profile_picture_path || "",
        });
        setPhotoPreview(data.profile_picture_path || null);
        setPendingPhoto(null);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch('/api/clinician/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const updatedData = await response.json();
        
        // Ensure all string fields are never null, use empty string instead
        const sanitizedData = {
          first_name: updatedData.first_name || "",
          last_name: updatedData.last_name || "",
          middle_name: updatedData.middle_name || "",
          email: updatedData.email || "",
          phone: updatedData.phone || "",
          license_number: updatedData.license_number || "",
          specialization: updatedData.specialization || "",
          qualification: updatedData.qualification || "",
          address: updatedData.address || "",
          city: updatedData.city || "",
          state_province: updatedData.state_province || "",
          postal_code: updatedData.postal_code || "",
          years_of_experience: updatedData.years_of_experience || 0,
          is_active: updatedData.is_active !== undefined ? updatedData.is_active : true,
          profile_picture_path: updatedData.profile_picture_path || "",
        };
        
        setSettings(sanitizedData);
        setPhotoPreview((prev) => {
          if (pendingPhoto) {
            return prev;
          }
          return updatedData.profile_picture_path || null;
        });
        
        // Update user context immediately - this will cause dashboard to re-render
        const refreshedUser = await refreshUser();
        console.log('User refreshed after settings update:', refreshedUser);
        
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setTimeout(() => setMessage(null), 5000);
      } else {
        const error = await response.json();
        setMessage({ type: 'danger', text: error.message || 'Failed to update profile' });
      }
    } catch (err) {
      console.error('Failed to save settings:', err);
      setMessage({ type: 'danger', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelected = (event: ChangeEvent<HTMLInputElement>) => {
    setPhotoMessage(null);
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoMessage({ type: 'danger', text: 'Please choose a valid image file' });
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setPhotoMessage({ type: 'danger', text: 'Image must be 2MB or smaller' });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhotoPreview(base64);
      setPendingPhoto(base64);
    };
    reader.readAsDataURL(file);

    // Allow selecting the same file again
    event.target.value = "";
  };

  const handleUploadPhoto = async () => {
    if (!pendingPhoto) {
      setPhotoMessage({ type: 'danger', text: 'Please choose a photo first' });
      return;
    }

    setPhotoUploading(true);
    setPhotoMessage(null);
    try {
      const response = await fetch('/api/clinician/profile-picture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageData: pendingPhoto }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings((prev) => ({
          ...prev,
          profile_picture_path: data.profile_picture_path || "",
        }));
        setPhotoPreview(data.profile_picture_path || null);
        setPendingPhoto(null);
        await refreshUser();
        setPhotoMessage({ type: 'success', text: 'Profile photo updated successfully!' });
        setTimeout(() => setPhotoMessage(null), 5000);
      } else {
        const error = await response.json().catch(() => null);
        setPhotoMessage({ type: 'danger', text: error?.error || 'Failed to upload photo' });
      }
    } catch (err) {
      console.error('Failed to upload profile photo:', err);
      setPhotoMessage({ type: 'danger', text: 'An error occurred while uploading' });
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (pendingPhoto) {
      setPendingPhoto(null);
      setPhotoPreview(settings.profile_picture_path ? settings.profile_picture_path : null);
      return;
    }

    if (!settings.profile_picture_path) {
      return;
    }

    setPhotoRemoving(true);
    setPhotoMessage(null);
    try {
      const response = await fetch('/api/clinician/profile-picture', {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSettings((prev) => ({ ...prev, profile_picture_path: "" }));
        setPhotoPreview(null);
        setPendingPhoto(null);
        await refreshUser();
        setPhotoMessage({ type: 'success', text: 'Profile photo removed' });
        setTimeout(() => setPhotoMessage(null), 5000);
      } else {
        const error = await response.json().catch(() => null);
        setPhotoMessage({ type: 'danger', text: error?.error || 'Failed to remove photo' });
      }
    } catch (err) {
      console.error('Failed to remove profile photo:', err);
      setPhotoMessage({ type: 'danger', text: 'An error occurred while removing' });
    } finally {
      setPhotoRemoving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'danger', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordMessage({ type: 'danger', text: 'Password must be at least 8 characters' });
      return;
    }

    setSavingPassword(true);
    try {
      const response = await fetch('/api/clinician/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordMessage(null), 5000);
      } else {
        const error = await response.json();
        setPasswordMessage({ type: 'danger', text: error.message || 'Failed to change password' });
      }
    } catch (err) {
      console.error('Failed to change password:', err);
      setPasswordMessage({ type: 'danger', text: 'An error occurred' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Loading settings...</Typography>
      </Box>
    );
  }

  return (
    <AuthGuard>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <PrivateSidebar />
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 }, pt: { xs: '72px', sm: 4 }, maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <Stack spacing={1} sx={{ mb: 4 }}>
            <Typography level="h2">Settings</Typography>
            <Typography level="body-sm" sx={{ color: 'text.secondary' }}>
              Manage your account settings and preferences
            </Typography>
          </Stack>

      {/* Success/Error Message */}
      {message && (
        <Alert
          color={message.type}
          startDecorator={message.type === 'success' ? <CheckCircle /> : <ErrorIcon />}
          sx={{ mb: 3 }}
        >
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid xs={12} lg={8}>
          <Card variant="outlined" sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography level="title-lg" startDecorator={<Person />}>
                  Profile Information
                </Typography>
                <Chip color={settings.is_active ? 'success' : 'neutral'} size="sm">
                  {settings.is_active ? 'Active' : 'Inactive'}
                </Chip>
              </Stack>
              <Divider />

              {/* Name Fields */}
              <Grid container spacing={2}>
                <Grid xs={12} sm={4}>
                  <FormControl>
                    <FormLabel>First Name</FormLabel>
                    <Input
                      value={settings.first_name}
                      onChange={(e) => setSettings({ ...settings, first_name: e.target.value })}
                      placeholder="John"
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={4}>
                  <FormControl>
                    <FormLabel>Middle Name</FormLabel>
                    <Input
                      value={settings.middle_name}
                      onChange={(e) => setSettings({ ...settings, middle_name: e.target.value })}
                      placeholder="Optional"
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={4}>
                  <FormControl>
                    <FormLabel>Last Name</FormLabel>
                    <Input
                      value={settings.last_name}
                      onChange={(e) => setSettings({ ...settings, last_name: e.target.value })}
                      placeholder="Doe"
                    />
                  </FormControl>
                </Grid>
              </Grid>

              {/* Contact Information */}
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <FormControl>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={settings.email}
                      onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                      placeholder="email@example.com"
                      startDecorator={<Email />}
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl>
                    <FormLabel>Phone</FormLabel>
                    <Input
                      value={settings.phone}
                      onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                      placeholder="+63 912 345 6789"
                      startDecorator={<Phone />}
                    />
                  </FormControl>
                </Grid>
              </Grid>

              {/* Professional Information */}
              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <FormControl>
                    <FormLabel>License Number</FormLabel>
                    <Input
                      value={settings.license_number}
                      onChange={(e) => setSettings({ ...settings, license_number: e.target.value })}
                      placeholder="LIC-123456"
                      startDecorator={<Badge />}
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl>
                    <FormLabel>Specialization</FormLabel>
                    <Input
                      value={settings.specialization}
                      onChange={(e) => setSettings({ ...settings, specialization: e.target.value })}
                      placeholder="Speech-Language Pathology"
                    />
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <FormControl>
                    <FormLabel>Qualification / Status</FormLabel>
                    <Input
                      value={settings.qualification}
                      onChange={(e) => setSettings({ ...settings, qualification: e.target.value })}
                      placeholder="Licensed / Intern / Student"
                    />
                    <FormHelperText>e.g., Licensed Professional, Intern, Graduate Student</FormHelperText>
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={6}>
                  <FormControl>
                    <FormLabel>Years of Experience</FormLabel>
                    <Input
                      type="number"
                      value={settings.years_of_experience}
                      onChange={(e) => setSettings({ ...settings, years_of_experience: parseInt(e.target.value) || 0 })}
                      placeholder="5"
                    />
                  </FormControl>
                </Grid>
              </Grid>

              {/* Address */}
              <Divider>Address</Divider>
              <FormControl>
                <FormLabel>Street Address</FormLabel>
                <Input
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="123 Main Street"
                />
              </FormControl>

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <FormControl>
                    <FormLabel>City</FormLabel>
                    <Input
                      value={settings.city}
                      onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                      placeholder="Manila"
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={3}>
                  <FormControl>
                    <FormLabel>Province/State</FormLabel>
                    <Input
                      value={settings.state_province}
                      onChange={(e) => setSettings({ ...settings, state_province: e.target.value })}
                      placeholder="Metro Manila"
                    />
                  </FormControl>
                </Grid>
                <Grid xs={12} sm={3}>
                  <FormControl>
                    <FormLabel>Postal Code</FormLabel>
                    <Input
                      value={settings.postal_code}
                      onChange={(e) => setSettings({ ...settings, postal_code: e.target.value })}
                      placeholder="1000"
                    />
                  </FormControl>
                </Grid>
              </Grid>

              {/* Save Button */}
              <Button
                variant="solid"
                color="primary"
                startDecorator={<Save />}
                onClick={handleSaveProfile}
                loading={saving}
                sx={{ mt: 2 }}
              >
                Save Profile Changes
              </Button>
            </Stack>
          </Card>
        </Grid>

        {/* Sidebar - Profile Picture & Password */}
        <Grid xs={12} lg={4}>
          <Stack spacing={3}>
            {/* Profile Picture Card */}
            <Card variant="outlined" sx={{ p: 3 }}>
              <Stack spacing={2} alignItems="center" sx={{ width: '100%' }}>
                <Typography level="title-md">Profile Picture</Typography>
                <Avatar
                  src={currentPhoto || undefined}
                  sx={{ width: 120, height: 120 }}
                >
                  {settings.first_name?.[0]}{settings.last_name?.[0]}
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handlePhotoSelected}
                />
                {photoMessage && (
                  <Alert
                    color={photoMessage.type}
                    size="sm"
                    startDecorator={photoMessage.type === 'success' ? <CheckCircle /> : <ErrorIcon />}
                    sx={{ width: '100%' }}
                  >
                    {photoMessage.text}
                  </Alert>
                )}
                <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center" sx={{ width: '100%' }}>
                  <Button
                    variant="outlined"
                    size="sm"
                    startDecorator={<PhotoCamera />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {pendingPhoto ? 'Choose Another Photo' : 'Choose Photo'}
                  </Button>
                  <Button
                    variant="solid"
                    size="sm"
                    onClick={handleUploadPhoto}
                    disabled={!pendingPhoto || photoUploading}
                    loading={photoUploading}
                  >
                    Save Photo
                  </Button>
                  <Button
                    variant="plain"
                    size="sm"
                    color="danger"
                    onClick={handleRemovePhoto}
                    disabled={!currentPhoto || photoRemoving}
                    loading={photoRemoving}
                  >
                    {pendingPhoto ? 'Clear Selection' : 'Remove'}
                  </Button>
                </Stack>
                <Typography level="body-xs" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                  Recommended: Square image, at least 400x400px (max 2MB)
                </Typography>
              </Stack>
            </Card>

            {/* Change Password Card */}
            <Card variant="outlined" sx={{ p: 3 }}>
              <Stack spacing={3}>
                <Typography level="title-md" startDecorator={<Lock />}>
                  Change Password
                </Typography>
                <Divider />

                {passwordMessage && (
                  <Alert
                    color={passwordMessage.type}
                    size="sm"
                    startDecorator={passwordMessage.type === 'success' ? <CheckCircle /> : <ErrorIcon />}
                  >
                    {passwordMessage.text}
                  </Alert>
                )}

                <FormControl>
                  <FormLabel>Current Password</FormLabel>
                  <Input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>New Password</FormLabel>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Enter new password"
                  />
                  <FormHelperText>At least 8 characters</FormHelperText>
                </FormControl>

                <FormControl>
                  <FormLabel>Confirm New Password</FormLabel>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </FormControl>

                <Button
                  variant="solid"
                  color="primary"
                  onClick={handleChangePassword}
                  loading={savingPassword}
                  disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                >
                  Change Password
                </Button>
              </Stack>
            </Card>

            {/* Account Status */}
            <Card variant="outlined" sx={{ p: 3 }}>
              <Stack spacing={2}>
                <Typography level="title-md">Account Status</Typography>
                <Divider />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack spacing={0.5}>
                    <Typography level="body-sm" fontWeight={600}>Active Status</Typography>
                    <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                      {settings.is_active ? 'Your account is active' : 'Your account is inactive'}
                    </Typography>
                  </Stack>
                  <Switch
                    checked={settings.is_active}
                    onChange={(e) => setSettings({ ...settings, is_active: e.target.checked })}
                    color={settings.is_active ? 'success' : 'neutral'}
                  />
                </Stack>
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>
        </Box>
      </Box>
    </AuthGuard>
  );
}
