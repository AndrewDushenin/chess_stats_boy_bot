import TelegramBot, {
  InlineQueryResultArticle,
  InputTextMessageContent,
} from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { format } from 'date-fns';
import { ChessUser } from './types';
import * as db from './db';
import * as lichessService from './lichessService';
import { text } from 'stream/consumers';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('TELEGRAM_BOT_TOKEN is not set in .env file');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });
const timezone = process.env.TIMEZONE || 'Europe/Kiev';

const helpText =
  'Доступні команди:\n\n' +
  '/start - Почати роботу з ботом\n' +
  '/help - Отримати довідку по командам\n' +
  '/add {username} {real name} - Додати користувача Lichess до відстеження\n' +
  '/list - Показати список відстежуваних користувачів\n' +
  '/edit {username} - Редагувати інформацію про користувача\n' +
  '/daily_stats - Показати щоденну статистику всіх користувачів\n' +
  '/daily_stats {username} - Показати щоденну статистику конкретного користувача\n' +
  '/full_stats {username} - Показати повну статистику користувача\n' +
  '/set_time {HH:MM} - Встановити час для автоматичної щоденної статистики';

const botCommands = [
  { command: 'start', description: 'Почати роботу з ботом' },
  { command: 'help', description: 'Отримати довідку по командам' },
  { command: 'add', description: 'Додати користувача Lichess до відстеження' },
  { command: 'list', description: 'Показати список користувачів' },
  { command: 'edit', description: 'Редагувати користувача' },
  { command: 'daily_stats', description: 'Щоденна статистика' },
  { command: 'full_stats', description: 'Повна статистика' },
  { command: 'set_time', description: 'Встановити час для статистики' },
];

