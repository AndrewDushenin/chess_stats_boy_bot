export const commands = [
  {
    command: 'start',
    description: 'Почати роботу з ботом',
    help: '/start - Почати роботу з ботом',
  },
  {
    command: 'daily_stats',
    description: 'Статистика активності за останній день',
    help: '/daily_stats - Показати щоденну статистику всіх користувачів\n/daily_stats `{username}` - Показати щоденну статистику окремого користувача',
  },
  {
    command: 'full_stats',
    description: 'Повна статистика користувача',
    help: '/full_stats - Показати повну статистику всіх користувачів\n/full_stats `{username}` - Показати повну статистику окремого користувача',
  },
  {
    command: 'opening_stats',
    description: 'Статистика дебютів користувача',
    help: '/opening_stats `{username}` - Показати статистику дебютів для користувача',
  },
  {
    command: 'add',
    description: 'Додати користувача Lichess до відстеження',
    help: '/add `{username}` `{real name}` - Додати користувача Lichess до відстеження',
  },
  {
    command: 'edit',
    description: 'Редагувати користувача',
    help: '/edit `{username}` - Редагувати інформацію про користувача',
  },
  {
    command: 'remove',
    description: 'Видалити користувача',
    help: '/remove `{username}` - Видалити користувача зі списку',
  },
  {
    command: 'list',
    description: 'Показати список користувачів',
    help: '/list - Показати список відстежуваних користувачів',
  },
  {
    command: 'set_time',
    description: 'Встановити час для автоматичної щоденної статистики',
    help: '/set_time `{HH:MM}` - Встановити час для автоматичної щоденної статистики',
  },
  {
    command: 'help',
    description: 'Отримати довідку по командам',
    help: '/help - Отримати довідку по командам',
  },
];

export function getStartText(): string {
  return 'Вітаю! Я бот для отримання статистики з Lichess. Використовуйте команду /help для отримання списку всіх доступних команд.';
}

export function getHelpText(): string {
  return 'Доступні команди:\n\n' + commands.map((c) => c.help).join('\n');
}
