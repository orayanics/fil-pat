import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/database/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  const patientId = Number(id);

  if (isNaN(patientId)) {
    return res.status(400).json({ error: "Invalid patient ID" });
  }

  try {
    const patient = await prisma.patient.findUnique({
      where: { patient_id: patientId },
      include: {
        assigned_clinician: {
          select: {
            clinician_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        sessions: {
          orderBy: { session_date: 'desc' },
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
              orderBy: { response_id: 'asc' },
            },
          },
        },
      },
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Format report data
    const report = {
      patient: {
        patient_id: patient.patient_id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        age: patient.age,
        gender: patient.gender,
        email: patient.email,
        phone: patient.phone,
        date_of_birth: patient.date_of_birth,
        notes: patient.notes,
        is_active: patient.is_active,
        created_at: patient.created_at,
      },
      clinician: patient.assigned_clinician ? {
        name: `${patient.assigned_clinician.first_name} ${patient.assigned_clinician.last_name}`,
        email: patient.assigned_clinician.email,
      } : null,
      sessions: patient.sessions.map((session) => ({
        session_id: session.session_id,
        session_uuid: session.session_uuid,
        session_name: session.session_name,
        session_date: session.session_date,
        start_time: session.start_time,
        end_time: session.end_time,
        duration_minutes: session.duration_minutes,
        status: session.status,
        session_mode: session.session_mode,
        overall_score: session.overall_score,
        percentage_score: session.percentage_score,
        post_session_notes: session.post_session_notes,
        session_summary: session.session_summary,
        template: session.template ? {
          name: session.template.name,
          description: session.template.description,
          total_items: session.template.session_items.length,
        } : null,
        items: session.responses.map((response) => ({
          item_number: response.session_item?.item_number || 0,
          question: response.session_item?.question || '',
          image_url: response.session_item?.image_url || '',
          response_text: response.response_text,
          is_correct: response.is_correct,
          score: response.score,
          max_score: response.session_item?.max_score || 10,
          time_taken_seconds: response.time_taken_seconds,
          consonants_correct: response.consonants_correct,
          vowels_correct: response.vowels_correct,
          consonants_count: response.session_item?.consonants_count || 0,
          vowels_count: response.session_item?.vowels_count || 0,
          clinician_notes: response.clinician_notes,
        })),
      })),
      meta: {
        total_sessions: patient.sessions.length,
        generated_at: new Date().toISOString(),
      },
    };

    res.status(200).json(report);
  } catch (error) {
    console.error("Failed to generate patient report:", error);
    res.status(500).json({ error: "Failed to generate report" });
  }
}
