/**
 * /mystats Command Handler
 * View personal statistics and match history
 */

const api = require('../utils/apiClient');
const { buildStatsEmbed, buildErrorEmbed } = require('../utils/embedBuilder');
const logger = require('../utils/logger');

/**
 * Execute /mystats command
 * @param {CommandInteraction} interaction - Discord interaction
 */
async function execute(interaction) {
  try {
    const discordId = interaction.user.id;

    logger.info(`/mystats: ${interaction.user.tag} (${discordId})`);

    // Defer reply
    await interaction.deferReply();

    // Get all users and find by Discord ID
    const usersResponse = await api.getAllUsers();

    // The API returns users without discordId in the list, so we need to get full user details
    // For now, we'll need to add a getUserByDiscordId endpoint or modify the API
    // As a workaround, we'll check if the user is registered by trying to get their stats

    // Try to find user by checking all users
    let username = null;
    for (const u of usersResponse.data) {
      try {
        const userDetails = await api.getUser(u.username);
        if (userDetails.data.discordId === discordId) {
          username = u.username;
          break;
        }
      } catch (err) {
        // Continue checking other users
      }
    }

    if (!username) {
      const embed = buildErrorEmbed(
        'You are not registered in the ladder system',
        [
          'Ask a CUT Admin or Moderator to register you with /inputUser',
          'You need to be registered before you can view your stats'
        ]
      );
      return await interaction.editReply({ embeds: [embed] });
    }

    // Get user statistics
    const stats = await api.getUserStats(username);

    // Build detailed stats embed
    const embed = buildStatsEmbed(stats.data, true);

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    logger.error('/mystats error:', error);

    let errorMessage = 'Failed to fetch your statistics';
    const suggestions = [];

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to backend API';
      suggestions.push('Contact a system administrator');
    }

    const embed = buildErrorEmbed(errorMessage, suggestions);

    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}

module.exports = {
  name: 'mystats',
  execute
};
