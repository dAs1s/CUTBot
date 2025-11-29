/**
 * /stats Command Handler
 * View statistics for any player
 */

const api = require('../utils/apiClient');
const { buildStatsEmbed, buildErrorEmbed } = require('../utils/embedBuilder');
const logger = require('../utils/logger');

/**
 * Execute /stats command
 * @param {CommandInteraction} interaction - Discord interaction
 */
async function execute(interaction) {
  try {
    const username = interaction.options.getString('username');

    logger.info(`/stats: ${username}`);

    // Defer reply
    await interaction.deferReply();

    // Get user statistics
    const stats = await api.getUserStats(username);

    // Build stats embed (concise version)
    const embed = buildStatsEmbed(stats.data, false);

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    logger.error('/stats error:', error);

    let errorMessage = 'Failed to fetch player statistics';
    const suggestions = [];

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;

      if (errorMessage.includes('not found')) {
        suggestions.push('Check username spelling (case-sensitive)');
        suggestions.push('Use /ladder to see all registered players');
      }
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
  name: 'stats',
  execute
};
