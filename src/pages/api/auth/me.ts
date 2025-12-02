import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const token = req.cookies["auth_token"];
    if (!token) return res.status(401).json({ error: "Not authenticated" });

    const payload = verifyToken(token);
    if (!payload || !payload.userId) return res.status(401).json({ error: "Invalid token" });

    const user = await prisma.clinician.findUnique({
      where: { clinician_id: payload.userId },
      select: { 
        clinician_id: true, 
        username: true,
        first_name: true, 
        last_name: true, 
        email: true, 
        is_active: true,
        is_admin: true
      }
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    return res.status(200).json({ user });
  } catch (e) {
    console.error("/api/auth/me error", e);
    return res.status(500).json({ error: "Failed to verify authentication" });
  }
}