bot.on('inline_query', async (query) => {
  const inlineQueryId = query.id;
  const queryText = query.query.trim();
  try {
    const users = db.getUsers();
    let results: InlineQueryResultArticle[] = [];

    if (queryText === '') {
      results = [
        {
          type: 'article',
          id: 'help',
          title: 'Допомога',
          description: 'Показати список доступних команд',
          input_message_content: {
            message_text: helpText,
          } as InputTextMessageContent,
        },
        {
          type: 'article',
          id: 'list',
          title: 'Список користувачів',
          description: 'Показати список відстежуваних користувачів',
          input_message_content: {
            message_text:
              users.length === 0
                ? 'Список користувачів порожній'
                : `Список користувачів:\n${users
                    .map((user) => `${user.username} (${user.realName})`)
                    .join('\n')}`,
          } as InputTextMessageContent,
        },
        {
          type: 'article',
          id: 'daily_stats',
          title: 'Щоденна статистика',
          description: 'Показати щоденну статистику всіх користувачів',
          input_message_content: {
            message_text:
              'Використовуйте команду /daily_stats для отримання щоденної статистики',
          } as InputTextMessageContent,
        },
      ];
    } else if (queryText.startsWith('daily_stats')) {
      const username = queryText.replace('daily_stats', '').trim();
      if (username) {
        const user = users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase()
        );
        if (user) {
          const stats = await lichessService.getDailyStats(
            user.username,
            user.realName
          );
          results = [
            {
              type: 'article',
              id: 'daily_stats_user',
              title: `Щоденна статистика для ${user.username}`,
              description: `Статистика для ${user.realName}`,
              input_message_content: {
                message_text: stats
                  ? formatDailyStats([stats])
                  : `Не вдалося отримати статистику для користувача ${username}`,
              } as InputTextMessageContent,
            },
          ];
        } else {
          results = [
            {
              type: 'article',
              id: 'user_not_found',
              title: 'Користувач не знайдений',
              description: `Користувач ${username} не знайдений у списку`,
              input_message_content: {
                message_text: `Користувач ${username} не знайдений у списку`,
              } as InputTextMessageContent,
            },
          ];
        }
      } else {
        results = [
          {
            type: 'article',
            id: 'daily_stats_all',
            title: 'Щоденна статистика всіх користувачів',
            description: 'Отримання статистики для всіх користувачів',
            input_message_content: {
              message_text:
                'Використовуйте команду /daily_stats для отримання щоденної статистики всіх користувачів',
            } as InputTextMessageContent,
          },
        ];
      }
    } else if (queryText.startsWith('full_stats')) {
      const username = queryText.replace('full_stats', '').trim();
      if (username) {
        const user = users.find(
          (u) => u.username.toLowerCase() === username.toLowerCase()
        );
        if (user) {
          const userData = await lichessService.getUserData(username);
          results = [
            {
              type: 'article',
              id: 'full_stats_user',
              title: `Повна статистика для ${user.username}`,
              description: `Статистика для ${user.realName}`,
              input_message_content: {
                message_text: userData
                  ? formatFullStats(userData, user)
                  : `Не вдалося отримати дані для користувача ${username}`,
              } as InputTextMessageContent,
            },
          ];
        } else {
          results = [
            {
              type: 'article',
              id: 'user_not_found',
              title: 'Користувач не знайдений',
              description: `Користувач ${username} не знайдений у списку`,
              input_message_content: {
                message_text: `Користувач ${username} не знайдений у списку`,
              } as InputTextMessageContent,
            },
          ];
        }
      } else {
        results = [
          {
            type: 'article',
            id: 'full_stats_prompt',
            title: "Введіть ім'я користувача",
            description: 'Використовуйте формат: full_stats {username}',
            input_message_content: {
              message_text:
                'Використовуйте команду /full_stats {username} для отримання повної статистики користувача',
            } as InputTextMessageContent,
          },
        ];
      }
    } else {
      const matchingUsers = users.filter(
        (user) =>
          user.username.toLowerCase().includes(queryText.toLowerCase()) ||
          user.realName.toLowerCase().includes(queryText.toLowerCase())
      );
      if (matchingUsers.length > 0) {
        results = matchingUsers.map((user) => ({
          type: 'article',
          id: `user_${user.username}`,
          title: user.username,
          description: user.realName,
          input_message_content: {
            message_text:
              `Інформація про користувача ${user.username} (${user.realName}):\n` +
              `Використовуйте /daily_stats ${user.username} для отримання щоденної статистики\n` +
              `Використовуйте /full_stats ${user.username} для отримання повної статистики`,
          } as InputTextMessageContent,
        }));
      } else {
        results = [
          {
            type: 'article',
            id: 'no_results',
            title: 'Нічого не знайдено',
            description: 'Спробуйте інший запит або перегляньте список команд',
            input_message_content: {
              message_text: helpText,
            } as InputTextMessageContent,
          },
        ];
      }
    }
    await bot.answerInlineQuery(inlineQueryId, results);
  } catch (error) {
    console.error('Error handling inline query:', error);
    await bot.answerInlineQuery(inlineQueryId, [
      {
        type: 'article',
        id: 'error',
        title: 'Помилка',
        description: 'Сталася помилка при обробці запиту',
        input_message_content: {
          message_text:
            'Сталася помилка при обробці запиту. Спробуйте пізніше.',
        } as InputTextMessageContent,
      },
    ]);
  }
});

bot
  .setMyCommands(botCommands)
  .then(() => console.log('Bot commands have been set'))
  .catch((error) => console.error('Error setting bot commands:', error));

function storeChatId(chatId: number): void {
  db.addChatId(chatId);
}

// Command handlers
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  storeChatId(chatId);
  bot.sendMessage(
    chatId,
    'Привіт! Я бот для отримання статистики з Lichess. Використовуйте команду /help для отримання списку всіх доступних команд.'
  );
});

// Help command
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id;
  storeChatId(chatId);
  bot.sendMessage(
    chatId,
    'Доступні команди:\n\n' +
      '/start - Почати роботу з ботом\n' +
      '/help - Отримати довідку по командам\n' +
      '/add {username} {real name} - Додати користувача Lichess до відстеження\n' +
      '/list - Показати список відстежуваних користувачів\n' +
      '/edit {username} - Редагувати інформацію про користувача\n' +
      '/daily_stats - Показати щоденну статистику всіх користувачів\n' +
      '/daily_stats {username} - Показати щоденну статистику конкретного користувача\n' +
      '/full_stats {username} - Показати повну статистику користувача\n' +
      '/set_time {HH:MM} - Встановити час для автоматичної щоденної статистики'
  );
});

