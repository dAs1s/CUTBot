/**
 * /inputUser Command Handler
 * Register a new player in the ladder system (Admin only)
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
 * Execute /inputUser command
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
    const twitchName = interaction.options.getString('twitch_name');
    const discordUser = interaction.options.getUser('discord_mention');

    logger.info(`/inputUser: ${username}, ${twitchName}, ${discordUser.tag}`);

    // Defer reply for potentially long operation
    await interaction.deferReply();

    // Call API to create user
    const result = await api.createUser({
      username,
      twitchName,
      discordId: discordUser.id
    });

    // Build success embed
    const embed = buildSuccessEmbed(
      '✅ Player Registered',
      `Successfully registered **${username}** in the ladder system!`,
      [
        {
          name: 'Player Details',
          value: `Username: ${result.data.username}\nTwitch: ${result.data.twitchName}\nDiscord: <@${result.data.discordId}>`,
          inline: false
        },
        {
          name: 'Starting Rating',
          value: `Rating: ${result.data.rating}\nRD: ${result.data.ratingDeviation}\nVolatility: ${result.data.volatility}`,
          inline: false
        }
      ]
    );

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    logger.error('/inputUser error:', error);

    let errorMessage = 'Failed to register player';
    const suggestions = [];

    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;

      if (errorMessage.includes('already exists')) {
        suggestions.push('Check if the username is already registered with /ladder');
        suggestions.push('Use a different username');
      } else if (errorMessage.includes('already linked')) {
        suggestions.push('This Discord user is already registered');
        suggestions.push('Use /stats to find their username');
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'Cannot connect to backend API';
      suggestions.push('Ensure the backend server is running');
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
  name: 'inputuser',
  execute
};
