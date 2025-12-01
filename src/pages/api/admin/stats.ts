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
    const userData = await verifyToken(token);
    if (!userData || !userData.is_admin) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Get current month stats
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Clinicians stats
    const totalClinicians = await prisma.clinician.count();
    const activeClinicians = await prisma.clinician.count({
      where: { is_active: true },
    });
    const cliniciansThisMonth = await prisma.clinician.count({
      where: { created_at: { gte: firstDayThisMonth } },
    });
    const cliniciansLastMonth = await prisma.clinician.count({
      where: {
        created_at: { gte: firstDayLastMonth, lte: lastDayLastMonth },
      },
    });

    // Patients stats
    const totalPatients = await prisma.patient.count();
    const activePatients = await prisma.patient.count({
      where: { is_active: true },
    });
    const patientsThisMonth = await prisma.patient.count({
      where: { created_at: { gte: firstDayThisMonth } },
    });
    const patientsLastMonth = await prisma.patient.count({
      where: {
        created_at: { gte: firstDayLastMonth, lte: lastDayLastMonth },
      },
    });

    // Sessions stats
    const totalSessions = await prisma.assessmentSession.count();
    const completedSessions = await prisma.assessmentSession.count({
      where: { status: "Completed" },
    });
    const scheduledSessions = await prisma.assessmentSession.count({
      where: { status: "Scheduled" },
    });
    const sessionsThisMonth = await prisma.assessmentSession.count({
      where: { created_at: { gte: firstDayThisMonth } },
    });
    const sessionsLastMonth = await prisma.assessmentSession.count({
      where: {
        created_at: { gte: firstDayLastMonth, lte: lastDayLastMonth },
      },
    });

    // Calculate trends
    const clinicianTrend =
      cliniciansLastMonth > 0
        ? Math.round(
            ((cliniciansThisMonth - cliniciansLastMonth) / cliniciansLastMonth) *
              100
          )
        : 0;
    const patientTrend =
      patientsLastMonth > 0
        ? Math.round(
            ((patientsThisMonth - patientsLastMonth) / patientsLastMonth) * 100
          )
        : 0;
    const sessionTrend =
      sessionsLastMonth > 0
        ? Math.round(
            ((sessionsThisMonth - sessionsLastMonth) / sessionsLastMonth) * 100
          )
        : 0;

    res.status(200).json({
      totalClinicians,
      activeClinicians,
      totalPatients,
      activePatients,
      totalSessions,
      completedSessions,
      scheduledSessions,
      clinicianTrend,
      patientTrend,
      sessionTrend,
    });
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
}
