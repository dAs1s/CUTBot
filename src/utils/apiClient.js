/**
 * API Client
 * HTTP client for backend API communication with retry logic
 */

const axios = require('axios');
const apiConfig = require('../config/api');
const logger = require('./logger');

// Create Axios instance with configuration
const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiConfig.apiKey}`
  }
});

// Request interceptor - log outgoing requests
apiClient.interceptors.request.use(
  config => {
    logger.debug(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  error => {
    logger.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - log responses and handle errors
apiClient.interceptors.response.use(
  response => {
    logger.debug(`API Response: ${response.status} ${response.config.url}`);
    return response.data; // Return just the data portion
  },
  error => {
    if (error.response) {
      // Server responded with error status
      logger.error(`API Error: ${error.response.status} ${error.response.data?.message || error.message}`);
    } else if (error.request) {
      // Request made but no response received
      logger.error('API Error: No response received from server');
    } else {
      // Error in request setup
      logger.error('API Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Make API call with exponential backoff retry logic
 * @param {Function} apiFunction - Function that makes the API call
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<any>} API response data
 */
async function apiCallWithRetry(apiFunction, maxRetries = apiConfig.retry.maxRetries) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiFunction();
    } catch (error) {
      // Don't retry on client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }

      // Last attempt - throw error
      if (attempt === maxRetries) {
        logger.error(`API call failed after ${maxRetries} attempts`);
        throw error;
      }

      // Calculate exponential backoff delay: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * apiConfig.retry.retryDelay;

      logger.warn(`API call failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * API Client Methods
 */
const api = {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData) {
    return apiCallWithRetry(() => apiClient.post('/users', userData));
  },

  /**
   * Get user by username
   * @param {string} username - Username
   * @returns {Promise<Object>} User data
   */
  async getUser(username) {
    return apiCallWithRetry(() => apiClient.get(`/users/${username}`));
  },

  /**
   * Delete user
   * @param {string} username - Username
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteUser(username) {
    return apiCallWithRetry(() => apiClient.delete(`/users/${username}`));
  },

  /**
   * Get all users (for autocomplete)
   * @returns {Promise<Array>} List of users
   */
  async getAllUsers() {
    return apiCallWithRetry(() => apiClient.get('/users'));
  },

  /**
   * Record a match
   * @param {Object} matchData - Match data
   * @returns {Promise<Object>} Match result with rating changes
   */
  async recordMatch(matchData) {
    return apiCallWithRetry(() => apiClient.post('/matches', matchData));
  },

  /**
   * Get match history for a user
   * @param {string} username - Username
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise<Object>} Match history with pagination
   */
  async getMatchHistory(username, page = 1, limit = 10) {
    return apiCallWithRetry(() =>
      apiClient.get(`/matches/${username}`, { params: { page, limit } })
    );
  },

  /**
   * Get ladder standings
   * @param {number} page - Page number
   * @param {number} limit - Results per page
   * @returns {Promise<Object>} Ladder data with pagination
   */
  async getLadder(page = 1, limit = 25) {
    return apiCallWithRetry(() =>
      apiClient.get('/ladder', { params: { page, limit } })
    );
  },

  /**
   * Get user statistics
   * @param {string} username - Username
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats(username) {
    return apiCallWithRetry(() => apiClient.get(`/stats/${username}`));
  },

  /**
   * Generic GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Axios config (params, headers, etc.)
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint, config = {}) {
    return apiCallWithRetry(() => apiClient.get(endpoint, config));
  },

  /**
   * Generic DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} config - Axios config
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint, config = {}) {
    return apiCallWithRetry(() => apiClient.delete(endpoint, config));
  }
};

module.exports = api;
