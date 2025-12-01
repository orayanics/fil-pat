import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/database/client";
import { verifyToken } from "@/lib/auth/auth";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = req.cookies["auth_token"];
  
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = verifyToken(token);
  
  if (!user || !user.clinician_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const clinicianId = user.clinician_id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current password and new password are required" });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters long" });
  }

  try {
    // Fetch current clinician with password
    const clinician = await prisma.clinician.findUnique({
      where: { clinician_id: clinicianId },
      select: { password_hash: true },
    });

    if (!clinician) {
      return res.status(404).json({ error: "Clinician not found" });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, clinician.password_hash);
    if (!isValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.clinician.update({
      where: { clinician_id: clinicianId },
      data: {
        password_hash: newPasswordHash,
        password_changed_at: new Date(),
      },
    });

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Failed to change password:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
}
