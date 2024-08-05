const Bull = require('bull');
const fs = require('fs');
const path = require('path');
const imageThumbnail = require('image-thumbnail');
const dbClient = require('./utils/db');

const fileQueue = new Bull('fileQueue');

fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;
  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.db.collection('files').findOne({ _id: dbClient.objectId(fileId), userId: dbClient.objectId(userId) });
  if (!file) {
    throw new Error('File not found');
  }

  const thumbnails = await Promise.all(sizes.map(size => imageThumbnail(file.localPath, { width: size })));
  
  sizes.forEach((size, index) => {
    const thumbnailPath = `${file.localPath}_${size}`;
    fs.writeFileSync(thumbnailPath, thumbnails[index]);
  });

  done();
});
