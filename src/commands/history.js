/**
 * /history Command Handler
 * Display all recorded matches in chronological order
 */

const api = require('../utils/apiClient');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const COLORS = require('../constants/colors');
const logger = require('../utils/logger');

/**
 * Build history embed
 * @param {Array} matches - Array of match objects
 * @param {Object} pagination - Pagination info
 * @returns {EmbedBuilder} History embed
 */
function buildHistoryEmbed(matches, pagination) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle('📜 Match History')
    .setDescription(`Showing matches ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.totalMatches)} of ${pagination.totalMatches}`)
    .setTimestamp();

  if (matches.length === 0) {
    embed.addFields({
      name: 'No Matches',
      value: 'No matches have been recorded yet.\nUse `/recordmatch` to record the first match!'
    });
  } else {
    // Group matches into fields (Discord has a 25 field limit)
    const matchesPerField = 10;
    for (let i = 0; i < matches.length; i += matchesPerField) {
      const fieldMatches = matches.slice(i, i + matchesPerField);
      const fieldValue = fieldMatches.map(match => {
        const winnerChange = match.winnerRatingChange >= 0 ? `+${match.winnerRatingChange}` : match.winnerRatingChange;
        const loserChange = match.loserRatingChange >= 0 ? `+${match.loserRatingChange}` : match.loserRatingChange;
        const date = new Date(match.playedAt).toLocaleDateString();

        return `**#${match.matchNumber}** (ID: ${match.matchId}) | ${date}\n` +
               `${match.winner} **${match.score}** ${match.loser}\n` +
               `Rating: ${winnerChange} / ${loserChange} | Weight: ${match.scoreWeight.toFixed(3)}`;
      }).join('\n\n');

      embed.addFields({
        name: i === 0 ? 'Matches' : '\u200B',
        value: fieldValue
      });
    }
  }

  embed.setFooter({
    text: `Page ${pagination.page} of ${pagination.totalPages} • Total Matches: ${pagination.totalMatches}`
  });

  return embed;
}

/**
 * Build pagination buttons
 * @param {number} page - Current page
 * @param {boolean} hasNext - Has next page
 * @param {boolean} hasPrevious - Has previous page
 * @returns {ActionRowBuilder} Button row
 */
function buildPaginationButtons(page, hasNext, hasPrevious) {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`history_prev_${page}`)
        .setLabel('◀ Previous')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!hasPrevious),
      new ButtonBuilder()
        .setCustomId(`history_next_${page}`)
        .setLabel('Next ▶')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!hasNext)
    );

  return row;
}

/**
 * Execute /history command
 * @param {CommandInteraction} interaction - Discord interaction
 */
async function execute(interaction) {
  try {
    const page = 1; // Start at page 1
    const limit = 25; // Matches per page

    logger.info(`/history: Fetching page ${page}`);

    // Defer reply as this might take a moment
    await interaction.deferReply();

    // Fetch match history from API
    const result = await api.get('/matches', {
      params: { page, limit }
    });

    const { matches, pagination } = result.data;

    // Build embed
    const embed = buildHistoryEmbed(matches, pagination);

    // Build pagination buttons if needed
    const components = [];
    if (pagination.totalPages > 1) {
      components.push(buildPaginationButtons(page, pagination.hasNext, pagination.hasPrevious));
    }

    // Add delete button (admin only)
    if (interaction.memberPermissions?.has('Administrator')) {
      const deleteRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('history_delete')
            .setLabel('🗑️ Delete Match')
            .setStyle(ButtonStyle.Danger)
        );
      components.push(deleteRow);
    }

    await interaction.editReply({
      embeds: [embed],
      components
    });

  } catch (error) {
    logger.error('/history error:', error.message);

    const embed = new EmbedBuilder()
      .setColor(COLORS.ERROR)
      .setTitle('❌ Error')
      .setDescription('Failed to fetch match history')
      .addFields({
        name: 'Error Details',
        value: error.response?.data?.message || error.message
      })
      .setTimestamp();

    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}

/**
 * Handle pagination button interactions
 * @param {ButtonInteraction} interaction - Button interaction
 */
