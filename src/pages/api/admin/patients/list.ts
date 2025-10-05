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
        email: true,
        is_active: true,
      },
    });
    res.status(200).json({ patients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
}
