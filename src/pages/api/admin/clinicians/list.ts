import { prisma } from "@/lib/database/client";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const clinicians = await prisma.clinician.findMany({
      select: {
        clinician_id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        is_admin: true,
        is_active: true,
      },
    });
    res.status(200).json({ clinicians });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch clinicians" });
  }
}
