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

    // If template is null (deleted), fetch items directly from responses
    // This ensures we still have access to the historical session data
    let sessionItems = session.template?.session_items || [];
    
    if (!session.template && session.responses.length > 0) {
      // Template was deleted, but we can reconstruct items from responses
      const uniqueItems = new Map();
      session.responses.forEach(response => {
        if (response.session_item && !uniqueItems.has(response.session_item.item_id)) {
          uniqueItems.set(response.session_item.item_id, response.session_item);
        }
      });
      sessionItems = Array.from(uniqueItems.values()).sort((a, b) => a.item_number - b.item_number);
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
      template: session.template ? {
        template_id: session.template.template_id,
        name: session.template.name,
        description: session.template.description,
        is_for_kids: session.template.is_for_kids,
      } : {
        template_id: null,
        name: 'Deleted Template',
        description: 'This template has been deleted',
        is_for_kids: false,
      },
      items: sessionItems.map((item) => {
        const response = session.responses.find(
          (r) => r.session_item_id === item.item_id
        );
        return {
          item_id: item.item_id,
          item_number: item.item_number,
          question: item.question,
          target_word: item.target_word,
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
        totalItems: session.total_items || sessionItems.length,
        completedItems: (() => {
          // Count items that have actual response data (not empty responses)
          const actuallyCompleted = session.responses.filter(r => 
            r.response_text || 
            (r.consonants_correct !== null && r.consonants_correct !== undefined) ||
            (r.vowels_correct !== null && r.vowels_correct !== undefined) ||
            r.clinician_notes
          ).length;
          return actuallyCompleted;
        })(),
        completionPercentage: (() => {
          const totalItems = session.total_items || sessionItems.length;
          if (totalItems === 0) return 0;
          // Count items that have actual response data
          const actuallyCompleted = session.responses.filter(r => 
            r.response_text || 
            (r.consonants_correct !== null && r.consonants_correct !== undefined) ||
            (r.vowels_correct !== null && r.vowels_correct !== undefined) ||
            r.clinician_notes
          ).length;
          return (actuallyCompleted / totalItems) * 100;
        })(),
      },
    };

    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Failed to fetch session data:", error);
    res.status(500).json({ error: "Failed to fetch session data" });
  }
}
