/**
 * CUTBot - Discord Bot Entry Point
 * Chosen Undead Tournament Ladder System
 */

require('dotenv').config();
const { Client } = require('discord.js');
const discordConfig = require('./config/discord');
const { registerCommands } = require('./commands/registry');
const logger = require('./utils/logger');

// Create Discord client
const client = new Client({
  intents: discordConfig.intents
});

// Event handlers
client.once('ready', async () => {
  logger.info(`Bot logged in as ${client.user.tag}`);
  logger.info(`Bot ID: ${client.user.id}`);
  logger.info(`Serving ${client.guilds.cache.size} guild(s)`);

  // Register slash commands
  try {
    await registerCommands();
    logger.info('Slash commands registered successfully');
  } catch (error) {
    logger.error('Failed to register slash commands:', error);
  }
});

// Command handlers
const commands = new Map();
commands.set('inputuser', require('./commands/inputUser'));
commands.set('deleteuser', require('./commands/deleteUser'));
commands.set('recordmatch', require('./commands/recordMatch'));
commands.set('mystats', require('./commands/mystats'));
commands.set('stats', require('./commands/stats'));
commands.set('ladder', require('./commands/ladder'));
commands.set('help', require('./commands/help'));
commands.set('history', require('./commands/history'));

// Handle slash commands
client.on('interactionCreate', async interaction => {
  // Handle autocomplete
  if (interaction.isAutocomplete()) {
    try {
      const api = require('./utils/apiClient');
      const focusedValue = interaction.options.getFocused().toLowerCase();

      // Get all users for autocomplete
      const users = await api.getAllUsers();
      const filtered = users.data
        .filter(user => user.username.toLowerCase().includes(focusedValue))
        .slice(0, 25) // Discord limit
        .map(user => ({ name: user.username, value: user.username }));

      await interaction.respond(filtered);
    } catch (error) {
      logger.error('Autocomplete error:', error);
      await interaction.respond([]);
    }
    return;
  }

  // Handle button interactions
  if (interaction.isButton()) {
    try {
      const customId = interaction.customId;

      // History pagination buttons
      if (customId.startsWith('history_prev_') || customId.startsWith('history_next_')) {
        const historyCommand = commands.get('history');
        await historyCommand.handlePagination(interaction);
        return;
      }

      // History delete button
      if (customId === 'history_delete') {
        const historyCommand = commands.get('history');
        await historyCommand.showDeleteModal(interaction);
        return;
      }
    } catch (error) {
      logger.error('Button interaction error:', error);
      const errorMessage = {
        content: 'An error occurred while processing this button.',
        ephemeral: true
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
    return;
  }

  // Handle modal submissions
  if (interaction.isModalSubmit()) {
    try {
      const customId = interaction.customId;

      // History delete modal
      if (customId === 'history_delete_modal') {
        const historyCommand = commands.get('history');
        await historyCommand.handleDeleteModal(interaction);
        return;
      }
    } catch (error) {
      logger.error('Modal submission error:', error);
      const errorMessage = {
        content: 'An error occurred while processing this form.',
        ephemeral: true
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
    return;
  }

  // Handle commands
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`Unknown command: ${interaction.commandName}`);
    return;
  }

  logger.info(`Command received: ${interaction.commandName} from ${interaction.user.tag}`);

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error(`Error executing ${interaction.commandName}:`, error);

    const errorMessage = {
      content: 'An error occurred while executing this command.',
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Error handling
client.on('error', error => {
  logger.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN)
  .then(() => {
    logger.info('Successfully connected to Discord');
  })
  .catch(error => {
    logger.error('Failed to connect to Discord:', error);
    process.exit(1);
  });
