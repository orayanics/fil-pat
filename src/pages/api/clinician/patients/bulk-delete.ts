import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/database/client";
import { verifyToken } from "@/lib/auth/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = req.cookies["auth_token"];
  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const user = verifyToken(token);
  if (!user || !user.clinician_id) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const { patient_ids } = req.body as { patient_ids?: number[] };

  if (!patient_ids || !Array.isArray(patient_ids) || patient_ids.length === 0) {
    return res.status(400).json({ error: 'Invalid patient IDs' });
  }

  try {
    // Verify all patients belong to this clinician
    const patients = await prisma.patient.findMany({
      where: {
        patient_id: { in: patient_ids },
      },
      select: { patient_id: true, assigned_clinician_id: true },
    });

    const unauthorizedPatients = patients.filter(
      (p) => p.assigned_clinician_id !== user.clinician_id
    );

    if (unauthorizedPatients.length > 0) {
      return res.status(403).json({ error: "Not authorized to delete some patients" });
    }

    if (patients.length !== patient_ids.length) {
      return res.status(404).json({ error: "Some patients not found" });
    }

    // Delete all related records
    // Delete session responses for these patients
    await prisma.$executeRaw`
      DELETE FROM session_responses 
      WHERE session_id IN (
        SELECT session_id FROM assessment_sessions WHERE patient_id IN (${patient_ids.join(',')})
      )
    `;

    // Delete sessions for these patients
    await prisma.assessmentSession.deleteMany({
      where: { patient_id: { in: patient_ids } },
    });

    // Delete patients
    const result = await prisma.patient.deleteMany({
      where: { patient_id: { in: patient_ids } },
    });

    res.status(200).json({ 
      message: `${result.count} patient(s) deleted successfully`,
      count: result.count 
    });
  } catch (error) {
    console.error("Failed to bulk delete patients:", error);
    res.status(500).json({ error: "Failed to delete patients" });
  }
}
