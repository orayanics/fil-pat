"use client";
import { useState, useEffect } from "react";
import {
  Modal,
  ModalDialog,
  ModalClose,
  DialogTitle,
  DialogContent,
  Stack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Option,
  Button,
  Alert,
  Divider,
  Typography,
  Grid,
  Box,
} from "@mui/joy";
import { Save, Person } from "@mui/icons-material";

type PatientFormData = {
  // Personal Information
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  
  // Guardian Information
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;
  
  // Medical Information
  medical_history?: string;
  allergies?: string;
  medications?: string;
  special_needs?: string;
  preferred_language?: string;
  
  // Additional Information
  notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
};

type Patient = {
  patient_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state_province?: string;
  postal_code?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
  guardian_relationship?: string;
  medical_history?: string;
  allergies?: string;
  medications?: string;
  special_needs?: string;
  preferred_language?: string;
  notes?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

type PatientFormModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  patient?: Patient | null;
  clinicianId: number;
};

export default function PatientFormModal({
  open,
  onClose,
  onSave,
  patient,
  clinicianId,
}: PatientFormModalProps) {
  const [formData, setFormData] = useState<PatientFormData>({
    first_name: "",
    last_name: "",
    middle_name: "",
    date_of_birth: "",
    gender: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state_province: "",
    postal_code: "",
    guardian_name: "",
    guardian_phone: "",
    guardian_email: "",
    guardian_relationship: "",
    medical_history: "",
    allergies: "",
    medications: "",
    special_needs: "",
    preferred_language: "Filipino",
    notes: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (patient) {
      setFormData({
        first_name: patient.first_name || "",
        last_name: patient.last_name || "",
        middle_name: patient.middle_name || "",
        date_of_birth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : "",
        gender: patient.gender || "",
        phone: patient.phone || "",
        email: patient.email || "",
        address: patient.address || "",
        city: patient.city || "",
        state_province: patient.state_province || "",
        postal_code: patient.postal_code || "",
        guardian_name: patient.guardian_name || "",
        guardian_phone: patient.guardian_phone || "",
        guardian_email: patient.guardian_email || "",
        guardian_relationship: patient.guardian_relationship || "",
        medical_history: patient.medical_history || "",
        allergies: patient.allergies || "",
        medications: patient.medications || "",
        special_needs: patient.special_needs || "",
        preferred_language: patient.preferred_language || "Filipino",
        notes: patient.notes || "",
        emergency_contact_name: patient.emergency_contact_name || "",
        emergency_contact_phone: patient.emergency_contact_phone || "",
      });
    } else {
      // Reset form for new patient
      setFormData({
        first_name: "",
        last_name: "",
        middle_name: "",
        date_of_birth: "",
        gender: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        state_province: "",
        postal_code: "",
        guardian_name: "",
        guardian_phone: "",
        guardian_email: "",
        guardian_relationship: "",
        medical_history: "",
        allergies: "",
        medications: "",
        special_needs: "",
        preferred_language: "Filipino",
        notes: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
      });
    }
    setError(null);
    setSuccess(false);
  }, [patient, open]);

  const handleChange = (field: keyof PatientFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = patient
        ? `/api/clinician/patients/${patient.patient_id}`
        : `/api/clinician/patients/create`;

      const method = patient ? "PUT" : "POST";

      const body = patient
        ? formData
        : { ...formData, assigned_clinician_id: clinicianId };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          onSave();
          onClose();
        }, 1000);
      } else {
        setError(data.error || "Failed to save patient");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError("Network error: Failed to save patient");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalDialog sx={{ maxWidth: 900, maxHeight: "90vh", overflow: "auto" }}>
        <ModalClose />
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Person />
          {patient ? "Edit Patient Details" : "Add New Patient"}
        </DialogTitle>
        <Divider />

        <DialogContent>
          {error && (
            <Alert color="danger" variant="soft" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert color="success" variant="soft" sx={{ mb: 2 }}>
              Patient saved successfully!
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {/* Personal Information */}
              <Box>
                <Typography level="title-md" sx={{ mb: 2, color: "primary.500" }}>
                  Personal Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid xs={12} sm={4}>
                    <FormControl required>
                      <FormLabel>First Name</FormLabel>
                      <Input
                        value={formData.first_name}
                        onChange={(e) => handleChange("first_name", e.target.value)}
                        placeholder="Juan"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={4}>
                    <FormControl>
                      <FormLabel>Middle Name</FormLabel>
                      <Input
                        value={formData.middle_name}
                        onChange={(e) => handleChange("middle_name", e.target.value)}
                        placeholder="Reyes"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={4}>
                    <FormControl required>
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        value={formData.last_name}
                        onChange={(e) => handleChange("last_name", e.target.value)}
                        placeholder="Dela Cruz"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <FormControl required>
                      <FormLabel>Date of Birth</FormLabel>
                      <Input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleChange("date_of_birth", e.target.value)}
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <FormControl>
                      <FormLabel>Gender</FormLabel>
                      <Select
                        value={formData.gender}
                        onChange={(_, value) => handleChange("gender", value || "")}
                        placeholder="Select gender"
                      >
                        <Option value="Male">Male</Option>
                        <Option value="Female">Female</Option>
                        <Option value="Other">Other</Option>
                        <Option value="Prefer not to say">Prefer not to say</Option>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <FormControl>
                      <FormLabel>Email</FormLabel>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                        placeholder="juan@example.com"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <FormControl>
                      <FormLabel>Phone</FormLabel>
                      <Input
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                        placeholder="+63 912 345 6789"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12}>
                    <FormControl>
                      <FormLabel>Address</FormLabel>
                      <Input
                        value={formData.address}
                        onChange={(e) => handleChange("address", e.target.value)}
                        placeholder="123 Main St."
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={4}>
                    <FormControl>
                      <FormLabel>City</FormLabel>
                      <Input
                        value={formData.city}
                        onChange={(e) => handleChange("city", e.target.value)}
                        placeholder="Manila"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={4}>
                    <FormControl>
                      <FormLabel>State/Province</FormLabel>
                      <Input
                        value={formData.state_province}
                        onChange={(e) => handleChange("state_province", e.target.value)}
                        placeholder="Metro Manila"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={4}>
                    <FormControl>
                      <FormLabel>Postal Code</FormLabel>
                      <Input
                        value={formData.postal_code}
                        onChange={(e) => handleChange("postal_code", e.target.value)}
                        placeholder="1000"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12}>
                    <FormControl>
                      <FormLabel>Preferred Language</FormLabel>
                      <Select
                        value={formData.preferred_language}
                        onChange={(_, value) => handleChange("preferred_language", value || "Filipino")}
                      >
                        <Option value="Filipino">Filipino</Option>
                        <Option value="English">English</Option>
                        <Option value="Tagalog">Tagalog</Option>
                        <Option value="Cebuano">Cebuano</Option>
                        <Option value="Ilocano">Ilocano</Option>
                        <Option value="Other">Other</Option>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Guardian Information */}
              <Box>
                <Typography level="title-md" sx={{ mb: 2, color: "primary.500" }}>
                  Guardian Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <FormControl>
                      <FormLabel>Guardian Name</FormLabel>
                      <Input
                        value={formData.guardian_name}
                        onChange={(e) => handleChange("guardian_name", e.target.value)}
                        placeholder="Maria Dela Cruz"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <FormControl>
                      <FormLabel>Relationship</FormLabel>
                      <Input
                        value={formData.guardian_relationship}
                        onChange={(e) => handleChange("guardian_relationship", e.target.value)}
                        placeholder="Mother, Father, etc."
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <FormControl>
                      <FormLabel>Guardian Phone</FormLabel>
                      <Input
                        value={formData.guardian_phone}
                        onChange={(e) => handleChange("guardian_phone", e.target.value)}
                        placeholder="+63 912 345 6789"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <FormControl>
                      <FormLabel>Guardian Email</FormLabel>
                      <Input
                        type="email"
                        value={formData.guardian_email}
                        onChange={(e) => handleChange("guardian_email", e.target.value)}
                        placeholder="guardian@example.com"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Medical Information */}
              <Box>
                <Typography level="title-md" sx={{ mb: 2, color: "primary.500" }}>
                  Medical Information
                </Typography>
                <Stack spacing={2}>
                  <FormControl>
                    <FormLabel>Medical History</FormLabel>
                    <Textarea
                      minRows={2}
                      value={formData.medical_history}
                      onChange={(e) => handleChange("medical_history", e.target.value)}
                      placeholder="Any relevant medical conditions, past diagnoses..."
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Allergies</FormLabel>
                    <Textarea
                      minRows={2}
                      value={formData.allergies}
                      onChange={(e) => handleChange("allergies", e.target.value)}
                      placeholder="Any known allergies..."
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Current Medications</FormLabel>
                    <Textarea
                      minRows={2}
                      value={formData.medications}
                      onChange={(e) => handleChange("medications", e.target.value)}
                      placeholder="List current medications..."
                    />
                  </FormControl>
                  <FormControl>
                    <FormLabel>Special Needs</FormLabel>
                    <Textarea
                      minRows={2}
                      value={formData.special_needs}
                      onChange={(e) => handleChange("special_needs", e.target.value)}
                      placeholder="Any special accommodations or needs..."
                    />
                  </FormControl>
                </Stack>
              </Box>

              <Divider />

              {/* Emergency Contact */}
              <Box>
                <Typography level="title-md" sx={{ mb: 2, color: "primary.500" }}>
                  Emergency Contact
                </Typography>
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <FormControl>
                      <FormLabel>Emergency Contact Name</FormLabel>
                      <Input
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleChange("emergency_contact_name", e.target.value)}
                        placeholder="Full name"
                      />
                    </FormControl>
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <FormControl>
                      <FormLabel>Emergency Contact Phone</FormLabel>
                      <Input
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleChange("emergency_contact_phone", e.target.value)}
                        placeholder="+63 912 345 6789"
                      />
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              <Divider />

              {/* Additional Notes */}
              <FormControl>
                <FormLabel>Additional Notes</FormLabel>
                <Textarea
                  minRows={3}
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  placeholder="Any additional information about the patient..."
                />
              </FormControl>

              {/* Actions */}
              <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
                <Button
                  variant="plain"
                  color="neutral"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="solid"
                  color="primary"
                  loading={loading}
                  startDecorator={<Save />}
                >
                  {patient ? "Update Patient" : "Create Patient"}
                </Button>
              </Stack>
            </Stack>
          </form>
        </DialogContent>
      </ModalDialog>
    </Modal>
  );
}
