/**
 * /deleteUser Command Handler
 * Remove a player from the ladder system (Admin only)
 */

const api = require('../utils/apiClient');
const { buildSuccessEmbed, buildErrorEmbed } = require('../utils/embedBuilder');
const discordConfig = require('../config/discord');
const logger = require('../utils/logger');

/**
 * Check if user has required role
 * @param {GuildMember} member - Discord guild member
 * @returns {boolean} True if user has admin role
 */
function hasAdminRole(member) {
  return member.roles.cache.some(role =>
    discordConfig.adminRoles.includes(role.name)
  );
}

/**
 * Execute /deleteUser command
 * @param {CommandInteraction} interaction - Discord interaction
 */
async function execute(interaction) {
  try {
    // Check permissions
    if (!hasAdminRole(interaction.member)) {
      const embed = buildErrorEmbed(
        'This command requires the CUT Admin or Moderator role.',
        ['Contact a server administrator for assistance']
      );
      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Get parameters
    const username = interaction.options.getString('username');

    logger.info(`/deleteUser: ${username}`);

    // Defer reply
    await interaction.deferReply();

    // Call API to delete user
    const result = await api.deleteUser(username);

    // Build success embed
    const embed = buildSuccessEmbed(
      '🗑️ Player Removed',
      `Successfully removed **${result.data.username}** from the ladder system.`,
      [
        {
          name: 'Note',
          value: 'Match history has been preserved for data integrity.',
          inline: false
        },
        {
          name: 'Deleted At',
          value: new Date(result.data.deletedAt).toUTCString(),
          inline: false
        }
      ]
    );

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    logger.error('/deleteUser error:', error);

    let errorMessage = 'Failed to delete player';
    const suggestions = [];

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;

      if (errorMessage.includes('not found')) {
        suggestions.push('Check the username spelling (case-sensitive)');
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
  name: 'deleteuser',
  execute
};
