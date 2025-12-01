import { prisma } from "@/lib/database/client";
import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/auth/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid clinician ID" });
  }

  try {
    // Verify admin
    const token = req.cookies["auth_token"];
    const userData = await verifyToken(token);
    if (!userData || !userData.is_admin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      const patients = await prisma.patient.findMany({
        where: { assigned_clinician_id: Number(id) },
        select: {
          patient_id: true,
          first_name: true,
          last_name: true,
          date_of_birth: true,
          is_active: true,
          created_at: true,
        },
        orderBy: { created_at: "desc" },
      });

      res.status(200).json({ patients });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Failed to fetch patients:", error);
    res.status(500).json({ error: "Failed to fetch patients" });
  }
}
