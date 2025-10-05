"use client";
import { Box, Checkbox, Sheet, Table as TableM } from "@mui/joy";
import { useEffect, useState } from "react";
type Clinician = {
  clinician_id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_admin: boolean;
  is_active: boolean;
};

type Patient = {
  patient_id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
};

export default function Table() {
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("clinician");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setIsAdmin(!!parsed.is_admin);
      } catch {}
    }
    fetch("/api/admin/clinicians/list")
      .then((res) => res.json())
      .then((data) => setClinicians(data.clinicians || []));
    fetch("/api/admin/patients/list")
      .then((res) => res.json())
      .then((data) => setPatients(data.patients || []));
  }, []);

  if (!isAdmin) return null;

  return (
    <Box>
      <Sheet variant="outlined" sx={{ width: "100%", overflow: "auto", borderRadius: "sm", padding: 2, mb: 4 }}>
        <TableM aria-label="Clinicians Table">
          <thead>
            <tr>
              <th style={{ width: "min-content" }}><Checkbox /></th>
              <th style={{ width: "min-content" }}>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {clinicians.map((row: Clinician) => (
              <tr key={row.clinician_id}>
                <td><Checkbox /></td>
                <td>{row.clinician_id}</td>
                <td>{row.first_name} {row.last_name}</td>
                <td>Clinician{row.is_admin ? " (Admin)" : ""}</td>
                <td>{row.email}</td>
                <td>{row.is_active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </TableM>
      </Sheet>
      <Sheet variant="outlined" sx={{ width: "100%", overflow: "auto", borderRadius: "sm", padding: 2 }}>
        <TableM aria-label="Patients Table">
          <thead>
            <tr>
              <th style={{ width: "min-content" }}><Checkbox /></th>
              <th style={{ width: "min-content" }}>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((row: Patient) => (
              <tr key={row.patient_id}>
                <td><Checkbox /></td>
                <td>{row.patient_id}</td>
                <td>{row.first_name} {row.last_name}</td>
                <td>{row.email}</td>
                <td>{row.is_active ? "Active" : "Inactive"}</td>
              </tr>
            ))}
          </tbody>
        </TableM>
      </Sheet>
    </Box>
  );
}