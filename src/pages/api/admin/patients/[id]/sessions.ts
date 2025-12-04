import { prisma } from "@/lib/database/client";
import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/auth/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

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

    const sessions = await prisma.assessmentSession.findMany({
      where: { patient_id: Number(id) },
      select: {
        session_id: true,
        session_uuid: true,
        session_name: true,
        status: true,
        session_date: true,
      },
      orderBy: { created_at: "desc" },
    });

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Failed to fetch patient sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
}
