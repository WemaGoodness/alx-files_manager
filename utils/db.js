import { MongoClient } from 'mongodb';
import { promisify } from 'util';

// Define DBClient class
class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    // Connect to MongoDB
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this.db = this.client.db(database);
        console.log('Connected to MongoDB');
      })
      .catch((err) => {
        console.error(`MongoDB connection error: ${err}`);
      });
  }

  // Check if MongoDB client is alive
  isAlive() {
    return this.client && this.client.isConnected();
  }

  // Return the number of users (documents in the 'users' collection)
  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  // Return the number of files (documents in the 'files' collection)
  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
export default dbClient;
