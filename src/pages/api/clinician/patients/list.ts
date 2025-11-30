import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/database/client";
import { verifyToken } from "@/lib/auth/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  
  // Get clinician ID from auth token
  const token = req.cookies["auth_token"];
  if (!token) {
    // Fallback to query param for backwards compatibility
    const clinicianId = req.query.clinicianId || req.headers["x-clinician-id"];
    if (!clinicianId) {
      return res.status(401).json({ error: "Clinician not authenticated" });
    }
    
    try {
      const patients = await prisma.patient.findMany({
        where: { assigned_clinician_id: Number(clinicianId) },
        select: {
          patient_id: true,
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          age: true,
          gender: true,
          date_of_birth: true,
          is_active: true,
          _count: {
            select: { sessions: true }
          }
        },
        orderBy: [
          { last_name: 'asc' },
          { first_name: 'asc' }
        ]
      });
      
      const patientsWithCount = patients.map(p => ({
        ...p,
        session_count: p._count.sessions,
        _count: undefined
      }));
      
      return res.status(200).json({ patients: patientsWithCount });
    } catch {
      return res.status(500).json({ error: "Failed to fetch patients" });
    }
  }
  
  // Use token authentication
  const user = verifyToken(token);
  if (!user || !user.clinician_id) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  
  try {
    const patients = await prisma.patient.findMany({
      where: { assigned_clinician_id: user.clinician_id },
      select: {
        patient_id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        age: true,
        gender: true,
        date_of_birth: true,
        is_active: true,
        _count: {
          select: { sessions: true }
        }
      },
      orderBy: [
        { last_name: 'asc' },
        { first_name: 'asc' }
      ]
    });
    
    // Transform to include session_count
    const patientsWithCount = patients.map(p => ({
      ...p,
      session_count: p._count.sessions,
      _count: undefined
    }));
    
    res.status(200).json({ patients: patientsWithCount });
  } catch {
    res.status(500).json({ error: "Failed to fetch patients" });
  }
}
