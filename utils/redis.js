const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setexAsync = promisify(this.client.setex).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
    this.connectionEstablished = false;

    this.client.on('error', (err) => {
      console.log(`could not create, ${err.message} encountered`);
      this.connectionEstablished = false;
    });

    this.client.on('connect', () => {
      this.connectionEstablished = true;
      // console.log('Connection established');
    });

    this.client.on('end', () => {
      console.log('Connection closed');
      // this.connectionEstablished = false;
    });
  }

  isAlive() {
    return this.connectionEstablished;
  }

  async get(key) {
    try {
      const value = await this.getAsync(key);
      return value;
    } catch (err) {
      console.log(`Error getting key ${key}: ${err.message}`);
      return null;
    }
  }

  async set(key, duration, value) {
    try {
      await this.setexAsync(key, duration, value);
     //console.log(`Key ${key} set with value ${value} for ${duration} seconds`);
    } catch (err) {
      console.log(`Error setting key ${key}: ${err.message}`);
    }
  }

  async del(key) {
    try {
      await this.delAsync(key);
      console.log(`Key ${key} deleted`);
    } catch (err) {
      console.log(`Error deleting key ${key}: ${err.message}`);
    }
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
