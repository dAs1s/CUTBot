/**
 * Slash Command Registry
 * Defines and registers all Discord slash commands
 */

const { SlashCommandBuilder } = require('discord.js');
const { REST, Routes } = require('discord.js');
const discordConfig = require('../config/discord');
const logger = require('../utils/logger');

// Define all slash commands
const commands = [
  // /inputUser - Register new player (Admin only)
  new SlashCommandBuilder()
    .setName('inputuser')
    .setDescription('Register a new player in the ladder system')
    .addStringOption(option =>
      option
        .setName('username')
        .setDescription('In-game username (3-20 characters, alphanumeric + underscore)')
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(20)
    )
    .addStringOption(option =>
      option
        .setName('twitch_name')
        .setDescription('Twitch username')
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(25)
    )
    .addUserOption(option =>
      option
        .setName('discord_mention')
        .setDescription('Discord user to link')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(0) // Admin only
    .toJSON(),

  // /deleteUser - Remove player (Admin only)
  new SlashCommandBuilder()
    .setName('deleteuser')
    .setDescription('Remove a player from the ladder system')
    .addStringOption(option =>
      option
        .setName('username')
        .setDescription('Username to delete')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .setDefaultMemberPermissions(0) // Admin only
    .toJSON(),

  // /recordMatch - Record match result
  new SlashCommandBuilder()
    .setName('recordmatch')
    .setDescription('Record a match result and update ratings')
    .addStringOption(option =>
      option
        .setName('winner')
        .setDescription('Winner username')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addStringOption(option =>
      option
        .setName('loser')
        .setDescription('Loser username')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption(option =>
      option
        .setName('winner_score')
        .setDescription('Winner score (1-10)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addIntegerOption(option =>
      option
        .setName('loser_score')
        .setDescription('Loser score (0-9)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(9)
    )
    .toJSON(),

  // /mystats - View personal statistics
  new SlashCommandBuilder()
    .setName('mystats')
    .setDescription('View your personal statistics and match history')
    .toJSON(),

  // /stats - View player statistics
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View statistics for any player')
    .addStringOption(option =>
      option
        .setName('username')
        .setDescription('Player username')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .toJSON(),

  // /ladder - View ladder standings
  new SlashCommandBuilder()
    .setName('ladder')
    .setDescription('View the current ladder rankings')
    .toJSON(),

  // /help - Display help information
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display command help and usage information')
    .toJSON(),

  // /history - View match history
  new SlashCommandBuilder()
    .setName('history')
    .setDescription('View all recorded matches in chronological order')
    .toJSON()
];

/**
 * Register slash commands with Discord
 * @returns {Promise<void>}
 */
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(discordConfig.token);

  try {
    logger.info(`Registering ${commands.length} slash commands...`);

    // Register commands to specific guild (faster updates during development)
    if (discordConfig.guildId) {
      await rest.put(
        Routes.applicationGuildCommands(discordConfig.clientId, discordConfig.guildId),
        { body: commands }
      );
      logger.info(`Successfully registered ${commands.length} guild commands`);
    } else {
      // Register globally (slower, but works in all guilds)
      await rest.put(
        Routes.applicationCommands(discordConfig.clientId),
        { body: commands }
      );
      logger.info(`Successfully registered ${commands.length} global commands`);
    }
  } catch (error) {
    logger.error('Failed to register slash commands:', error);
    throw error;
  }
}

module.exports = {
  commands,
  registerCommands
};
