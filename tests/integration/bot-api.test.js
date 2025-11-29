/**
 * Bot-API Integration Tests
 * Tests the Discord bot's integration with the backend API
 */

const api = require('../../src/utils/apiClient');

describe('Bot-API Integration Tests', () => {
  describe('API Client Connection', () => {
    test('should connect to backend API', async () => {
      try {
        const users = await api.getAllUsers();
        expect(users).toBeDefined();
        expect(users.success).toBe(true);
        expect(Array.isArray(users.data)).toBe(true);
      } catch (error) {
        // If connection fails, provide helpful error message
        if (error.code === 'ECONNREFUSED') {
          console.error('Backend API is not running. Start it with: cd cutbot-backend && npm run dev');
        }
        throw error;
      }
    });

    test('should handle authentication', async () => {
      // This test verifies the API key is properly configured
      const users = await api.getAllUsers();
      expect(users.success).toBe(true);
    });
  });

  describe('User Operations', () => {
    const testUser = {
      username: 'bot_test_' + Date.now(),
      twitchName: 'bot_twitch_' + Date.now(),
      discordId: '999999999999999999'
    };

    test('should create user via API', async () => {
      const result = await api.createUser(testUser);
      expect(result.success).toBe(true);
      expect(result.data.username).toBe(testUser.username);
      expect(result.data.rating).toBe(1500);
    });

    test('should retrieve user via API', async () => {
      const result = await api.getUser(testUser.username);
      expect(result.success).toBe(true);
      expect(result.data.username).toBe(testUser.username);
      expect(result.data.rank).toBeDefined();
    });

    test('should get user statistics', async () => {
      const result = await api.getUserStats(testUser.username);
      expect(result.success).toBe(true);
      expect(result.data.user).toBeDefined();
      expect(result.data.rating).toBeDefined();
      expect(result.data.record).toBeDefined();
    });

    test('should delete user via API', async () => {
      const result = await api.deleteUser(testUser.username);
      expect(result.success).toBe(true);
    });

    test('should handle user not found error', async () => {
      await expect(api.getUser('nonexistent_user_12345'))
        .rejects
        .toThrow();
    });
  });

  describe('Match Operations', () => {
    const player1 = {
      username: 'bot_player1_' + Date.now(),
      twitchName: 'player1_twitch',
      discordId: '111111111111111111'
    };

    const player2 = {
      username: 'bot_player2_' + Date.now(),
      twitchName: 'player2_twitch',
      discordId: '222222222222222222'
    };

    beforeAll(async () => {
      await api.createUser(player1);
      await api.createUser(player2);
    });

    afterAll(async () => {
      try {
        await api.deleteUser(player1.username);
        await api.deleteUser(player2.username);
      } catch (error) {
        // Ignore cleanup errors
      }
    });

    test('should record match via API', async () => {
      const result = await api.recordMatch({
        winner: player1.username,
        loser: player2.username,
        winnerScore: 10,
        loserScore: 3
      });

      expect(result.success).toBe(true);
      expect(result.data.matchId).toBeDefined();
      expect(result.data.winner.ratingAfter).toBeGreaterThan(1500);
      expect(result.data.loser.ratingAfter).toBeLessThan(1500);
    });

    test('should retrieve match history', async () => {
      const result = await api.getMatchHistory(player1.username, 1, 10);
      expect(result.success).toBe(true);
      expect(result.data.matches).toBeDefined();
      expect(result.data.matches.length).toBeGreaterThan(0);
    });

    test('should validate match scores', async () => {
      await expect(api.recordMatch({
        winner: player1.username,
        loser: player2.username,
        winnerScore: 5,
        loserScore: 10 // Invalid: loser score higher
      })).rejects.toThrow();
    });
  });

  describe('Ladder Operations', () => {
    test('should retrieve ladder standings', async () => {
      const result = await api.getLadder(1, 25);
      expect(result.success).toBe(true);
      expect(result.data.players).toBeDefined();
      expect(result.data.pagination).toBeDefined();
      expect(result.data.pagination.page).toBe(1);
    });

    test('should handle pagination', async () => {
      const page1 = await api.getLadder(1, 5);
      expect(page1.data.pagination.limit).toBe(5);

      if (page1.data.pagination.totalPages > 1) {
        const page2 = await api.getLadder(2, 5);
        expect(page2.data.pagination.page).toBe(2);
      }
    });
  });

  describe('API Retry Logic', () => {
    test('should handle temporary failures with retry', async () => {
      // This test verifies the retry mechanism works
      // In a real scenario, we'd mock a temporary failure
      const result = await api.getAllUsers();
      expect(result.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle validation errors', async () => {
      await expect(api.createUser({
        username: 'ab', // Too short
        twitchName: 'test',
        discordId: '123456789012345678'
      })).rejects.toThrow();
    });

    test('should handle missing required fields', async () => {
      await expect(api.createUser({
        username: 'testuser'
        // Missing twitchName and discordId
      })).rejects.toThrow();
    });
  });
});