// Add user command
bot.onText(/\/add (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  storeChatId(chatId);

  if (!match || !match[1]) {
    bot.sendMessage(
      chatId,
      'Використовуйте формат: /add {username} {real name}'
    );
    return;
  }

  const params = match[1].trim().split(' ');

  if (params.length < 2) {
    bot.sendMessage(
      chatId,
      'Використовуйте формат: /add {username} {real name}'
    );
    return;
  }

  const username = params[0];
  const realName = params.slice(1).join(' ');

  // Validate username exists on Lichess
  const userData = await lichessService.getUserData(username);
  if (!userData) {
    bot.sendMessage(chatId, `Користувач ${username} не знайдений на Lichess`);
    return;
  }

  const success = db.addUser(username, realName);

  if (success) {
    bot.sendMessage(
      chatId,
      `Користувач ${username} (${realName}) успішно доданий`
    );
  } else {
    bot.sendMessage(chatId, `Користувач ${username} вже існує`);
  }
});

// List users command
bot.onText(/\/list/, (msg) => {
  const chatId = msg.chat.id;
  storeChatId(chatId);
  const users = db.getUsers();

  if (users.length === 0) {
    bot.sendMessage(chatId, 'Список користувачів порожній');
    return;
  }

  const userList = users
    .map((user) => `${user.username} (${user.realName})`)
    .join('\n');
  bot.sendMessage(chatId, `Список користувачів:\n${userList}`);
});

// Edit user command
bot.onText(/\/edit (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  storeChatId(chatId);

  if (!match || !match[1]) {
    bot.sendMessage(chatId, 'Використовуйте формат: /edit {username}');
    return;
  }

  const username = match[1].trim();
  const users = db.getUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    bot.sendMessage(chatId, `Користувач ${username} не знайдений`);
    return;
  }

  // Store the username being edited in the user's session
  userSessions.set(chatId, { editingUser: username });

  bot.sendMessage(
    chatId,
    `Редагування користувача ${username} (${user.realName}).\n` +
      "Введіть новий нікнейм та ім'я у форматі: {username} {real name}"
  );
});

// Daily stats command
bot.onText(/\/daily_stats(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  storeChatId(chatId);

  if (match && match[1]) {
    // Get stats for specific user
    const username = match[1].trim();
    await sendUserDailyStats(chatId, username);
  } else {
    // Get stats for all users
    await sendAllUsersDailyStats(chatId);
  }
});

// Full stats command
bot.onText(/\/full_stats (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  storeChatId(chatId);

  if (!match || !match[1]) {
    bot.sendMessage(chatId, 'Використовуйте формат: /full_stats {username}');
    return;
  }

  const username = match[1].trim();
  const users = db.getUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    bot.sendMessage(chatId, `Користувач ${username} не знайдений у списку`);
    return;
  }

  const userData = await lichessService.getUserData(username);

  if (!userData) {
    bot.sendMessage(
      chatId,
      `Не вдалося отримати дані для користувача ${username}`
    );
    return;
  }

  const message = formatFullStats(userData, user);
  bot.sendMessage(chatId, message);
});

// Set time command
bot.onText(/\/set_time (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  storeChatId(chatId);

  if (!match || !match[1]) {
    bot.sendMessage(chatId, 'Використовуйте формат: /set_time {HH:MM}');
    return;
  }

  const time = match[1].trim();
  const success = db.setDailyStatsTime(time);

  if (success) {
    bot.sendMessage(chatId, `Час щоденної статистики встановлено на ${time}`);
    scheduleDailyStats();
  } else {
    bot.sendMessage(
      chatId,
      'Невірний формат часу. Використовуйте формат HH:MM (наприклад, 22:00)'
    );
  }
});

// Remove user command
bot.onText(/\/remove (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  db.addChatId(chatId);

  if (!match || !match[1]) {
    bot.sendMessage(chatId, 'Використовуйте формат: /remove {username}');
    return;
  }

  const username = match[1].trim();
  const success = db.removeUser(username);

  if (success) {
    bot.sendMessage(chatId, `Користувач ${username} видалений`);
  } else {
    bot.sendMessage(chatId, `Користувача ${username} не знайдено`);
  }
});

// Handle text messages (for editing users)
const userSessions = new Map<number, { editingUser?: string }>();

