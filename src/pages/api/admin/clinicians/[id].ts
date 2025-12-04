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
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }
    const userData = await verifyToken(token);
    if (!userData || !userData.is_admin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (req.method === "GET") {
      const clinician = await prisma.clinician.findUnique({
        where: { clinician_id: Number(id) },
      });
      if (!clinician) return res.status(404).json({ error: "Clinician not found" });
      res.status(200).json({ clinician });
    } else if (req.method === "PUT") {
      const data = req.body && typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const updated = await prisma.clinician.update({
        where: { clinician_id: Number(id) },
        data,
      });
      res.status(200).json({ clinician: updated });
    } else if (req.method === "DELETE") {
      // Soft delete by setting is_active to false
      const deleted = await prisma.clinician.update({
        where: { clinician_id: Number(id) },
        data: { is_active: false },
      });
      res.status(200).json({ clinician: deleted, message: "Clinician deactivated successfully" });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("API error:", error);
    res.status(500).json({ error: "Failed to process request" });
  }
}
