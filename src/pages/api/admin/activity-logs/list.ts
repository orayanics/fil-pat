import { prisma } from "@/lib/database/client";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const logs = await prisma.activityLog.findMany({
      include: {
        user: true,
      },
      orderBy: { timestamp: "desc" },
    });
    res.status(200).json({ logs });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch activity logs" });
  }
}
