import { prisma } from '../database/client';
import { hashPassword, logActivity } from '../auth/auth';
import { Clinician } from '@prisma/client';

export interface CreateClinicianData {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone?: string;
  specialization?: string;
  is_admin?: boolean;
  created_by: number;
}

export async function createClinician(data: CreateClinicianData): Promise<Clinician> {
  const password_hash = await hashPassword(data.password);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = data;

  const clinician = await prisma.clinician.create({
    data: {
      ...rest,
      password_hash,
    },
  });

  await logActivity({
    user_id: data.created_by,
    action: 'create_clinician',
    entity_type: 'clinician',
    entity_id: clinician.clinician_id,
    description: `Created new clinician: ${clinician.first_name} ${clinician.last_name}`,
    new_values: {
      clinician_id: clinician.clinician_id,
      username: clinician.username,
      email: clinician.email,
      is_admin: clinician.is_admin,
    },
  });

  return clinician;
}


export async function getAllClinicians(include_inactive = false) {
  return prisma.clinician.findMany({
    where: include_inactive ? {} : { is_active: true },
    select: {
      clinician_id: true,
      username: true,
      email: true,
      first_name: true,
      last_name: true,
      middle_name: true,
      phone: true,
      specialization: true,
      is_admin: true,
      is_active: true,
      last_login: true,
      created_at: true,
      updated_at: true,
      // Don't include password_hash in responses
    },
    orderBy: [
      { is_active: 'desc' },
      { last_name: 'asc' },
      { first_name: 'asc' }
    ]
  });
}

export async function getClinicianById(clinician_id: number) {
  return prisma.clinician.findUnique({
    where: { clinician_id },
    select: {
      clinician_id: true,
      username: true,
      email: true,
      first_name: true,
      last_name: true,
      middle_name: true,
      date_of_birth: true,
      age: true,
      gender: true,
      phone: true,
      mobile: true,
      address: true,
      city: true,
      state_province: true,
      postal_code: true,
      country: true,
      license_number: true,
      license_expiry_date: true,
      specialization: true,
      qualification: true,
      years_of_experience: true,
      institution: true,
      is_admin: true,
      is_active: true,
      last_login: true,
      profile_picture_path: true,
      created_at: true,
      updated_at: true,
    }
  });
}

export async function updateClinician(clinician_id: number, data: Partial<Clinician>, updated_by: number) {
  const oldData = await prisma.clinician.findUnique({
    where: { clinician_id }
  });

  const updatedClinician = await prisma.clinician.update({
    where: { clinician_id },
    data
  });

  await logActivity({
    user_id: updated_by,
    action: 'update_clinician',
    entity_type: 'clinician',
    entity_id: clinician_id,
    description: `Updated clinician: ${updatedClinician.first_name} ${updatedClinician.last_name}`,
    old_values: oldData,
    new_values: data
  });

  return updatedClinician;
}

export async function toggleClinicianStatus(clinician_id: number, updated_by: number) {
  const clinician = await prisma.clinician.findUnique({
    where: { clinician_id }
  });

  if (!clinician) {
    throw new Error('Clinician not found');
  }

  const updatedClinician = await prisma.clinician.update({
    where: { clinician_id },
    data: { is_active: !clinician.is_active }
  });

  await logActivity({
    user_id: updated_by,
    action: clinician.is_active ? 'deactivate_clinician' : 'activate_clinician',
    entity_type: 'clinician',
    entity_id: clinician_id,
    description: `${clinician.is_active ? 'Deactivated' : 'Activated'} clinician: ${clinician.first_name} ${clinician.last_name}`
  });

  return updatedClinician;
}