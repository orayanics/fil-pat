import { prisma } from "@/lib/database/client";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const patients = await prisma.patient.findMany({
      select: {
        patient_id: true,
        first_name: true,
        last_name: true,
        middle_name: true,
        date_of_birth: true,
        age: true,
        gender: true,
        phone: true,
        email: true,
        address: true,
        city: true,
        guardian_name: true,
        guardian_phone: true,
        medical_history: true,
        assigned_clinician_id: true,
        is_active: true,
        created_at: true,
        assigned_clinician: {
          select: {
            clinician_id: true,
            first_name: true,
            last_name: true,
            specialization: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
    res.status(200).json({ patients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
}
