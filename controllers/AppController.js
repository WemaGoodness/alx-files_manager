import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  // GET /status: Return the Redis and MongoDB connection status
  static getStatus(req, res) {
    const redisAlive = redisClient.isAlive();
    const dbAlive = dbClient.isAlive();

    res.status(200).json({ redis: redisAlive, db: dbAlive });
  }

  // GET /stats: Return the count of users and files from MongoDB
  static async getStats(req, res) {
    const users = await dbClient.nbUsers();
    const files = await dbClient.nbFiles();

    res.status(200).json({ users, files });
  }
}

export default AppController;
