import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const dbPath = path.join(__dirname, 'localdata', 'clinician.sqlite3');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS clinicians (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

type Clinician = {
  id: number;
  username: string;
  password: string;
  created_at: string;
};

export function registerClinician(username: string, password: string) {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const stmt = db.prepare(`INSERT INTO clinicians (username, password) VALUES (?, ?)`);
  stmt.run(username, hashedPassword);
}

export function loginClinician(username: string, password: string): Clinician | null {
  const stmt = db.prepare(`SELECT * FROM clinicians WHERE username = ?`);
  const user = stmt.get(username) as Clinician | undefined;

  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  }
  return null;
}
