/**
 * /recordMatch Command Handler
 * Record a match result and update ratings
 */

const api = require('../utils/apiClient');
const { buildMatchEmbed, buildErrorEmbed } = require('../utils/embedBuilder');
const logger = require('../utils/logger');

/**
 * Execute /recordMatch command
 * @param {CommandInteraction} interaction - Discord interaction
 */
async function execute(interaction) {
  try {
    // Get parameters
    const winner = interaction.options.getString('winner');
    const loser = interaction.options.getString('loser');
    const winnerScore = interaction.options.getInteger('winner_score');
    const loserScore = interaction.options.getInteger('loser_score');

    logger.info(`/recordMatch: ${winner} vs ${loser}, score ${winnerScore}-${loserScore}`);

    // DEBUG: Send initial debug info
    await interaction.reply({
      content: `🔍 **DEBUG MODE**\n\`\`\`\nCommand: /recordMatch\nWinner: ${winner}\nLoser: ${loser}\nWinner Score: ${winnerScore}\nLoser Score: ${loserScore}\n\`\`\``,
      ephemeral: true
    });

    // Validate winner score > loser score
    if (winnerScore <= loserScore) {
      const embed = buildErrorEmbed(
        'Invalid scores: Winner score must be greater than loser score',
        [
          `You entered: ${winner} ${winnerScore}, ${loser} ${loserScore}`,
          'Correct format: Winner score must be higher'
        ]
      );
      await interaction.followUp({ embeds: [embed], ephemeral: true });
      return;
    }

    // Validate different players
    if (winner.toLowerCase() === loser.toLowerCase()) {
      const embed = buildErrorEmbed(
        'Invalid match: Winner and loser must be different players',
        ['Please select two different players']
      );
      await interaction.followUp({ embeds: [embed], ephemeral: true });
      return;
    }

    // DEBUG: Validation passed
    await interaction.followUp({
      content: '✅ Validation passed. Calling backend API...',
      ephemeral: true
    });

    // Call API to record match
    logger.info('Calling API to record match...');
    const result = await api.recordMatch({
      winner,
      loser,
      winnerScore,
      loserScore
    });

    logger.info('API call successful, result:', result);

    // DEBUG: API call succeeded
    await interaction.followUp({
      content: `✅ API call successful. Match ID: ${result.data?.matchId || 'unknown'}`,
      ephemeral: true
    });

    // Build match result embed
    const embed = buildMatchEmbed(result.data);

    await interaction.followUp({ embeds: [embed] });

  } catch (error) {
    // Log error without circular references
    logger.error('/recordMatch error:', error.message);
    logger.error('Error code:', error.code);
    if (error.response?.data) {
      logger.error('API response:', error.response.data);
    }

    let errorMessage = 'Failed to record match';
    const suggestions = [];
    let debugInfo = '';

    // Build detailed debug information
    if (error.response) {
      // API returned an error response
      debugInfo = `\n\n🔍 **Debug Info:**\n\`\`\`\nHTTP Status: ${error.response.status}\nError Code: ${error.response.data?.code || 'N/A'}\nAPI Message: ${error.response.data?.message || 'N/A'}\n\`\`\``;
      errorMessage = error.response.data?.message || errorMessage;

      if (errorMessage.includes('not found')) {
        suggestions.push('Check username spelling (case-sensitive)');
        suggestions.push('Use /ladder to see all registered players');
        suggestions.push('Register missing players with /inputUser');
      } else if (errorMessage.includes('different players')) {
        suggestions.push('Winner and loser must be different players');
      } else if (errorMessage.includes('Unauthorized') || errorMessage.includes('API key')) {
        suggestions.push('API key mismatch between bot and backend');
        suggestions.push('Check .env files have matching API_KEY');
      }
    } else if (error.request) {
      // Request was made but no response received
      debugInfo = `\n\n🔍 **Debug Info:**\n\`\`\`\nError: No response from backend\nBackend URL: ${process.env.API_BASE_URL}\nError Code: ${error.code || 'N/A'}\n\`\`\``;
      errorMessage = 'Cannot connect to backend API';
      suggestions.push('Ensure backend is running: npm run dev in cutbot-backend');
      suggestions.push('Check API_BASE_URL in .env: ' + process.env.API_BASE_URL);
      suggestions.push('Verify backend is accessible at http://localhost:3000/health');
    } else {
      // Something else went wrong
      debugInfo = `\n\n🔍 **Debug Info:**\n\`\`\`\nError: ${error.message}\nCode: ${error.code || 'N/A'}\nStack: ${error.stack?.split('\n')[0] || 'N/A'}\n\`\`\``;
      suggestions.push('Check bot console logs for details');
      suggestions.push('Contact a system administrator');
    }

    const embed = buildErrorEmbed(errorMessage, suggestions);

    // Send error with debug info
    if (interaction.deferred) {
      await interaction.editReply({
        embeds: [embed],
        content: debugInfo
      });
    } else {
      await interaction.followUp({
        embeds: [embed],
        content: debugInfo,
        ephemeral: true
      });
    }
  }
}

module.exports = {
  name: 'recordmatch',
  execute
};
