"use client";
import { Box, Typography, Button } from "@mui/joy";
import Table from "@/modules/users/Table";
import Link from "next/link";

export default function ManageClinicianPage() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography level="h2" sx={{ mb: 2 }}>
        Manage Clinicians
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Link href="/admin-dashboard/add-clinician">
          <Button variant="solid">Add Clinician</Button>
        </Link>
      </Box>
      <Table />
    </Box>
  );
}
