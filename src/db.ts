import Database from 'better-sqlite3';
import { ChessUser } from './types';

const db = new Database('users.db');

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    realname TEXT
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS chats (
    chat_id INTEGER PRIMARY KEY
  )
`
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`
).run();

export function addUser(username: string, realName: string): boolean {
  try {
    const stmt = db.prepare(
      'INSERT INTO users (username, realname) VALUES (?, ?)'
    );
    stmt.run(username, realName);
    return true;
  } catch (e) {
    return false;
  }
}

export function getUsers(): ChessUser[] {
  const stmt = db.prepare('SELECT username, realname FROM users');
  return stmt.all().map((row: any) => ({
    username: row.username,
    realName: row.realname,
  }));
}

export function removeUser(username: string): boolean {
  const stmt = db.prepare('DELETE FROM users WHERE username = ?');
  const info = stmt.run(username);
  return info.changes > 0;
}

export function editUser(
  oldUsername: string,
  newUsername: string,
  newRealName: string
): boolean {
  const stmt = db.prepare(
    'UPDATE users SET username = ?, realname = ? WHERE username = ?'
  );
  const info = stmt.run(newUsername, newRealName, oldUsername);
  return info.changes > 0;
}

export function addChatId(chatId: number): void {
  db.prepare('INSERT OR IGNORE INTO chats (chat_id) VALUES (?)').run(chatId);
}

export function getChatIds(): number[] {
  return db
    .prepare('SELECT chat_id FROM chats')
    .all()
    .map((row: any) => row.chat_id);
}

export function setDailyStatsTime(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  db.prepare(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('dailyStatsTime', ?)"
  ).run(time);
  return true;
}

export function bob(): string {
  return 'Hello, Bob!';
}

export function getDailyStatsTime(): string {
  const row = db
    .prepare("SELECT value FROM settings WHERE key = 'dailyStatsTime'")
    .get() as { value?: string } | undefined;
  return row && typeof row.value === 'string' ? row.value : '22:00';
}