bot.on('text', async (msg) => {
  const chatId = msg.chat.id;
  storeChatId(chatId);
  const text = msg.text;

  // Skip commands or empty messages
  if (!text || text.startsWith('/')) {
    return;
  }

  const session = userSessions.get(chatId);

  if (session?.editingUser) {
    const params = text.split(' ');

    if (params.length < 2) {
      bot.sendMessage(chatId, 'Використовуйте формат: {username} {real name}');
      return;
    }

    const newUsername = params[0];
    const newRealName = params.slice(1).join(' ');

    // Validate new username exists on Lichess
    const userData = await lichessService.getUserData(newUsername);
    if (!userData) {
      bot.sendMessage(
        chatId,
        `Користувач ${newUsername} не знайдений на Lichess`
      );
      return;
    }

    const success = db.editUser(session.editingUser, newUsername, newRealName);

    if (success) {
      bot.sendMessage(
        chatId,
        `Користувач ${session.editingUser} успішно змінений на ${newUsername} (${newRealName})`
      );
    } else {
      bot.sendMessage(
        chatId,
        `Помилка при редагуванні користувача ${session.editingUser}`
      );
    }

    // Clear the session
    userSessions.delete(chatId);
  }
});

// Helper functions
async function sendUserDailyStats(
  chatId: number,
  username: string
): Promise<void> {
  const users = db.getUsers();
  const user = users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );

  if (!user) {
    bot.sendMessage(chatId, `Користувач ${username} не знайдений у списку`);
    return;
  }

  const stats = await lichessService.getDailyStats(
    user.username,
    user.realName
  );

  if (!stats) {
    bot.sendMessage(
      chatId,
      `Не вдалося отримати статистику для користувача ${username}`
    );
    return;
  }

  const message = formatDailyStats([stats]);
  bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
}

async function sendAllUsersDailyStats(chatId: number): Promise<void> {
  const users = db.getUsers();

  if (users.length === 0) {
    bot.sendMessage(chatId, 'Список користувачів порожній');
    return;
  }

  bot.sendMessage(chatId, 'Отримання статистики для всіх користувачів...');

  const statsPromises = users.map((user) =>
    lichessService.getDailyStats(user.username, user.realName)
  );

  const statsResults = await Promise.all(statsPromises);
  const validStats = statsResults.filter(Boolean);

  if (validStats.length === 0) {
    bot.sendMessage(
      chatId,
      'Не вдалося отримати статистику для жодного користувача'
    );
    return;
  }

  const message = formatDailyStats(
    validStats as NonNullable<
      Awaited<ReturnType<typeof lichessService.getDailyStats>>
    >[]
  );
  bot.sendMessage(chatId, message, { parse_mode: 'MarkdownV2' });
}

async function sendDailyStatsToAllChats(): Promise<void> {
  const users = db.getUsers();

  if (users.length === 0) {
    console.log('No users to send stats for');
    return;
  }

  const statsPromises = users.map((user) =>
    lichessService.getDailyStats(user.username, user.realName)
  );

  const statsResults = await Promise.all(statsPromises);
  const validStats = statsResults.filter(Boolean);

  if (validStats.length === 0) {
    console.log('Failed to get stats for any user');
    return;
  }

  const message = formatDailyStats(
    validStats as NonNullable<
      Awaited<ReturnType<typeof lichessService.getDailyStats>>
    >[]
  );

  // Send to all chats that have interacted with the bot
  const chatIds = db.getChatIds();
  console.log(`Sending daily stats to ${chatIds.length} chats`);

  for (const chatId of chatIds) {
    bot
      .sendMessage(chatId, message)
      .catch((error) =>
        console.error(`Error sending message to chat ${chatId}:`, error)
      );
  }
}

function escapeMarkdownV2(text: string) {
  return text
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/~/g, '\\~')
    .replace(/-/g, '\\-')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

