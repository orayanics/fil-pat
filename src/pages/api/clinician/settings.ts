import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/database/client";
import { verifyToken } from "@/lib/auth/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies["auth_token"];
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = verifyToken(token);
  
  if (!user || !user.clinician_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const clinicianId = user.clinician_id;

  if (req.method === "GET") {
    try {
      const clinician = await prisma.clinician.findUnique({
        where: { clinician_id: clinicianId },
        select: {
          first_name: true,
          last_name: true,
          middle_name: true,
          email: true,
          phone: true,
          license_number: true,
          specialization: true,
          qualification: true,
          address: true,
          city: true,
          state_province: true,
          postal_code: true,
          years_of_experience: true,
          is_active: true,
        },
      });

      if (!clinician) {
        return res.status(404).json({ error: "Clinician not found" });
      }

      res.status(200).json(clinician);
    } catch (error) {
      console.error("Failed to fetch clinician settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  } else if (req.method === "PUT") {
    try {
      const {
        first_name,
        last_name,
        middle_name,
        email,
        phone,
        license_number,
        specialization,
        qualification,
        address,
        city,
        state_province,
        postal_code,
        years_of_experience,
        is_active,
      } = req.body;

      // Validate required fields
      if (!first_name || !last_name || !email) {
        return res.status(400).json({ error: "First name, last name, and email are required" });
      }

      // Check if email is already taken by another clinician
      const existingClinician = await prisma.clinician.findFirst({
        where: {
          email,
          NOT: { clinician_id: clinicianId },
        },
      });

      if (existingClinician) {
        return res.status(400).json({ error: "Email is already in use" });
      }

      const updatedClinician = await prisma.clinician.update({
        where: { clinician_id: clinicianId },
        data: {
          first_name,
          last_name,
          middle_name: middle_name || null,
          email,
          phone: phone || null,
          license_number: license_number || null,
          specialization: specialization || null,
          qualification: qualification || null,
          address: address || null,
          city: city || null,
          state_province: state_province || null,
          postal_code: postal_code || null,
          years_of_experience: years_of_experience || 0,
          is_active: is_active !== undefined ? is_active : true,
        },
        select: {
          first_name: true,
          last_name: true,
          middle_name: true,
          email: true,
          phone: true,
          license_number: true,
          specialization: true,
          qualification: true,
          address: true,
          city: true,
          state_province: true,
          postal_code: true,
          years_of_experience: true,
          is_active: true,
        },
      });

      res.status(200).json(updatedClinician);
    } catch (error) {
      console.error("Failed to update clinician settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
