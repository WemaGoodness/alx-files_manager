import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (err) => {
      console.error(`Redis client error: ${err}`);
    });

    // Promisify Redis functions for easier async/await usage
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  // Check if the Redis client is alive (connected)
  isAlive() {
    return this.client.connected;
  }

  // Get the value of a key in Redis
  async get(key) {
    return await this.getAsync(key);
  }

  // Set a key-value pair in Redis with an expiration time
  async set(key, value, duration) {
    await this.setAsync(key, value);
    this.client.expire(key, duration);
  }

  // Delete a key-value pair from Redis
  async del(key) {
    await this.delAsync(key);
  }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
