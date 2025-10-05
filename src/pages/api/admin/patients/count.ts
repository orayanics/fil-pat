import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/database/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const count = await prisma.patient.count();
    return res.status(200).json({ count });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Failed to fetch patient count' });
  }
}
