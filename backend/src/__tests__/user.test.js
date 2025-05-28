import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { api } from '../tests/setupTests.js';

describe('User API Routes', () => {
  let token;
  let user;

  beforeEach(async () => {
    await User.deleteMany({});
    user = await User.create({
      name: 'Nguyen Van A',
      username: 'testuser1',
      email: 'test1@gmail.com',
      password: 'Password123!',
      agreedToTerms: true,
      favoriteStocks: ['AAPL', 'MSFT'],
    });
    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
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
          confirmPassword: 'NewPassword123!',
          agreedToTerms: true,
        })
        .expect(201);
      expect(res.body).toHaveProperty('message', 'Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.');
      expect(res.body).toHaveProperty('userId');
      const dbUser = await User.findById(res.body.userId);
      expect(dbUser).not.toBeNull();
      expect(dbUser.username).toBe('newuser1');
      expect(dbUser.agreedToTerms).toBe(true);
    });

    it('should not allow registration if terms are not agreed', async () => {
      const res = await api
        .post('/api/users/register')
        .send({
          name: 'No Terms User',
          username: 'notermsuser',
          email: 'noterms@gmail.com',
          password: 'Password123!',
          confirmPassword: 'Password123!',
          agreedToTerms: false,
        })
        .expect(400);
      expect(res.body.message).toBe('Bạn phải đồng ý với các điều khoản dịch vụ để đăng ký.');
    });

    it('should not allow registration with existing email', async () => {
      const res = await api
        .post('/api/users/register')
        .send({
          name: 'Duplicate Email',
          username: 'anotheruser',
          email: 'test1@gmail.com',
          password: 'AnotherPassword123!',
          confirmPassword: 'AnotherPassword123!',
          agreedToTerms: true,
        })
        .expect(400);
      expect(res.body.message).toBe('Người dùng đã tồn tại (email hoặc username đã được sử dụng).');
    });

    it('should not allow registration with existing username', async () => {
      const res = await api
        .post('/api/users/register')
        .send({
          name: 'Duplicate Username',
          username: 'testuser1',
          email: 'another@gmail.com',
          password: 'AnotherPassword123!',
          confirmPassword: 'AnotherPassword123!',
          agreedToTerms: true,
        })
        .expect(400);
      expect(res.body.message).toBe('Người dùng đã tồn tại (email hoặc username đã được sử dụng).');
    });

    it('should return 400 if required fields are missing', async () => {
        const res = await api
            .post('/api/users/register')
            .send({
                username: 'incomplete',
            })
            .expect(400);
        expect(res.body.message).toBe('Vui lòng điền đầy đủ các trường: tên, tên người dùng, email, mật khẩu, xác nhận mật khẩu.');
    });

    it('should return 400 if passwords do not match', async () => {
        const res = await api
            .post('/api/users/register')
            .send({
                name: 'Mismatch User',
                username: 'mismatchuser',
                email: 'mismatch@example.com',
                password: 'Password123!',
                confirmPassword: 'Password456!',
                agreedToTerms: true,
            })
            .expect(400);
        expect(res.body.message).toBe('Mật khẩu và mật khẩu xác nhận không khớp.');
    });

    it('should validate user data based on model schema (e.g., short name, invalid email, weak password)', async () => {
      const testCases = [
        {
          payload: { name: 'A', username: 'gooduser', email: 'good@email.com', password: 'Password123!', confirmPassword: 'Password123!', agreedToTerms: true },
          expectedMessage: /^Tên phải có ít nhất 3 ký tự\.$/i,
        },
        {
          payload: { name: 'Good Name', username: 'us', email: 'good@email.com', password: 'Password123!', confirmPassword: 'Password123!', agreedToTerms: true },
          expectedMessage: /^Tên người dùng phải có ít nhất 3 ký tự\.$/i,
        },
        {
          payload: { name: 'Good Name', username: 'gooduser', email: 'invalid-email', password: 'Password123!', confirmPassword: 'Password123!', agreedToTerms: true },
          expectedMessage: /^Vui lòng cung cấp một địa chỉ email hợp lệ\.$/i,
        },
        {
          payload: { name: 'Good Name', username: 'gooduser', email: 'good@email.com', password: '123', confirmPassword: '123', agreedToTerms: true },
          expectedMessage: /^Mật khẩu phải có ít nhất 6 ký tự\.$/i,
        },
      ];

      for (const tc of testCases) {
        const res = await api.post('/api/users/register').send(tc.payload).expect(400);
        expect(res.body.message).toMatch(tc.expectedMessage);
      }
    });
  });

  describe('POST /api/users/login', () => {
    it('should login successfully with email and return user data including favoriteStocks', async () => {
      const res = await api
        .post('/api/users/login')
        .send({
          emailOrUsername: 'test1@gmail.com',
          password: 'Password123!',
        })
        .expect(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.username).toBe('testuser1');
      expect(res.body.email).toBe('test1@gmail.com');
      expect(res.body.name).toBe('Nguyen Van A');
      expect(res.body.favoriteStocks).toEqual(expect.arrayContaining(['AAPL', 'MSFT']));
    });

    it('should login successfully with username', async () => {
      const res = await api
        .post('/api/users/login')
        .send({
          emailOrUsername: 'testuser1',
          password: 'Password123!',
        })
        .expect(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('test1@gmail.com');
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
      expect(res.body.message).toBe('Mật khẩu không chính xác.');
    });

    it('should not login with non-existent user', async () => {
      const res = await api
        .post('/api/users/login')
        .send({
          emailOrUsername: 'noone@gmail.com',
          password: 'SomePassword123!',
        })
        .expect(401);
      expect(res.body.message).toBe('Email/Username không tồn tại.');
    });

    it('should require email/username and password for login', async () => {
        const res1 = await api
            .post('/api/users/login')
            .send({ emailOrUsername: 'test1@gmail.com' }) 
            .expect(401); 
        expect(res1.body.message).toBe('Missing credentials');

        const res2 = await api
            .post('/api/users/login')
            .send({ password: 'Password123!' }) 
            .expect(401);
        expect(res2.body.message).toBe('Missing credentials'); 
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return profile when authenticated, including favoriteStocks and agreedToTerms', async () => {
      const res = await api
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.username).toBe('testuser1');
      expect(res.body.email).toBe('test1@gmail.com');
      expect(res.body.name).toBe('Nguyen Van A');
      expect(res.body.favoriteStocks).toEqual(expect.arrayContaining(['AAPL', 'MSFT']));
      expect(res.body.agreedToTerms).toBe(true);
    });

    it('should return 401 when no token is provided', async () => {
      const res = await api
        .get('/api/users/profile')
        .expect(401);
      expect(res.body.message).toBe('Xác thực thất bại: Không tìm thấy token xác thực.');
    });

    it('should return 401 with invalid token (malformed)', async () => {
      const res = await api
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);
      expect(res.body.message).toBe('Xác thực thất bại: Token không đúng định dạng.');
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1ms',
      });
      await new Promise((resolve) => setTimeout(resolve, 50));
      const res = await api
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
      expect(res.body.message).toBe('Xác thực thất bại: Token đã hết hạn.');
    });

    it('should return 401 if user in token does not exist in DB', async () => {
        const nonExistentUserId = new mongoose.Types.ObjectId();
        const nonExistentUserToken = jwt.sign({ id: nonExistentUserId }, process.env.JWT_SECRET);
        const res = await api
            .get('/api/users/profile')
            .set('Authorization', `Bearer ${nonExistentUserToken}`)
            .expect(401);
        expect(res.body.message).toBe('Xác thực thất bại: Token không hợp lệ hoặc đã hết hạn.');
    });
  });
});