const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);

    this.connected = false;

    this.client.on('error', (error) => {
      console.log(`Redis client not connected to the server: ${error.message}`);
      this.connected = false;
    });

    this.client.on('connect', () => {
      console.log('Redis client connected to the server');
    });

    this.client.on('ready', () => {
      console.log('Redis client is ready');
      this.connected = true;
    });

    // Promise to ensure connection readiness
    this.connectionPromise = new Promise((resolve) => {
      this.client.on('ready', () => {
        console.log('Redis client is ready');
        this.connected = true;
        setTimeout(() => {
          resolve();
        }, 1000); // Adjust delay as needed
      });
    });
  }

  async isAlive() {
    await this.connectionPromise;
    return this.connected;
  }

  async get(key) {
    await this.connectionPromise;
    const value = await this.getAsync(key);
    return value;
  }

  async set(key, value, duration) {
    await this.connectionPromise;
    this.client.setex(key, duration, value);
  }

  async del(key) {
    await this.connectionPromise;
    this.client.del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
