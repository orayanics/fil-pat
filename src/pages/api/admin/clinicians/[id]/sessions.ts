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
      const sessions = await prisma.assessmentSession.findMany({
        where: { clinician_id: Number(id) },
        include: {
          patient: {
            select: {
              first_name: true,
              last_name: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: 50,
      });

      res.status(200).json({ sessions });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
}