function formatDailyStats(
  statsList: Array<
    NonNullable<Awaited<ReturnType<typeof lichessService.getDailyStats>>>
  >
): string {
  const date = format(new Date(), 'dd.MM.yyyy');
  let message = `Статистика за ${escapeMarkdownV2(date)}\n\n`;

  for (const stats of statsList) {
    const gamesTotal =
      stats.gamesPlayed.bullet +
      stats.gamesPlayed.blitz +
      stats.gamesPlayed.rapid +
      stats.gamesPlayed.classical;

    const puzzlesTotal = stats.puzzlesSolved.win + stats.puzzlesSolved.loss;

    let mood = '😃';
    if (gamesTotal === 0 && puzzlesTotal === 0) {
      mood = '😡';
    } else if (gamesTotal === 0 || puzzlesTotal === 0) {
      mood = '🤔';
    }

    message += `👤 ${escapeMarkdownV2(stats.username)} \\(${escapeMarkdownV2(
      stats.realName
    )}\\) ${mood}\n`;

    message += '```\n';

    if (gamesTotal === 0) {
      message += `🎮 → Жодної партії 🤷‍♂️\n`;
    } else {
      message += `🎮 → 🔫 ${stats.gamesPlayed.bullet ?? 0} ⚡️${
        stats.gamesPlayed.blitz ?? 0
      } 🐇${stats.gamesPlayed.rapid ?? 0} 🐢 ${
        stats.gamesPlayed.classical ?? 0
      }\n`;
    }

    if (puzzlesTotal === 0) {
      message += `\n🧩 → Жодної задачі 🤷‍♂️\n`;
    } else {
      message += `\n🧩 → ✅ ${stats.puzzlesSolved.win ?? 0} 🚫 ${
        stats.puzzlesSolved.loss ?? 0
      }\n`;
    }
    message += `\n📈 ≈${stats.averageRating} ELO   🧮 ${stats.totalRatedGames} games\n`;
    message += '```\n\n';
  }

  return message.trim();
}

function formatFullStats(
  userData: NonNullable<Awaited<ReturnType<typeof lichessService.getUserData>>>,
  user: ChessUser
): string {
  let message = `Повна статистика для ${user.username} (${user.realName}):\n\n`;

  message += `Профіль: https://lichess.org/@/${userData.username}\n`;
  message += `Створений: ${format(
    new Date(userData.createdAt),
    'dd.MM.yyyy'
  )}\n`;
  message += `Остання активність: ${format(
    new Date(userData.seenAt),
    'dd.MM.yyyy HH:mm'
  )}\n\n`;

  message += 'Рейтинги:\n';
  if (userData.perfs.bullet) {
    message += `Куля: ${userData.perfs.bullet.rating} (${userData.perfs.bullet.games} ігор)\n`;
  }
  if (userData.perfs.blitz) {
    message += `Бліц: ${userData.perfs.blitz.rating} (${userData.perfs.blitz.games} ігор)\n`;
  }
  if (userData.perfs.rapid) {
    message += `Рапід: ${userData.perfs.rapid.rating} (${userData.perfs.rapid.games} ігор)\n`;
  }
  if (userData.perfs.puzzle) {
    message += `Задачі: ${userData.perfs.puzzle.rating} (${userData.perfs.puzzle.games} задач)\n`;
  }

  message += '\nСтатистика ігор:\n';
  message += `Всього ігор: ${userData.count.all}\n`;
  message += `Рейтингових ігор: ${userData.count.rated}\n`;
  message += `Перемог: ${userData.count.win} (${Math.round(
    (userData.count.win / userData.count.all) * 100
  )}%)\n`;
  message += `Нічиїх: ${userData.count.draw} (${Math.round(
    (userData.count.draw / userData.count.all) * 100
  )}%)\n`;
  message += `Поразок: ${userData.count.loss} (${Math.round(
    (userData.count.loss / userData.count.all) * 100
  )}%)\n`;

  return message;
}

function formatRatingChange(change: number): string {
  if (change > 0) {
    return `+${change}`;
  } else if (change < 0) {
    return `${change}`;
  } else {
    return '0';
  }
}

// Schedule daily stats
let dailyStatsJob: cron.ScheduledTask | null = null;

function scheduleDailyStats(): void {
  // Cancel existing job if any
  if (dailyStatsJob) {
    dailyStatsJob.stop();
  }

  const time = db.getDailyStatsTime();
  const [hours, minutes] = time.split(':');

  // Schedule new job
  dailyStatsJob = cron.schedule(
    `${minutes} ${hours} * * *`,
    async () => {
      console.log(`Running scheduled daily stats at ${time}`);

      // Call sendDailyStatsToAllChats to send stats to all stored chat IDs
      await sendDailyStatsToAllChats();
    },
    {
      timezone,
    }
  );

  console.log(`Daily stats scheduled for ${time}`);
}

// Initialize scheduled job
scheduleDailyStats();

console.log('Bot started');
