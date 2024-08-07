import redis from 'redis';
import { promisify } from 'util';

/**
 * Class for performing operations with Redis service
 */
class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);

    this.connected = false; // Internal flag for connection status

    this.client.on('error', (error) => {
      console.log(`Redis client not connected to the server: ${error.message}`);
      this.connected = false; // Update status on error
    });

    this.client.on('connect', () => {
      console.log('Redis client connected to the server');
    });

    // Wait for the client to be ready before proceeding
    this.connectionReady = new Promise((resolve) => {
      this.client.on('ready', () => {
        console.log('Redis client is ready');
        this.connected = true; // Ensure connected is true on ready
        setTimeout(() => {  // Add a delay to ensure readiness
          resolve();
        }, 1000); // Adjust delay as needed
      });
    });
  }

  /**
   * Checks if connection to Redis is Alive
   * @return {boolean} true if connection alive or false if not
   */
  isAlive() {
    return this.connected; // Use the internal flag for connection status
  }

  /**
   * Ensures the connection to Redis is ready
   * @return {Promise} resolves when connection is ready
   */
  async ensureConnection() {
    if (!this.connected) {
      console.log('Waiting for Redis connection...');
      await this.connectionReady; // Wait for the connection to be ready
    }
  }

  /**
   * Gets value corresponding to key in redis
   * @param {string} key key to search for in redis
   * @return {Promise<string>} value of key
   */
  async get(key) {
    await this.ensureConnection(); // Ensure the connection is ready
    const value = await this.getAsync(key);
    return value;
  }

  /**
   * Creates a new key in redis with a specific TTL
   * @param {string} key key to be saved in redis
   * @param {string} value value to be assigned to key
   * @param {number} duration TTL of key
   * @return {undefined} No return
   */
  async set(key, value, duration) {
    await this.ensureConnection(); // Ensure the connection is ready
    this.client.setex(key, duration, value);
  }

  /**
   * Deletes key in redis service
   * @param {string} key key to be deleted
   * @return {undefined} No return
   */
  async del(key) {
    await this.ensureConnection(); // Ensure the connection is ready
    this.client.del(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
