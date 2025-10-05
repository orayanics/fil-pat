import { prisma } from "@/lib/database/client";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const reports = await prisma.report.findMany({
      include: {
        patient: true,
        clinician: true,
        session: true,
      },
      orderBy: { report_date: "desc" },
    });
    res.status(200).json({ reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
}
