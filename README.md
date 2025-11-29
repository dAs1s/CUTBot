# CUTBot - Discord Bot

Discord bot component for the Chosen Undead Tournament ladder system.

## Setup

### Prerequisites

- Node.js 18.x LTS or higher
- npm 9.x or higher
- Discord bot token from Discord Developer Portal

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Configuration

Edit `.env` file with your settings:

```env
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_GUILD_ID=your_guild_id_here
API_BASE_URL=http://localhost:3000/api/v1
API_KEY=your_api_key_here
```

### Running

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## Project Structure

```
cutbot/
├── src/
│   ├── index.js              # Entry point
│   ├── bot.js                # Bot client initialization
│   ├── config/               # Configuration modules
│   ├── commands/             # Slash command handlers
│   ├── events/               # Discord event handlers
│   ├── utils/                # Utility modules
│   └── constants/            # Constants and enums
├── logs/                     # Log files (auto-created)
├── .env                      # Environment variables (not in git)
├── .env.example              # Environment template
└── package.json              # Dependencies
```

## Commands

- `/inputUser` - Register new player (Admin only)
- `/deleteUser` - Remove player (Admin only)
- `/recordMatch` - Record match result
- `/mystats` - View your statistics
- `/stats` - View player statistics
- `/ladder` - View ladder rankings
- `/help` - Display command help

## Development

### Code Style

- ESLint for linting
- Prettier for formatting
- Run `npm run lint` to check code
- Run `npm run format` to format code

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Deployment

See main project README for deployment instructions.

## Support

For issues or questions, see main project documentation.
