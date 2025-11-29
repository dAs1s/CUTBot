/**
 * Embed Builder Utility
 * Creates formatted Discord embeds following UI-DF-001 standards
 */

const { EmbedBuilder } = require('discord.js');
const COLORS = require('../constants/colors');

/**
 * Build a success embed (green)
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @param {Array} fields - Array of field objects {name, value, inline}
 * @returns {EmbedBuilder} Success embed
 */
function buildSuccessEmbed(title, description, fields = []) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle(title)
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

/**
 * Build an error embed (red)
 * @param {string} error - Error message
 * @param {Array} suggestions - Array of suggestion strings
 * @returns {EmbedBuilder} Error embed
 */
function buildErrorEmbed(error, suggestions = []) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.ERROR)
    .setTitle('❌ Error')
    .setDescription(error)
    .setTimestamp()
    .setFooter({ text: 'Use /help for command reference' });

  if (suggestions.length > 0) {
    embed.addFields({
      name: 'Suggestions',
      value: suggestions.map(s => `• ${s}`).join('\n'),
      inline: false
    });
  }

  return embed;
}

/**
 * Build an info embed (blue)
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @param {Array} fields - Array of field objects
 * @returns {EmbedBuilder} Info embed
 */
function buildInfoEmbed(title, description, fields = []) {
  const embed = new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle(title)
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  if (fields.length > 0) {
    embed.addFields(fields);
  }

  return embed;
}

/**
 * Build a warning embed (orange)
 * @param {string} title - Embed title
 * @param {string} description - Embed description
 * @returns {EmbedBuilder} Warning embed
 */
function buildWarningEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.WARNING)
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();
}

/**
 * Build match result embed
 * @param {Object} matchData - Match result data from API
 * @returns {EmbedBuilder} Match result embed
 */
function buildMatchEmbed(matchData) {
  const { winner, loser, score, scoreWeight, playedAt, matchId } = matchData;

  const embed = new EmbedBuilder()
    .setColor(COLORS.SUCCESS)
    .setTitle('⚔️ Match Recorded')
    .addFields(
      {
        name: 'Winner',
        value: `**${winner.username}**\nScore: ${score.winner}-${score.loser}\nRating: ${winner.ratingBefore} → ${winner.ratingAfter} (${winner.ratingChange >= 0 ? '+' : ''}${winner.ratingChange})\nRank: #${winner.rankBefore} → #${winner.rankAfter}`,
        inline: true
      },
      {
        name: 'Loser',
        value: `**${loser.username}**\nScore: ${score.loser}-${score.winner}\nRating: ${loser.ratingBefore} → ${loser.ratingAfter} (${loser.ratingChange >= 0 ? '+' : ''}${loser.ratingChange})\nRank: #${loser.rankBefore} → #${loser.rankAfter}`,
        inline: true
      },
      {
        name: 'Match Details',
        value: `Score Weight: ${scoreWeight.toFixed(3)}\nPlayed: ${new Date(playedAt).toUTCString()}`,
        inline: false
      }
    )
    .setFooter({ text: `Match #${matchId} • ${new Date(playedAt).toISOString()}` })
    .setTimestamp();

  return embed;
}

/**
 * Build user stats embed
 * @param {Object} stats - User statistics from API
 * @param {boolean} detailed - Whether to show detailed stats (for /mystats)
 * @returns {EmbedBuilder} Stats embed
 */
function buildStatsEmbed(stats, detailed = false) {
  const { user, rating, record, recentForm, streaks, ratingHistory } = stats;

  const embed = new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle(`📊 ${user.username}'s Statistics`)
    .addFields(
      {
        name: 'Overview',
        value: `Rank: #${user.rank} of ${user.totalPlayers}\nRating: ${rating.current} (RD: ${rating.deviation})\nRecord: ${record.wins}-${record.losses} (${record.winPercentage}%)`,
        inline: false
      }
    );

  if (detailed) {
    // Detailed stats for /mystats
    embed.addFields(
      {
        name: 'Performance',
        value: `Total Matches: ${record.totalMatches}\nWin %: ${record.winPercentage}%\nRating Trend: ${rating.trend}`,
        inline: true
      },
      {
        name: 'Recent Form',
        value: `Last 5: ${recentForm.last5 || 'N/A'}\nLast 10: ${recentForm.last10 || 'N/A'}`,
        inline: true
      }
    );

    if (streaks.current.count > 0) {
      embed.addFields({
        name: 'Current Streak',
        value: `${streaks.current.count} ${streaks.current.type}${streaks.current.count > 1 ? 's' : ''}`,
        inline: true
      });
    }
  } else {
    // Concise stats for /stats
    embed.addFields({
      name: 'Recent Form',
      value: `Last 5: ${recentForm.last5 || 'N/A'}`,
      inline: false
    });
  }

  embed.setTimestamp();

  return embed;
}

/**
 * Build ladder embed
 * @param {Object} ladderData - Ladder data from API
 * @returns {EmbedBuilder} Ladder embed
 */
function buildLadderEmbed(ladderData) {
  const { players, pagination } = ladderData;

  const embed = new EmbedBuilder()
    .setColor(COLORS.INFO)
    .setTitle('🏆 CUT Ladder Rankings')
    .setDescription(`Page ${pagination.page} of ${pagination.totalPages} • ${pagination.totalPlayers} Players`)
    .setTimestamp();

  if (players.length === 0) {
    embed.setDescription('No players registered yet. Use `/inputUser` to register!');
    return embed;
  }

  // Create table format
  const table = players.map(p =>
    `#${p.rank.toString().padStart(2)} ${p.username.padEnd(15)} ${p.rating.toFixed(0).padStart(4)} ${p.wins}-${p.losses} ${p.ratingDeviation.toFixed(0).padStart(3)}`
  ).join('\n');

  embed.addFields({
    name: 'Rank | Username | Rating | W-L | RD',
    value: `\`\`\`\n${table}\n\`\`\``,
    inline: false
  });

  // Add navigation hint if multiple pages
  if (pagination.totalPages > 1) {
    embed.setFooter({
      text: `Page ${pagination.page}/${pagination.totalPages} • Use buttons to navigate`
    });
  }

  return embed;
}

module.exports = {
  buildSuccessEmbed,
  buildErrorEmbed,
  buildInfoEmbed,
  buildWarningEmbed,
  buildMatchEmbed,
  buildStatsEmbed,
  buildLadderEmbed
};
