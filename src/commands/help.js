/**
 * /help Command Handler
 * Display command help and usage information
 */

const { EmbedBuilder } = require('discord.js');
const COLORS = require('../constants/colors');
const logger = require('../utils/logger');

/**
 * Execute /help command
 * @param {CommandInteraction} interaction - Discord interaction
 */
async function execute(interaction) {
  try {
    logger.info(`/help: ${interaction.user.tag}`);

    const embed = new EmbedBuilder()
      .setColor(COLORS.INFO)
      .setTitle('📖 CUTBot Command Reference')
      .setDescription('Chosen Undead Tournament Ladder System')
      .addFields(
        {
          name: '👥 User Management',
          value: [
            '`/inputuser` - Register a new player (Admin only)',
            '`/deleteuser` - Remove a player (Admin only)',
            '`/mystats` - View your personal statistics'
          ].join('\n'),
          inline: false
        },
        {
          name: '⚔️ Match Recording',
          value: [
            '`/recordmatch` - Record a match result',
            '  • Winner and loser usernames',
            '  • Scores (winner: 1-10, loser: 0-9)',
            '  • Automatically updates ratings using Glicko-2'
          ].join('\n'),
          inline: false
        },
        {
          name: '📊 Statistics & Rankings',
          value: [
            '`/stats <username>` - View any player\'s statistics',
            '`/ladder` - View ladder rankings (paginated)',
            '`/mystats` - View your detailed statistics'
          ].join('\n'),
          inline: false
        },
        {
          name: '🎮 Rating System',
          value: [
            'CUTBot uses the **Glicko-2** rating algorithm with score-weighted modifications.',
            '',
            '**Starting Rating:** 1500 ± 300 RD',
            '**Score Weight:** Rewards dominant victories and longer sets',
            '**Rating Deviation (RD):** Measures rating uncertainty',
            '**Volatility:** Measures rating consistency'
          ].join('\n'),
          inline: false
        },
        {
          name: '💡 Tips',
          value: [
            '• Use autocomplete for usernames in commands',
            '• Ratings update immediately after match recording',
            '• Match history is preserved even if users are deleted',
            '• Contact a CUT Admin or Moderator for registration'
          ].join('\n'),
          inline: false
        }
      )
      .setFooter({ text: 'CUTBot v1.0.0 • Powered by Glicko-2' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

  } catch (error) {
    logger.error('/help error:', error);
    await interaction.reply({
      content: 'Failed to display help information. Please try again.',
      ephemeral: true
    });
  }
}

module.exports = {
  name: 'help',
  execute
};
