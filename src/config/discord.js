/**
 * Discord Configuration
 * Bot client configuration and intents
 */

const { GatewayIntentBits } = require('discord.js');

module.exports = {
  // Bot token from environment
  token: process.env.DISCORD_TOKEN,

  // Client ID for command registration
  clientId: process.env.DISCORD_CLIENT_ID,

  // Guild ID for development (faster command updates)
  guildId: process.env.DISCORD_GUILD_ID,

  // Required intents
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ],

  // Required roles for admin commands
  adminRoles: ['CUT Admin', 'Moderator']
};
