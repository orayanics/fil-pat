import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/database/client";
import { verifyToken } from "@/lib/auth/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const patientId = Number(id);

  if (isNaN(patientId)) {
    return res.status(400).json({ error: "Invalid patient ID" });
  }

  // GET - Fetch single patient
  if (req.method === "GET") {
    try {
      const patient = await prisma.patient.findUnique({
        where: { patient_id: patientId },
        include: {
          sessions: {
            orderBy: { session_date: 'desc' },
            take: 10,
            include: {
              template: {
                include: {
                  session_items: true,
                },
              },
              responses: {
                include: {
                  session_item: true,
                },
              },
            },
          },
        },
      });

      if (!patient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      res.status(200).json({ patient });
    } catch (error) {
      console.error("Failed to fetch patient:", error);
      res.status(500).json({ error: "Failed to fetch patient" });
    }
  }

  // PATCH - Update patient (e.g., toggle is_active)
  else if (req.method === "PATCH" || req.method === "PUT") {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = verifyToken(token);
    if (!user || !user.clinician_id) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    try {
      // Verify patient belongs to this clinician
      const existingPatient = await prisma.patient.findUnique({
        where: { patient_id: patientId },
        select: { assigned_clinician_id: true, date_of_birth: true },
      });

      if (!existingPatient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      if (existingPatient.assigned_clinician_id !== user.clinician_id) {
        return res.status(403).json({ error: "Not authorized to update this patient" });
      }

      const updates = req.body;

      // Calculate age if date_of_birth is being updated
      if (updates.date_of_birth) {
        const birthDate = new Date(updates.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        updates.age = age;
        updates.date_of_birth = birthDate;
      }

      const patient = await prisma.patient.update({
        where: { patient_id: patientId },
        data: updates,
      });

      res.status(200).json({ message: "Patient updated successfully", patient });
    } catch (error) {
      console.error("Failed to update patient:", error);
      res.status(500).json({ error: "Failed to update patient" });
    }
  }

  // DELETE - Delete patient
  else if (req.method === "DELETE") {
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = verifyToken(token);
    if (!user || !user.clinician_id) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    try {
      // Verify patient belongs to this clinician
      const existingPatient = await prisma.patient.findUnique({
        where: { patient_id: patientId },
        select: { assigned_clinician_id: true },
      });

      if (!existingPatient) {
        return res.status(404).json({ error: "Patient not found" });
      }

      if (existingPatient.assigned_clinician_id !== user.clinician_id) {
        return res.status(403).json({ error: "Not authorized to delete this patient" });
      }

      // Delete all related records first
      // Delete session responses
      await prisma.$executeRaw`
        DELETE FROM session_responses 
        WHERE session_id IN (
          SELECT session_id FROM assessment_sessions WHERE patient_id = ${patientId}
        )
      `;

      // Delete sessions
      await prisma.assessmentSession.deleteMany({
        where: { patient_id: patientId },
      });

      // Delete patient
      await prisma.patient.delete({
        where: { patient_id: patientId },
      });

      res.status(200).json({ message: "Patient deleted successfully" });
    } catch (error) {
      console.error("Failed to delete patient:", error);
      res.status(500).json({ error: "Failed to delete patient" });
    }
  }

  else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
