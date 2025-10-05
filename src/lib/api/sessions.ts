import { prisma } from '../database/client';
import { logActivity } from '../auth/auth';
import { AssessmentSession, SessionResponse, SessionItem } from '@prisma/client';

export interface CreateSessionData {
  session_uuid: string;
  patient_id: number;
  clinician_id: number;
  template_id: number;
  session_name?: string;
  session_mode?: 'Standard' | 'Kids';
  is_practice_session?: boolean;
}

export interface SessionWithDetails extends AssessmentSession {
  patient: {
    patient_id: number;
    first_name: string;
    last_name: string;
    age: number | null;
    gender: string | null;
  };
  clinician: {
    clinician_id: number;
    first_name: string;
    last_name: string;
  };
  template: {
    template_id: number;
    name: string;
    is_for_kids: boolean;
  };
  current_item?: SessionItem;
  responses: SessionResponse[];
}

export async function createAssessmentSession(data: CreateSessionData): Promise<AssessmentSession> {
  const session = await prisma.assessmentSession.create({
    data: {
      ...data,
      session_date: new Date(),
      status: 'Scheduled'
    }
  });

  await logActivity({
    user_id: data.clinician_id,
    action: 'create_assessment_session',
    entity_type: 'assessment_session',
    entity_id: session.session_id,
    description: `Created assessment session: ${session.session_uuid}`,
    new_values: data
  });

  return session;
}

export async function getSessionByUuid(session_uuid: string): Promise<SessionWithDetails | null> {
  const session = await prisma.assessmentSession.findUnique({
    where: { session_uuid },
    include: {
      patient: {
        select: {
          patient_id: true,
          first_name: true,
          last_name: true,
          age: true,
          gender: true
        }
      },
      clinician: {
        select: {
          clinician_id: true,
          first_name: true,
          last_name: true
        }
      },
      template: {
        select: {
          template_id: true,
          name: true,
          is_for_kids: true
        }
      },
      current_item: true,
      responses: {
        orderBy: { response_timestamp: 'asc' }
      }
    }
  });

  return session as SessionWithDetails | null;
}

export async function updateSessionProgress(session_uuid: string, updates: Partial<AssessmentSession>) {
  const session = await prisma.assessmentSession.update({
    where: { session_uuid },
    data: updates
  });

  await logActivity({
    user_id: session.clinician_id,
    action: 'update_session_progress',
    entity_type: 'assessment_session',
    entity_id: session.session_id,
    description: `Updated session progress: ${session_uuid}`,
    new_values: updates
  });

  return session;
}

export async function getSessionItems(template_id: number, is_kids_mode = false) {
  return prisma.sessionItem.findMany({
    where: {
      template_id,
      is_active: true
    },
    orderBy: { display_order: 'asc' }
  });
}

export async function saveSessionResponse(data: {
  session_id: number;
  session_item_id: number;
  response_text?: string;
  response_audio_path?: string;
  is_correct?: boolean;
  score?: number;
  time_taken_seconds?: number;
  clinician_notes?: string;
}) {
  const response = await prisma.sessionResponse.create({
    data
  });

  // Update session completed items count
  const session = await prisma.assessmentSession.findUnique({
    where: { session_id: data.session_id }
  });

  if (session) {
    await prisma.assessmentSession.update({
      where: { session_id: data.session_id },
      data: {
        completed_items: session.completed_items + 1
      }
    });

    await logActivity({
      user_id: session.clinician_id,
      action: 'save_session_response',
      entity_type: 'session_response',
      entity_id: response.response_id,
      description: `Response saved for item ${data.session_item_id}`,
      new_values: data
    });
  }

  return response;
}