import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { api } from '../tests/setupTests.js'

describe('User API Routes', () => {
  let token;
  let user;

  beforeEach(async () => {
    user = await User.create({
      name: 'Nguyen Van A',
      username: 'testuser1',
      email: 'test1@gmail.com',
      password: 'Password123!',
    });

    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
  });

  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const res = await api
        .post('/api/users/register')
        .send({
          name: 'New User 1',
          username: 'newuser1',
          email: 'newuser1@gmail.com',
          password: 'NewPassword123!',
        })
        .expect(201);

      expect(res.body).toHaveProperty('token');
      expect(res.body.username).toBe('newuser1');
      expect(res.body.email).toBe('newuser1@gmail.com');
    });

    it('should not allow registration with existing email', async () => {
      const res = await api
        .post('/api/users/register')
        .send({
          name: 'Duplicate Email',
          username: 'anotheruser',
          email: 'test1@gmail.com', 
          password: 'AnotherPassword123!',
        })
        .expect(400);

      expect(res.body.message).toMatch(/email/i);
    });

    it('should not allow registration with existing username', async () => {
      const res = await api
        .post('/api/users/register')
        .send({
          name: 'Duplicate Username',
          username: 'testuser1',
          email: 'another@gmail.com',
          password: 'AnotherPassword123!',
        })
        .expect(400);

      expect(res.body.message).toMatch(/username/i);
    });

    it('should validate invalid user data', async () => {
      const res = await api
        .post('/api/users/register')
        .send({
          name: 'A',
          username: 'us',
          email: 'invalid-email',
          password: '123',
        })
        .expect(400);

      expect(res.body.message).toMatch(/ký tự|email|Mật khẩu/i);
    });
  });

  describe('POST /api/users/login', () => {
    it('should login successfully with email', async () => {
      const res = await api
        .post('/api/users/login')
        .send({
          emailOrUsername: 'test1@gmail.com',
          password: 'Password123!',
        })
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body.username).toBe('testuser1');
    });

    it('should not login with incorrect password', async () => {
      const res = await api
        .post('/api/users/login')
        .send({
          emailOrUsername: 'test1@gmail.com',
          password: 'WrongPassword!',
        })
        .expect(401);

      expect(res.body.message).toMatch(/(không tồn tại|không chính xác)/i);

    });

    it('should not login with non-existent user', async () => {
      const res = await api
        .post('/api/users/login')
        .send({
          emailOrUsername: 'noone@gmail.com',
          password: 'SomePassword123!',
        })
        .expect(401);
     expect(res.body.message).toMatch(/(không tồn tại|không chính xác)/i);
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return profile when authenticated', async () => {
      const res = await api
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.username).toBe('testuser1');
      expect(res.body.email).toBe('test1@gmail.com');
    });

    it('should return 401 when no token is provided', async () => {
      await api
        .get('/api/users/profile')
        .expect(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await api
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);

      expect(res.body.message).toMatch(/không đúng định dạng|hết hạn/i);
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1ms',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const res = await api
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(res.body.message).toMatch(/hết hạn/i);
    });
  });
});
