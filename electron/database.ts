import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// --- Register a new clinician ---
export async function registerClinician(username: string, password: string) {
  // Hash password before saving
  const password_hash = await bcrypt.hash(password, 10);

  return await prisma.clinician.create({
    data: {
      username,
      email: `${username}@example.com`, // placeholder, adjust later
      password_hash,
      first_name: "New",
      last_name: "Clinician",
      is_active: true,
      created_by: null, // since created_by is Int?
    },
  });
}

// --- Login existing clinician ---
export async function loginClinician(username: string, password: string) {
  const user = await prisma.clinician.findUnique({
    where: { username },
  });

  if (!user) return null;

  const passwordValid = await bcrypt.compare(password, user.password_hash);
  if (!passwordValid) return null;

  // Optionally, update last_login
  await prisma.clinician.update({
    where: { clinician_id: user.clinician_id },
    data: { last_login: new Date() },
  });

  // Remove hash before returning
  const { password_hash, ...safeUser } = user;
  return safeUser;
}
