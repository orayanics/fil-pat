import type { NextApiRequest, NextApiResponse } from "next";
import { verifyToken } from "@/lib/auth/auth";
import { prisma } from "@/lib/database/client";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    // Get auth token from cookies
    const token = req.cookies["auth_token"];
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const user = verifyToken(token);
    if (!user || !user.clinician_id) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
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
    if (!name || !difficulty_level) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const template = await prisma.assessmentTemplate.create({
        data: {
          name,
          description,
          is_for_kids,
          difficulty_level,
          ...(estimated_duration_minutes ? { estimated_duration_minutes } : {}),
          created_by: user.clinician_id,
          session_items: items && Array.isArray(items) ? {
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
          } : undefined,
        },
        include: { session_items: true }
      });
      return res.status(201).json(template);
    } catch (error) {
      console.error('Failed to create template', error);
      return res.status(500).json({ error: "Failed to create template" });
    }
  }

  if (req.method === 'GET') {
    // List templates for the authenticated clinician
    const token = req.cookies['auth_token'];
    if (!token) return res.status(401).json({ error: 'Not authenticated' });
    const user = verifyToken(token);
    if (!user || !user.clinician_id) return res.status(401).json({ error: 'Invalid token' });
    try {
      const templates = await prisma.assessmentTemplate.findMany({
        where: { created_by: user.clinician_id },
        include: { session_items: true },
        orderBy: { created_at: 'desc' }
      });
      return res.status(200).json(templates);
    } catch (error) {
      console.error('Failed to list templates', error);
      return res.status(500).json({ error: 'Failed to list templates' });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
