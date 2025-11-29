/**
 * /ladder Command Handler
 * View the current ladder rankings with pagination
 */

const api = require('../utils/apiClient');
const { buildLadderEmbed, buildErrorEmbed } = require('../utils/embedBuilder');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../utils/logger');

/**
 * Execute /ladder command
 * @param {CommandInteraction} interaction - Discord interaction
 */
async function execute(interaction) {
  try {
    logger.info(`/ladder: ${interaction.user.tag}`);

    // Defer reply
    await interaction.deferReply();

    // Get first page of ladder
    const ladder = await api.getLadder(1, 25);

    // Build ladder embed
    const embed = buildLadderEmbed(ladder.data);

    // Add pagination buttons if multiple pages
    if (ladder.data.pagination.totalPages > 1) {
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('ladder_prev')
            .setLabel('◀ Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true), // First page, no previous
          new ButtonBuilder()
            .setCustomId('ladder_next')
            .setLabel('Next ▶')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(ladder.data.pagination.totalPages === 1)
        );

      await interaction.editReply({ embeds: [embed], components: [row] });

      // Create button collector
      const collector = interaction.channel.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id,
        time: 300000 // 5 minutes
      });

      let currentPage = 1;

      collector.on('collect', async i => {
        try {
          if (i.customId === 'ladder_next') {
            currentPage++;
          } else if (i.customId === 'ladder_prev') {
            currentPage--;
          }

          // Fetch new page
          const newLadder = await api.getLadder(currentPage, 25);
          const newEmbed = buildLadderEmbed(newLadder.data);

          // Update buttons
          const newRow = new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId('ladder_prev')
                .setLabel('◀ Previous')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === 1),
              new ButtonBuilder()
                .setCustomId('ladder_next')
                .setLabel('Next ▶')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(currentPage === newLadder.data.pagination.totalPages)
            );

          await i.update({ embeds: [newEmbed], components: [newRow] });
        } catch (error) {
          logger.error('Ladder pagination error:', error);
          await i.reply({ content: 'Failed to load page', ephemeral: true });
        }
      });

      collector.on('end', () => {
        // Disable buttons after timeout
        const disabledRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('ladder_prev')
              .setLabel('◀ Previous')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('ladder_next')
              .setLabel('Next ▶')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(true)
          );

        interaction.editReply({ components: [disabledRow] }).catch(() => {});
      });
    } else {
      await interaction.editReply({ embeds: [embed] });
    }

  } catch (error) {
    logger.error('/ladder error:', error);

    let errorMessage = 'Failed to fetch ladder standings';
    const suggestions = [];

    if (error.code === 'ECONNREFUSED') {
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
  name: 'ladder',
  execute
};
