"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerClinician = registerClinician;
exports.loginClinician = loginClinician;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
// --- Register a new clinician ---
async function registerClinician(username, password) {
    // Hash password before saving
    const password_hash = await bcrypt_1.default.hash(password, 10);
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
async function loginClinician(username, password) {
    const user = await prisma.clinician.findUnique({
        where: { username },
    });
    if (!user)
        return null;
    const passwordValid = await bcrypt_1.default.compare(password, user.password_hash);
    if (!passwordValid)
        return null;
    // Optionally, update last_login
    await prisma.clinician.update({
        where: { clinician_id: user.clinician_id },
        data: { last_login: new Date() },
    });
    // Remove hash before returning
    const { password_hash, ...safeUser } = user;
    return safeUser;
}
