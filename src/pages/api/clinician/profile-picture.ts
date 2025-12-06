import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/database/client";
import { verifyToken } from "@/lib/auth/auth";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB limit
const SUPPORTED_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

interface DataUriDetails {
  mimeType: string;
  base64Payload: string;
}

function parseDataUri(value: string): DataUriDetails | null {
  if (!value.startsWith("data:")) {
    return null;
  }

  const match = value.match(/^data:(.*?);base64,/);
  if (!match || match.length < 2) {
    return null;
  }

  const mimeType = match[1];
  const base64Payload = value.substring(match[0].length);

  if (!mimeType || !base64Payload) {
    return null;
  }

  return { mimeType, base64Payload };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies["auth_token"];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = verifyToken(token);

  if (!user || !user.clinician_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const clinicianId = user.clinician_id;

  if (req.method === "POST") {
    const { imageData } = req.body || {};

    if (!imageData || typeof imageData !== "string") {
      return res.status(400).json({ error: "Missing image data" });
    }

    const parsed = parseDataUri(imageData);

    if (!parsed) {
      return res.status(400).json({ error: "Invalid image format" });
    }

    if (!SUPPORTED_MIME_TYPES.has(parsed.mimeType)) {
      return res.status(400).json({ error: "Unsupported image type" });
    }

    const buffer = Buffer.from(parsed.base64Payload, "base64");

    if (buffer.length > MAX_IMAGE_BYTES) {
      return res.status(413).json({ error: "Image is too large. Max 2MB." });
    }

    try {
      const updated = await prisma.clinician.update({
        where: { clinician_id: clinicianId },
        data: { profile_picture_path: imageData },
        select: { profile_picture_path: true },
      });

      return res.status(200).json({ profile_picture_path: updated.profile_picture_path });
    } catch (error) {
      console.error("Failed to update profile picture", error);
      return res.status(500).json({ error: "Failed to save profile picture" });
    }
  }

  if (req.method === "DELETE") {
    try {
      await prisma.clinician.update({
        where: { clinician_id: clinicianId },
        data: { profile_picture_path: null },
      });

      return res.status(200).json({ profile_picture_path: null });
    } catch (error) {
      console.error("Failed to delete profile picture", error);
      return res.status(500).json({ error: "Failed to remove profile picture" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "4mb",
    },
  },
};
