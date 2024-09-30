import request from 'supertest';
import app from '../server';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

let token = '';
let fileId = '';
let userId = '';
let authHeader = '';

// Set up in-memory MongoDB for testing
const mongod = new MongoMemoryServer();

beforeAll(async () => {
  const uri = await mongod.getUri();
  process.env.DB_DATABASE = 'files_manager_test';
  await dbClient.connect(uri);

  // Create a user and get token for authentication
  const res = await request(app).post('/users').send({ email: 'test@example.com', password: 'password123' });
  userId = res.body.id;
  const auth = Buffer.from('test@example.com:password123').toString('base64');
  const connectRes = await request(app).get('/connect').set('Authorization', `Basic ${auth}`);
  token = connectRes.body.token;
  authHeader = `X-Token: ${token}`;
});

afterAll(async () => {
  await dbClient.close();
  await redisClient.flushdb();
  await redisClient.quit();
  await mongod.stop();
});

describe('Test API endpoints', () => {

  it('GET /status should return Redis and MongoDB status', async () => {
    const res = await request(app).get('/status');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('redis', true);
    expect(res.body).toHaveProperty('db', true);
  });

  it('GET /stats should return number of users and files', async () => {
    const res = await request(app).get('/stats');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(res.body).toHaveProperty('files');
  });

  it('POST /users should create a new user', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: 'test2@example.com', password: 'password456' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('email', 'test2@example.com');
  });

  it('GET /connect should authenticate the user', async () => {
    const auth = Buffer.from('test@example.com:password123').toString('base64');
    const res = await request(app).get('/connect').set('Authorization', `Basic ${auth}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('GET /disconnect should log out the user', async () => {
    const res = await request(app).get('/disconnect').set('X-Token', token);
    expect(res.statusCode).toBe(204);
  });

  it('GET /users/me should return the current user information', async () => {
    const res = await request(app).get('/users/me').set('X-Token', token);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('email', 'test@example.com');
  });

  it('POST /files should upload a file', async () => {
    const fileData = Buffer.from('Hello Webstack!').toString('base64');
    const res = await request(app)
      .post('/files')
      .set('X-Token', token)
      .send({ name: 'myText.txt', type: 'file', data: fileData });
    expect(res.statusCode).toBe(201);
    fileId = res.body.id;
    expect(res.body).toHaveProperty('name', 'myText.txt');
  });

  it('GET /files/:id should return the file metadata', async () => {
    const res = await request(app).get(`/files/${fileId}`).set('X-Token', token);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'myText.txt');
  });

  it('GET /files should return list of files with pagination', async () => {
    const res = await request(app).get('/files').set('X-Token', token).query({ page: 0 });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PUT /files/:id/publish should publish a file', async () => {
    const res = await request(app).put(`/files/${fileId}/publish`).set('X-Token', token);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('isPublic', true);
  });

  it('PUT /files/:id/unpublish should unpublish a file', async () => {
    const res = await request(app).put(`/files/${fileId}/unpublish`).set('X-Token', token);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('isPublic', false);
  });

  it('GET /files/:id/data should return file content', async () => {
    const res = await request(app).get(`/files/${fileId}/data`).set('X-Token', token);
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Hello Webstack!');
  });

  it('GET /files/:id/data without authentication should return 404 for private file', async () => {
    const res = await request(app).get(`/files/${fileId}/data`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('error', 'Not found');
  });
});
