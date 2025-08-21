import fs from 'fs';
import path from 'path';
import { BotData, ChessUser } from './types';

const DATA_FILE_PATH = path.join(__dirname, 'data.json');

export function readData(): BotData {
  try {
    const data = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    return JSON.parse(data) as BotData;
  } catch (error) {
    // If file doesn't exist or is invalid, return default data
    const defaultData: BotData = {
      users: [],
      dailyStatsTime: '22:00',
      chatIds: []
    };
    writeData(defaultData);
    return defaultData;
  }
}

export function writeData(data: BotData): void {
  fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function addUser(username: string, realName: string): boolean {
  const data = readData();

  // Check if user already exists
  if (data.users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
    return false;
  }

  data.users.push({ username, realName });
  writeData(data);
  return true;
}

export function listUsers(): ChessUser[] {
  const data = readData();
  return data.users;
}

export function editUser(oldUsername: string, newUsername: string, newRealName: string): boolean {
  const data = readData();
  const userIndex = data.users.findIndex(
    user => user.username.toLowerCase() === oldUsername.toLowerCase()
  );

  if (userIndex === -1) {
    return false;
  }

  // Check if new username already exists (unless it's the same user)
  if (
    newUsername.toLowerCase() !== oldUsername.toLowerCase() &&
    data.users.some(user => user.username.toLowerCase() === newUsername.toLowerCase())
  ) {
    return false;
  }

  data.users[userIndex] = { username: newUsername, realName: newRealName };
  writeData(data);
  return true;
}

export function removeUser(username: string): boolean {
  const data = readData();
  const initialLength = data.users.length;

  data.users = data.users.filter(
    user => user.username.toLowerCase() !== username.toLowerCase()
  );

  if (data.users.length === initialLength) {
    return false;
  }

  writeData(data);
  return true;
}

export function getDailyStatsTime(): string {
  const data = readData();
  return data.dailyStatsTime;
}

export function setDailyStatsTime(time: string): boolean {
  // Validate time format (HH:MM)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(time)) {
    return false;
  }

  const data = readData();
  data.dailyStatsTime = time;
  writeData(data);
  return true;
}

export function addChatId(chatId: number): boolean {
  const data = readData();

  // Initialize chatIds if it doesn't exist
  if (!data.chatIds) {
    data.chatIds = [];
  }

  // Check if chat ID already exists
  if (data.chatIds.includes(chatId)) {
    return false;
  }

  data.chatIds.push(chatId);
  writeData(data);
  return true;
}

export function getChatIds(): number[] {
  const data = readData();
  return data.chatIds || [];
}
