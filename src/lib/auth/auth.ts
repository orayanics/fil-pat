import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { prisma } from '../database/client';

const JWT_SECRET = process.env.JWT_SECRET || 'filpat';
const JWT_EXPIRES_IN = '24h';

export interface AuthUser {
  clinician_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  is_active: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      clinician_id: user.clinician_id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.log('Token verification error:', error);
    return null;
  }
}

export async function authenticateUser(username: string, password: string): Promise<AuthUser | null> {
  try {
    const clinician = await prisma.clinician.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ],
        is_active: true
      }
    });

    if (!clinician) {
      return null;
    }

    const isValidPassword = await verifyPassword(password, clinician.password_hash);
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    await prisma.clinician.update({
      where: { clinician_id: clinician.clinician_id },
      data: { last_login: new Date() }
    });

    // Log successful login
    await logActivity({
      user_id: clinician.clinician_id,
      action: 'login',
      description: `Successful login for user: ${clinician.username}`,
      success: true
    });

    return {
      clinician_id: clinician.clinician_id,
      username: clinician.username,
      email: clinician.email,
      first_name: clinician.first_name,
      last_name: clinician.last_name,
      is_admin: clinician.is_admin,
      is_active: clinician.is_active
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

interface LogActivityParams {
  user_id?: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  description?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  session_uuid?: string;
  success?: boolean;
  error_message?: string;
}

export async function logActivity(params: LogActivityParams) {
  try {
    await prisma.activityLog.create({
      data: {
        user_id: params.user_id,
        action: params.action,
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        description: params.description,
        old_values: params.old_values ? JSON.stringify(params.old_values) : null,
        new_values: params.new_values ? JSON.stringify(params.new_values) : null,
        ip_address: params.ip_address,
        user_agent: params.user_agent,
        session_uuid: params.session_uuid,
        success: params.success ?? true,
        error_message: params.error_message,
      }
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}