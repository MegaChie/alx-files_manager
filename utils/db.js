const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.connected = false;

    // Promise to ensure connection readiness
    this.connectionPromise = this.client.connect()
      .then(() => {
        //console.log('Connected successfully to MongoDB');
        this.connected = true;
        this.db = this.client.db(database);
      })
      .catch((err) => {
        console.error(`Failed to connect, ${err.message} encountered`);
        this.connected = false;
      });
  }

  async isAlive() {
    // Await the connection promise to ensure accurate status
    await this.connectionPromise;
    return this.connected;
  }

  async nbUsers() {
    await this.isAlive(); // Ensure connection is alive before proceeding
    if (!this.connected) {
      throw new Error('Not connected to MongoDB');
    }
    try {
      const usersCollection = this.db.collection('users');
      const count = await usersCollection.countDocuments();
      // console.log(`Number of users: ${count}`);
      return count;
    } catch (err) {
      console.error(`Error getting user count: ${err.message}`);
      return null;
    }
  }

  async nbFiles() {
    await this.isAlive(); // Ensure connection is alive before proceeding
    if (!this.connected) {
      throw new Error('Not connected to MongoDB');
    }
    try {
      const filesCollection = this.db.collection('files');
      const count = await filesCollection.countDocuments();
      // console.log(`Number of files: ${count}`);
      return count;
    } catch (err) {
      console.error(`Error getting file count: ${err.message}`);
      return null;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
module.exports.ObjectId = ObjectId;
