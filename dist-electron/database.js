"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerClinician = registerClinician;
exports.loginClinician = loginClinician;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const electron_1 = require("electron");
const path = __importStar(require("path"));
// Configure Prisma for packaged app
const isDev = !electron_1.app.isPackaged;
const prismaConfig = isDev ? {} : {
    // In production, point to unpacked Prisma binaries
    __internal: {
        engine: {
            binaryPath: path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', '.prisma', 'client')
        }
    }
};
const prisma = new client_1.PrismaClient(prismaConfig);
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
