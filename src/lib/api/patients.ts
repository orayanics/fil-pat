import { prisma } from '../database/client';
import { logActivity } from '../auth/auth';
import { Patient } from '@prisma/client';

export interface CreatePatientData {
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: Date;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_relationship?: string;
  medical_history?: string;
  assigned_clinician_id: number;
}

export async function createPatient(data: CreatePatientData): Promise<Patient> {
  // Calculate age
  const age = Math.floor((new Date().getTime() - new Date(data.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

  const patient = await prisma.patient.create({
    data: {
      ...data,
      age
    }
  });

  await logActivity({
    user_id: data.assigned_clinician_id,
    action: 'create_patient',
    entity_type: 'patient',
    entity_id: patient.patient_id,
    description: `Created patient record: ${patient.first_name} ${patient.last_name}`,
    new_values: data
  });

  return patient;
}

export async function getPatientsByClinicianId(clinician_id: number) {
  return prisma.patient.findMany({
    where: {
      assigned_clinician_id: clinician_id,
      is_active: true
    },
    orderBy: [
      { last_name: 'asc' },
      { first_name: 'asc' }
    ]
  });
}

export async function updatePatient(patient_id: number, data: Partial<Patient>, updated_by: number) {
  const oldData = await prisma.patient.findUnique({
    where: { patient_id }
  });

  const updatedPatient = await prisma.patient.update({
    where: { patient_id },
    data
  });

  await logActivity({
    user_id: updated_by,
    action: 'update_patient',
    entity_type: 'patient',
    entity_id: patient_id,
    description: `Updated patient: ${updatedPatient.first_name} ${updatedPatient.last_name}`,
    old_values: oldData,
    new_values: data
  });

  return updatedPatient;
}