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

  const { first_name, last_name } = req.body as { first_name?: string; last_name?: string };

  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  try {
    const clinicianId = user.clinician_id;

    // Search for patient with exact match (case-insensitive using COLLATE NOCASE in SQLite)
    const patients = await prisma.patient.findMany({
      where: {
        assigned_clinician_id: clinicianId,
        is_active: true,
        first_name: {
          equals: first_name.trim(),
        },
        last_name: {
          equals: last_name.trim(),
        },
      },
      select: {
        patient_id: true,
        first_name: true,
        last_name: true,
        age: true,
        gender: true,
        date_of_birth: true,
        created_at: true,
        _count: {
          select: {
            sessions: true,
          },
        },
      },
      orderBy: { updated_at: 'desc' },
      take: 5, // Limit to 5 matches in case of duplicates
    });

    if (patients.length === 0) {
      return res.status(200).json({
        exists: false,
        patients: [],
      });
    }

    return res.status(200).json({
      exists: true,
      patients: patients.map((p) => ({
        patient_id: p.patient_id,
        first_name: p.first_name,
        last_name: p.last_name,
        age: p.age,
        gender: p.gender,
        date_of_birth: p.date_of_birth?.toISOString(),
        created_at: p.created_at.toISOString(),
        session_count: '_count' in p ? (p._count as { sessions: number }).sessions : 0,
      })),
    });
  } catch (error) {
    console.error('Failed to check patient:', error);
    const message = error instanceof Error ? error.message : 'Failed to check patient';
    return res.status(500).json({ error: 'Database error: ' + message });
  }
}
