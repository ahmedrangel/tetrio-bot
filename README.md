# Tetrio-Bot
A Tetris bot capable of automatically playing custom multiplayer matches in TETR.IO. It uses a modified version of [ElTetris](https://github.com/ielashi/eltetris) to analyze the current board for optimal moves and the [@haelp/teto](https://github.com/Genius6942/triangle) library to interact with main game API.

This project can be a good starting point to start developing tetrio bots.

## Quick Setup
1. Install dependencies.
```bash
pnpm i
```

2. Create `.env` file and add your `TETRIO_TOKEN` or `TETRIO_USERNAME`, `TETRIO_PASSWORD` secrets.
```bash
# .env

TETRIO_TOKEN = "your_tetrio_bot_token"

# or

TETRIO_USERNAME = "your_tetrio_username"
TETRIO_PASSWORD = "your_tetrio_password"
```

3. Start the bot
```bash
pnpm start
```

4. If the login is successful, the bot will create a custom private match with autostart settings, and the room code will be logged to the console like `Joined room: ABCD`.

## Demo
The bot is the one on the right side.

https://github.com/user-attachments/assets/1eb69085-c2a1-4432-ad46-1371088a2901

