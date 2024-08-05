const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const mime = require('mime-types');
const Bull = require('bull');
const fileQueue = new Bull('fileQueue');

class FilesController {
  static async postUpload(req, res) {
    const { name, type, parentId = 0, isPublic = false, data } = req.body;
    const token = req.headers['x-token'];
    
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (parentId !== 0) {
      const parentFile = await dbClient.db.collection('files').findOne({ _id: dbClient.objectId(parentId) });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    const fileDocument = {
      userId: dbClient.objectId(userId),
      name,
      type,
      isPublic,
      parentId,
    };

    if (type === 'folder') {
      await dbClient.db.collection('files').insertOne(fileDocument);
      return res.status(201).json(fileDocument);
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const localPath = path.join(folderPath, uuidv4());
    fs.writeFileSync(localPath, Buffer.from(data, 'base64'));
    fileDocument.localPath = localPath;

    await dbClient.db.collection('files').insertOne(fileDocument);

    if (type === 'image') {
      await fileQueue.add({ userId, fileId: fileDocument._id });
    }

    return res.status(201).json(fileDocument);
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users').findOne({ _id: dbClient.objectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOne({ _id: dbClient.objectId(id), userId: user._id });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users').findOne({ _id: dbClient.objectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId = 0, page = 0 } = req.query;
    const pageSize = 20;
    const skip = page * pageSize;
    
    const files = await dbClient.db.collection('files').aggregate([
      { $match: { userId: user._id, parentId: parentId === 0 ? 0 : dbClient.objectId(parentId) } },
      { $skip: skip },
      { $limit: pageSize },
    ]).toArray();

    return res.status(200).json(files);
  }

  static async putPublish(req, res) {
    const token = req.headers['x-token'];

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users').findOne({ _id: dbClient.objectId(userId) });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOne({ _id: dbClient.objectId(id), userId: user._id });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    const updatedFile = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: dbClient.objectId(id) },
      { $set: { isPublic: true } },
      { returnOriginal: false }
    );

    return res.status(200).json(updatedFile.value);
  }

  static async putUnpublish(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await dbClient.db.collection('users').findOne({ _id: dbClient.objectId(userId) });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const file = await dbClient.db.collection('files').findOne({ _id: dbClient.objectId(id), userId: user._id });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    const updatedFile = await dbClient.db.collection('files').findOneAndUpdate(
      { _id: dbClient.objectId(id) },
      { $set: { isPublic: false } },
      { returnOriginal: false }
    );

    return res.status(200).json(updatedFile.value);
  }

  static async getFile(req, res) {
    const { id } = req.params;
    const token = req.headers['x-token'];
    const { size } = req.query;
    let userId = null;

    const file = await dbClient.db.collection('files').findOne({ _id: dbClient.objectId(id) });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }

    if (!file.isPublic) {
      if (!token) {
        return res.status(404).json({ error: 'Not found' });
      }

      userId = await redisClient.get(`auth_${token}`);
      if (!userId) {
        return res.status(404).json({ error: 'Not found' });
      }

      const user = await dbClient.db.collection('users').findOne({ _id: dbClient.objectId(userId) });
      if (!user || file.userId.toString() !== user._id.toString()) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

    let filePath = file.localPath;
    if (size && ['500', '250', '100'].includes(size)) {
      filePath = `${file.localPath}_${size}`;
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Not found' });
    }

    const mimeType = mime.lookup(file.name);
    res.setHeader('Content-Type', mimeType);
    const fileContent = fs.readFileSync(filePath);
    return res.status(200).send(fileContent);
  }
}

module.exports = FilesController;
