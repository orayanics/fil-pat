import { prisma } from "@/lib/database/client";
import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/auth/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      // Verify admin
      const token = req.cookies["auth_token"];
      const userData = await verifyToken(token);
      if (!userData || !userData.is_admin) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const patient = await prisma.patient.findUnique({
        where: { patient_id: Number(id) },
        include: {
          assigned_clinician: {
            select: {
              clinician_id: true,
              first_name: true,
              last_name: true,
              specialization: true,
            },
          },
        },
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      res.status(200).json({ patient });
    } catch (error) {
      console.error("Failed to fetch patient:", error);
      res.status(500).json({ error: "Failed to fetch patient" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
