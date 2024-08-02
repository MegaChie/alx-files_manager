const { MongoClient } = require('mongodb');
require('dotenv').config();

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;

    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.database = database;

    this.client.connect((err) => {
      if (err) {
        console.error(`Failed to connect, ${err.message} encountered`);
        this.connected = false;
      } else {
        console.log('Connected successfully to MongoDB');
        this.connected = true;
        this.db = this.client.db(this.database);
      }
    });
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    if (!this.connected) {
      throw new Error('Not connected to MongoDB');
    }
    try {
      const usersCollection = this.db.collection('users');
      const count = await usersCollection.countDocuments();
      return count;
    } catch (err) {
      console.error(`Error getting user count: ${err.message}`);
      return null;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
