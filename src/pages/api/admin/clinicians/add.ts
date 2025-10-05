import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/database/client';
import { hashPassword } from '@/lib/auth/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { username, email, password, first_name, last_name, specialization, is_admin } = req.body;
  if (!username || !email || !password || !first_name || !last_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const password_hash = await hashPassword(password);
    const clinician = await prisma.clinician.create({
      data: {
        username,
        email,
        password_hash,
        first_name,
        last_name,
        specialization,
        is_admin: !!is_admin,
        is_active: true,
      }
    });
    return res.status(201).json({ clinician });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to add clinician' });
  }
}
