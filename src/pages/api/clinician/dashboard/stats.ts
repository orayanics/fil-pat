import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/database/client";
import { verifyToken } from "@/lib/auth/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
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

  try {
    const clinicianId = user.clinician_id;

    // Get total patients assigned to this clinician
    const totalPatients = await prisma.patient.count({
      where: { assigned_clinician_id: clinicianId, is_active: true },
    });

    // Get sessions today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessionsToday = await prisma.assessmentSession.count({
      where: {
        clinician_id: clinicianId,
        created_at: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get active templates count
    const activeTemplates = await prisma.assessmentTemplate.count({
      where: {
        created_by: clinicianId,
        is_active: true,
      },
    });

    // Get completed sessions this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const completedThisWeek = await prisma.assessmentSession.count({
      where: {
        clinician_id: clinicianId,
        status: 'Completed',
        updated_at: {
          gte: weekAgo,
        },
      },
    });

    // Get recent sessions (last 5)
    const recentSessions = await prisma.assessmentSession.findMany({
      where: { clinician_id: clinicianId },
      include: {
        patient: {
          select: {
            patient_id: true,
            first_name: true,
            last_name: true,
            age: true,
          },
        },
        template: {
          select: {
            template_id: true,
            name: true,
            is_for_kids: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    // Get recent patients (last 5)
    const recentPatients = await prisma.patient.findMany({
      where: { assigned_clinician_id: clinicianId, is_active: true },
      orderBy: { updated_at: 'desc' },
      take: 5,
      select: {
        patient_id: true,
        first_name: true,
        last_name: true,
        age: true,
        gender: true,
        updated_at: true,
      },
    });

    return res.status(200).json({
      stats: {
        totalPatients,
        sessionsToday,
        activeTemplates,
        completedThisWeek,
      },
      recentSessions: recentSessions.map((s) => ({
        session_id: s.session_id,
        session_uuid: s.session_uuid,
        status: s.status,
        created_at: s.created_at.toISOString(),
        patient: s.patient
          ? {
              patient_id: s.patient.patient_id,
              name: `${s.patient.first_name} ${s.patient.last_name}`,
              age: s.patient.age,
            }
          : null,
        template: s.template
          ? {
              template_id: s.template.template_id,
              name: s.template.name,
              is_for_kids: s.template.is_for_kids,
            }
          : null,
      })),
      recentPatients: recentPatients.map((p) => ({
        patient_id: p.patient_id,
        name: `${p.first_name} ${p.last_name}`,
        age: p.age,
        gender: p.gender,
        last_updated: p.updated_at.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}
