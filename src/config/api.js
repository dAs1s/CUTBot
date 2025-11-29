/**
 * API Configuration
 * Backend API connection settings
 */

module.exports = {
  // Backend API base URL
  baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api/v1',

  // API authentication key
  apiKey: process.env.API_KEY,

  // Request timeout (milliseconds)
  timeout: parseInt(process.env.API_TIMEOUT) || 5000,

  // Retry configuration
  retry: {
    maxRetries: 3,
    retryDelay: 1000, // Base delay in ms (will use exponential backoff)
  }
};
