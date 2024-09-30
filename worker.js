import Bull from 'bull';
import imageThumbnail from 'image-thumbnail';
import fs from 'fs';
import dbClient from './utils/db';

// Create Bull queues
const fileQueue = new Bull('fileQueue');
const userQueue = new Bull('userQueue');

// Process fileQueue for thumbnail generation
fileQueue.process(async (job, done) => {
  const { fileId, userId } = job.data;
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');

  const file = await dbClient.db.collection('files').findOne({ _id: new ObjectId(fileId), userId });
  if (!file) throw new Error('File not found');

  const { localPath } = file;
  const sizes = [500, 250, 100];

  for (const size of sizes) {
    const thumbnail = await imageThumbnail(localPath, { width: size });
    const thumbnailPath = `${localPath}_${size}`;
    fs.writeFileSync(thumbnailPath, thumbnail);
  }

  done();
});

// Process userQueue for sending welcome emails
userQueue.process(async (job, done) => {
  const { userId } = job.data;
  if (!userId) throw new Error('Missing userId');

  const user = await dbClient.db.collection('users').findOne({ _id: new ObjectId(userId) });
  if (!user) throw new Error('User not found');

  console.log(`Welcome ${user.email}!`);
  done();
});

export { fileQueue, userQueue };

export const workerStart = () => {
  console.log('Worker started.');
};
