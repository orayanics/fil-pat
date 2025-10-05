import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/database/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  // Get clinician id from session or token (for now, from query for demo)
  const clinicianId = req.query.clinicianId || req.headers["x-clinician-id"];
  if (!clinicianId) {
    return res.status(401).json({ error: "Clinician not authenticated" });
  }
  try {
    const patients = await prisma.patient.findMany({
      where: { assigned_clinician_id: Number(clinicianId) },
      select: {
        patient_id: true,
        first_name: true,
        last_name: true,
        email: true,
        is_active: true,
      },
    });
    res.status(200).json({ patients });
  } catch {
    res.status(500).json({ error: "Failed to fetch patients" });
  }
}
