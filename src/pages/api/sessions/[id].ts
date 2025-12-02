import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/database/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Session ID is required" });
  }

  try {
    // Fetch session with all related data
    const session = await prisma.assessmentSession.findUnique({
      where: { session_uuid: id },
      include: {
        patient: true,
        clinician: {
          select: {
            clinician_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        template: {
          include: {
            session_items: {
              orderBy: { item_number: 'asc' },
            },
          },
        },
        responses: {
          include: {
            session_item: true,
          },
          orderBy: { response_timestamp: 'asc' },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Format the response data for PDF generation
    const formattedData = {
      session: {
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
      },
      patient: session.patient ? {
        patient_id: session.patient.patient_id,
        first_name: session.patient.first_name,
        last_name: session.patient.last_name,
        age: session.patient.age,
        gender: session.patient.gender,
        date_of_birth: session.patient.date_of_birth,
      } : null,
      clinician: {
        clinician_id: session.clinician.clinician_id,
        first_name: session.clinician.first_name,
        last_name: session.clinician.last_name,
        email: session.clinician.email,
      },
      template: {
        template_id: session.template.template_id,
        name: session.template.name,
        description: session.template.description,
        is_for_kids: session.template.is_for_kids,
      },
      items: session.template.session_items.map((item) => {
        const response = session.responses.find(
          (r) => r.session_item_id === item.item_id
        );
        return {
          item_id: item.item_id,
          item_number: item.item_number,
          question: item.question,
          ipa_key: item.ipa_key,
          consonant_group: item.consonant_group,
          consonants_count: item.consonants_count,
          vowels_count: item.vowels_count,
          max_score: item.max_score,
          image_url: item.image_url,
          response: response ? {
            response_text: response.response_text,
            score: response.score,
            is_correct: response.is_correct,
            time_taken_seconds: response.time_taken_seconds,
            clinician_notes: response.clinician_notes,
            consonants_correct: response.consonants_correct,
            vowels_correct: response.vowels_correct,
          } : null,
        };
      }),
      meta: {
        totalItems: session.total_items || session.template.session_items.length,
        completedItems: session.completed_items || session.responses.length,
        completionPercentage: session.percentage_score || 0,
      },
    };

    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Failed to fetch session data:", error);
    res.status(500).json({ error: "Failed to fetch session data" });
  }
}
