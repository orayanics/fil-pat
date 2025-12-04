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
          target_word?: string;
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
              target_word: it.target_word || null,
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

      // Check for force delete flag
      const forceDelete = req.query.force === 'true' || req.body?.force === true;

      // Check if template is being used in sessions
      const sessionsCount = await prisma.assessmentSession.count({
        where: { template_id: templateId }
      });

      if (sessionsCount > 0 && !forceDelete) {
        return res.status(400).json({ 
          error: 'Cannot delete template',
          message: `This template is being used in ${sessionsCount} session(s). You can force delete to end all sessions using this template.`,
          sessionsCount,
          canForceDelete: true
        });
      }

      // If force delete, end all sessions using this template
      if (forceDelete && sessionsCount > 0) {
        // Get all session items for this template to clear current_item_id references
        const sessionItems = await prisma.sessionItem.findMany({
          where: { template_id: templateId },
          select: { item_id: true }
        });
        const itemIds = sessionItems.map(item => item.item_id);

        // Clear current_item_id for any sessions pointing to items from this template
        if (itemIds.length > 0) {
          await prisma.$executeRaw`
            UPDATE assessment_sessions 
            SET current_item_id = NULL,
                updated_at = datetime('now')
            WHERE current_item_id IN (${itemIds.join(',')})
          `;
        }

        // Update ONLY non-completed sessions using this template: mark as completed and remove template reference
        // Completed sessions just get their template_id cleared but keep their status
        await prisma.$executeRaw`
          UPDATE assessment_sessions 
          SET status = CASE 
                WHEN status != 'Completed' THEN 'Completed'
                ELSE status
              END,
              end_time = CASE 
                WHEN status != 'Completed' AND end_time IS NULL THEN datetime('now')
                ELSE end_time
              END,
              post_session_notes = CASE 
                WHEN status != 'Completed' THEN 'Session ended due to template deletion. All session data has been preserved.'
                ELSE post_session_notes
              END,
              template_id = NULL,
              updated_at = datetime('now')
          WHERE template_id = ${templateId}
        `;

        // Clear template_id from session_items to disconnect them from the template
        // This preserves the items for historical session data while allowing template deletion
        await prisma.$executeRaw`
          UPDATE session_items 
          SET template_id = NULL,
              updated_at = datetime('now')
          WHERE template_id = ${templateId}
        `;
      }
      
      // Delete the template (session_items are preserved with template_id = NULL)
      await prisma.assessmentTemplate.delete({ where: { template_id: templateId } });
      
      return res.status(200).json({ 
        message: 'Template deleted successfully',
        endedSessions: forceDelete ? sessionsCount : 0
      });
    }

    res.setHeader('Allow', ['GET','PUT','PATCH','DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Template handler error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}
