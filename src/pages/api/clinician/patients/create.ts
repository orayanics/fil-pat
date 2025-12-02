import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/database/client";
import { verifyToken } from "@/lib/auth/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const {
      first_name,
      last_name,
      middle_name,
      date_of_birth,
      gender,
      phone,
      email,
      address,
      city,
      state_province,
      postal_code,
      guardian_name,
      guardian_phone,
      guardian_email,
      guardian_relationship,
      medical_history,
      allergies,
      medications,
      special_needs,
      preferred_language,
      notes,
      emergency_contact_name,
      emergency_contact_phone,
      assigned_clinician_id,
    } = req.body;

    if (!first_name || !last_name || !date_of_birth) {
      return res.status(400).json({
        error: "Missing required fields: first_name, last_name, date_of_birth",
      });
    }

    // Calculate age from date_of_birth
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    const newPatient = await prisma.patient.create({
      data: {
        first_name,
        last_name,
        middle_name: middle_name || null,
        date_of_birth: new Date(date_of_birth),
        age,
        gender: gender || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        city: city || null,
        state_province: state_province || null,
        postal_code: postal_code || null,
        guardian_name: guardian_name || null,
        guardian_phone: guardian_phone || null,
        guardian_email: guardian_email || null,
        guardian_relationship: guardian_relationship || null,
        medical_history: medical_history || null,
        allergies: allergies || null,
        medications: medications || null,
        special_needs: special_needs || null,
        preferred_language: preferred_language || "Filipino",
        notes: notes || null,
        emergency_contact_name: emergency_contact_name || null,
        emergency_contact_phone: emergency_contact_phone || null,
        assigned_clinician_id: assigned_clinician_id || decoded.clinician_id,
      },
    });

    return res.status(201).json({
      message: "Patient created successfully",
      patient: newPatient,
    });
  } catch (error) {
    console.error("Error creating patient:", error);
    return res.status(500).json({ error: "Failed to create patient" });
  }
}
