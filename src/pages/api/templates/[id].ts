import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/database/client";
import { verifyToken } from "@/lib/auth/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const templateId = Number(id);

  if (!templateId) return res.status(400).json({ error: 'Invalid template id' });

  // Verify token for protected operations
  const token = req.cookies["auth_token"];
  const user = token ? verifyToken(token) : null;

  try {
    if (req.method === 'GET') {
      const template = await prisma.assessmentTemplate.findUnique({
        where: { template_id: templateId },
        include: { session_items: true }
      });
      if (!template) return res.status(404).json({ error: 'Template not found' });
      return res.status(200).json(template);
    }

    if (!user || !user.clinician_id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const { name, description, is_for_kids, difficulty_level, estimated_duration_minutes, items } = req.body as {
        name?: string;
        description?: string;
        is_for_kids?: boolean;
        difficulty_level?: string;
        estimated_duration_minutes?: number;
        items?: Array<{
          question?: string;
          sound?: string;
          ipa_key?: string;
          group?: string;
          consonants?: number;
          vowel?: number;
          image?: string;
          item_number?: number;
        }>;
      };
      // Only allow owner to update
      const existing = await prisma.assessmentTemplate.findUnique({ where: { template_id: templateId } });
      if (!existing) return res.status(404).json({ error: 'Template not found' });
      if (existing.created_by !== user.clinician_id) return res.status(403).json({ error: 'Forbidden' });

      const updated = await prisma.assessmentTemplate.update({
        where: { template_id: templateId },
        data: {
          name,
          description,
          is_for_kids,
          difficulty_level,
          ...(estimated_duration_minutes ? { estimated_duration_minutes } : {}),
          // For simplicity: replace session_items by deleting existing and creating new
          session_items: items && Array.isArray(items) ? {
            deleteMany: {},
            create: items.map((it, idx) => ({
              item_number: it.item_number ?? (idx + 1),
              question: it.question || '',
              sound: it.sound || null,
              ipa_key: it.ipa_key || null,
              consonant_group: it.group || null,
              consonants_count: it.consonants ?? 0,
              vowels_count: it.vowel ?? 0,
              image_url: it.image || null,
            }))
          } : undefined
        },
        include: { session_items: true }
      });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      const existing = await prisma.assessmentTemplate.findUnique({ where: { template_id: templateId } });
      if (!existing) return res.status(404).json({ error: 'Template not found' });
      if (existing.created_by !== user.clinician_id) return res.status(403).json({ error: 'Forbidden' });

      await prisma.sessionItem.deleteMany({ where: { template_id: templateId } });
      await prisma.assessmentTemplate.delete({ where: { template_id: templateId } });
      return res.status(204).end();
    }

    res.setHeader('Allow', ['GET','PUT','PATCH','DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Template handler error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