async function handlePagination(interaction) {
  try {
    const [, direction, currentPage] = interaction.customId.split('_');
    const page = direction === 'next'
      ? parseInt(currentPage) + 1
      : parseInt(currentPage) - 1;
    const limit = 25;

    logger.info(`/history pagination: ${direction} to page ${page}`);

    await interaction.deferUpdate();

    // Fetch new page
    const result = await api.get('/matches', {
      params: { page, limit }
    });

    const { matches, pagination } = result.data;

    // Build embed
    const embed = buildHistoryEmbed(matches, pagination);

    // Build pagination buttons
    const components = [];
    if (pagination.totalPages > 1) {
      components.push(buildPaginationButtons(page, pagination.hasNext, pagination.hasPrevious));
    }

    // Add delete button (admin only)
    if (interaction.memberPermissions?.has('Administrator')) {
      const deleteRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('history_delete')
            .setLabel('🗑️ Delete Match')
            .setStyle(ButtonStyle.Danger)
        );
      components.push(deleteRow);
    }

    await interaction.editReply({
      embeds: [embed],
      components
    });

  } catch (error) {
    logger.error('/history pagination error:', error.message);

    const embed = new EmbedBuilder()
      .setColor(COLORS.ERROR)
      .setTitle('❌ Error')
      .setDescription('Failed to load page')
      .setTimestamp();

    await interaction.editReply({ embeds: [embed], components: [] });
  }
}

/**
 * Show delete match modal
 * @param {ButtonInteraction} interaction - Button interaction
 */
async function showDeleteModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('history_delete_modal')
    .setTitle('Delete Match');

  const matchIdInput = new TextInputBuilder()
    .setCustomId('match_id')
    .setLabel('Match ID to delete')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Enter the match ID number')
    .setRequired(true);

  const confirmInput = new TextInputBuilder()
    .setCustomId('confirm')
    .setLabel('Type CONFIRM to proceed')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('CONFIRM')
    .setRequired(true);

  const firstRow = new ActionRowBuilder().addComponents(matchIdInput);
  const secondRow = new ActionRowBuilder().addComponents(confirmInput);

  modal.addComponents(firstRow, secondRow);

  await interaction.showModal(modal);
}

/**
 * Handle delete match modal submission
 * @param {ModalSubmitInteraction} interaction - Modal interaction
 */
async function handleDeleteModal(interaction) {
  try {
    const matchId = interaction.fields.getTextInputValue('match_id');
    const confirm = interaction.fields.getTextInputValue('confirm');

    // Validate confirmation
    if (confirm !== 'CONFIRM') {
      const embed = new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle('❌ Deletion Cancelled')
        .setDescription('You must type CONFIRM to delete a match.')
        .setTimestamp();

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Validate match ID
    const matchIdNum = parseInt(matchId);
    if (isNaN(matchIdNum) || matchIdNum < 1) {
      const embed = new EmbedBuilder()
        .setColor(COLORS.ERROR)
        .setTitle('❌ Invalid Match ID')
        .setDescription('Please enter a valid match ID number.')
        .setTimestamp();

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    logger.info(`Deleting match ${matchIdNum} and recalculating ratings...`);

    await interaction.deferReply({ ephemeral: true });

    // Call API to delete match and recalculate
    const result = await api.delete(`/matches/${matchIdNum}`);

    const { deletedMatch, recalculation } = result.data;

    const embed = new EmbedBuilder()
      .setColor(COLORS.SUCCESS)
      .setTitle('✅ Match Deleted Successfully')
      .setDescription('The match has been deleted and all ratings have been recalculated.')
      .addFields(
        {
          name: 'Deleted Match',
          value: `**ID:** ${deletedMatch.id}\n` +
                 `**Match:** ${deletedMatch.winner} vs ${deletedMatch.loser}\n` +
                 `**Score:** ${deletedMatch.score}\n` +
                 `**Date:** ${new Date(deletedMatch.playedAt).toLocaleString()}`
        },
        {
          name: 'Recalculation Results',
          value: `**Matches Processed:** ${recalculation.matchesProcessed}/${recalculation.totalMatches}\n` +
                 `**Status:** ${recalculation.success ? '✅ Success' : '❌ Failed'}`
        }
      )
      .setTimestamp();

    if (recalculation.errors && recalculation.errors.length > 0) {
      embed.addFields({
        name: '⚠️ Errors',
        value: `${recalculation.errors.length} error(s) occurred during recalculation. Check logs for details.`
      });
    }

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    logger.error('Delete match error:', error.message);

    const embed = new EmbedBuilder()
      .setColor(COLORS.ERROR)
      .setTitle('❌ Error')
      .setDescription('Failed to delete match')
      .addFields({
        name: 'Error Details',
        value: error.response?.data?.message || error.message
      })
      .setTimestamp();

    if (interaction.deferred) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
}

module.exports = {
  name: 'history',
  execute,
  handlePagination,
  showDeleteModal,
  handleDeleteModal
};
