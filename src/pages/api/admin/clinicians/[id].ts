import { prisma } from "@/lib/database/client";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  if (!id || Array.isArray(id)) {
    return res.status(400).json({ error: "Invalid clinician ID" });
  }

  if (req.method === "GET") {
    try {
      const clinician = await prisma.clinician.findUnique({
        where: { clinician_id: Number(id) },
      });
      if (!clinician) return res.status(404).json({ error: "Clinician not found" });
      res.status(200).json({ clinician });
    } catch (error) {
      console.log("GET error:", error);
      res.status(500).json({ error: "Failed to fetch clinician" });
    }
  } else if (req.method === "PUT") {
    try {
      const data = req.body && typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const updated = await prisma.clinician.update({
        where: { clinician_id: Number(id) },
        data,
      });
      res.status(200).json({ clinician: updated });
    } catch (error) {
      console.log("PUT error:", error);
      res.status(500).json({ error: "Failed to update clinician" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
