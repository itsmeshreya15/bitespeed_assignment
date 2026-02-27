import Database from "better-sqlite3";

export const db = new Database("contacts.db");

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS Contact (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phoneNumber TEXT,
    email TEXT,
    linkedId INTEGER,
    linkPrecedence TEXT CHECK(linkPrecedence IN ('primary', 'secondary')) NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    deletedAt TEXT
  );
`);

