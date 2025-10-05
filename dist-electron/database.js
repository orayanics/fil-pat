"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerClinician = registerClinician;
exports.loginClinician = loginClinician;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dbPath = path_1.default.join(__dirname, 'localdata', 'clinician.sqlite3');
fs_1.default.mkdirSync(path_1.default.dirname(dbPath), { recursive: true });
const db = new better_sqlite3_1.default(dbPath);
db.exec(`
  CREATE TABLE IF NOT EXISTS clinicians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
function registerClinician(username, password) {
    const hashedPassword = bcryptjs_1.default.hashSync(password, 10);
    const stmt = db.prepare(`INSERT INTO clinicians (username, password) VALUES (?, ?)`);
    stmt.run(username, hashedPassword);
}
function loginClinician(username, password) {
    const stmt = db.prepare(`SELECT * FROM clinicians WHERE username = ?`);
    const user = stmt.get(username);
    if (user && bcryptjs_1.default.compareSync(password, user.password)) {
        return user;
    }
    return null;
}
