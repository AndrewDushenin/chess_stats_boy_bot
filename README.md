# Chess Stats Bot

A Telegram bot that provides daily chess statistics from Lichess for specified users.

## Features

- Add, list, and edit Lichess users
- Get daily statistics for all users or a specific user
- Get full statistics for a specific user
- Schedule daily statistics at a specific time
- Automatically send daily statistics to all chats that have interacted with the bot

## Commands

- `/start` - Show help message
- `/add {username} {real name}` - Add a user to the bot
- `/list` - Show the list of users
- `/edit {username}` - Edit a user
- `/daily_stats` - Show daily statistics for all users
- `/daily_stats {username}` - Show daily statistics for a specific user
- `/full_stats {username}` - Show full statistics for a specific user
- `/set_time {HH:MM}` - Set the time for daily statistics (default: 22:00)

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   TIMEZONE=Europe/Kiev
   ```
4. Build the project:
   ```
   npm run build
   ```
5. Run the bot:
   ```
   npm start
   ```

## Development

1. Install dependencies:
   ```
   npm install
   ```
2. Run the bot in development mode:
   ```
   npm run dev
   ```

## Technologies Used

- TypeScript
- node-telegram-bot-api
- axios
- node-cron
- date-fns
- dotenv

## Data Storage

User data is stored in a JSON file (`src/data.json`). The file is created automatically if it doesn't exist.

## Lichess API

The bot uses the following Lichess API endpoints:
- `https://lichess.org/api/user/{username}` - Get user information
- `https://lichess.org/api/user/{username}/activity` - Get user activity