import { prisma } from "@/lib/database/client";
import { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/auth/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
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

    const logs = await prisma.activityLog.findMany({
      take: 20,
      orderBy: { timestamp: "desc" },
      include: {
        user: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    const formattedLogs = logs.map((log) => ({
      ...log,
      user_name: log.user
        ? `${log.user.first_name} ${log.user.last_name}`
        : "System",
    }));

    res.status(200).json({ logs: formattedLogs });
  } catch (error) {
    console.error("Failed to fetch recent activity:", error);
    res.status(500).json({ error: "Failed to fetch recent activity" });
  }
}
