import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Share from '../models/Share.js'; 
import { api } from '../tests/setupTests.js'; 

describe('Share API Routes', () => {
  let sharerUser, sharerToken;
  let recipientUser, recipientToken; 
  let nonExistentRecipientEmail = 'donotexist@gmail.com';

  beforeEach(async () => {
    await User.deleteMany({});
    await Share.deleteMany({});

    sharerUser = await User.create({
      name: 'Sharer User',
      username: 'sharer',
      email: 'sharer@gmail.com',
      password: 'Password123!',
      favoriteStocks: ['AAPL', 'TSLA']
    });
    sharerToken = jwt.sign({ id: sharerUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    recipientUser = await User.create({
      name: 'Recipient User',
      username: 'recipient',
      email: 'recipient@gmail.com',
      password: 'Password123!',
      favoriteStocks: ['MSFT']
    });
    recipientToken = jwt.sign({ id: recipientUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  describe('POST /api/shares (Share My Favorites)', () => {
    it('should allow a user to share their favorites with a registered user', async () => {
      const res = await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: recipientUser.email })
        .expect(201);

      expect(res.body.message).toMatch(/Đã chia sẻ danh sách yêu thích với/i);
      expect(res.body.share.sharer).toBe(sharerUser._id.toString());
      expect(res.body.share.recipientEmail).toBe(recipientUser.email);
      expect(res.body.share.recipientUser).toBe(recipientUser._id.toString()); 

      const shareDoc = await Share.findById(res.body.share._id);
      expect(shareDoc).not.toBeNull();
    });

    it('should allow a user to share their favorites with a non-registered email', async () => {
      const res = await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: nonExistentRecipientEmail })
        .expect(201);

      expect(res.body.share.recipientEmail).toBe(nonExistentRecipientEmail);
      expect(res.body.share.recipientUser).toBeNull();
    });

    it('should not allow sharing with oneself', async () => {
      const res = await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: sharerUser.email })
        .expect(400);
      expect(res.body.message).toMatch(/Bạn không thể tự chia sẻ cho chính mình/i);
    });

    it('should not allow sharing with the same email twice', async () => {
      // Chia sẻ lần 1
      await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: recipientUser.email })
        .expect(201);

      // Chia sẻ lần 2 (thất bại)
      const res = await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: recipientUser.email })
        .expect(400);
      expect(res.body.message).toMatch(/Bạn đã chia sẻ danh sách này với .* rồi/i);
    });

     it('should return 400 if recipientEmail is missing or invalid', async () => {
      await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: '' })
        .expect(400);
    });

    it('should return 401 if not authenticated', async () => {
        await api
            .post('/api/shares')
            .send({ recipientEmail: recipientUser.email })
            .expect(401);
    });
  });

  describe('GET /api/shares/with-me (Get Lists Shared With Me)', () => {
    let shareFromSharerToRecipient;

    beforeEach(async () => {
      const shareResponse = await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: recipientUser.email });
      shareFromSharerToRecipient = shareResponse.body.share;
    });

    it('should return lists shared with the authenticated user (recipient)', async () => {
      const res = await api
        .get('/api/shares/with-me')
        .set('Authorization', `Bearer ${recipientToken}`) 
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(1);
      const sharedList = res.body[0];
      expect(sharedList.shareId).toBe(shareFromSharerToRecipient._id);
      expect(sharedList.sharerInfo.email).toBe(sharerUser.email);
      expect(sharedList.sharerInfo.username).toBe(sharerUser.username);
      expect(sharedList.favoriteStocks).toEqual(expect.arrayContaining(sharerUser.favoriteStocks));
    });

    it('should return an empty array if no lists are shared with the user', async () => {
      const newUser = await User.create({ name: 'Lonely User', username: 'lonely', email: 'lonely@gmail.com', password: 'Password123!' });
      const newUserToken = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);

      const res = await api
        .get('/api/shares/with-me')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('should return 401 if not authenticated', async () => {
        await api.get('/api/shares/with-me').expect(401);
    });
  });

  describe('GET /api/shares/my-shares (Get My Shared Instances)', () => {
    beforeEach(async () => {
      await api.post('/api/shares').set('Authorization', `Bearer ${sharerToken}`).send({ recipientEmail: recipientUser.email });
      await api.post('/api/shares').set('Authorization', `Bearer ${sharerToken}`).send({ recipientEmail: nonExistentRecipientEmail });
    });

    it('should return all instances where the authenticated user is the sharer', async () => {
      const res = await api
        .get('/api/shares/my-shares')
        .set('Authorization', `Bearer ${sharerToken}`) 
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(2);
      expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ recipientEmail: recipientUser.email }),
        expect.objectContaining({ recipientEmail: nonExistentRecipientEmail })
      ]));
      expect(res.body[0].favoriteStocks).toBeUndefined();
    });

     it('should return an empty array if user has not shared any lists', async () => {
        const res = await api
            .get('/api/shares/my-shares')
            .set('Authorization', `Bearer ${recipientToken}`) 
            .expect(200);
        expect(res.body).toEqual([]);
    });
  });

  describe('DELETE /api/shares/:shareId (Unshare List)', () => {
    let shareIdToUnshare;

    beforeEach(async () => {
      const shareResponse = await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: recipientUser.email });
      shareIdToUnshare = shareResponse.body.share._id;
    });

    it('should allow the sharer to unshare a list', async () => {
      const res = await api
        .delete(`/api/shares/${shareIdToUnshare}`)
        .set('Authorization', `Bearer ${sharerToken}`) 
        .expect(200);

      expect(res.body.message).toMatch(/Đã thu hồi chia sẻ với/i);
      const shareDoc = await Share.findById(shareIdToUnshare);
      expect(shareDoc).toBeNull();
    });

    it('should not allow a non-sharer (e.g., recipient) to unshare', async () => {
      const res = await api
        .delete(`/api/shares/${shareIdToUnshare}`)
        .set('Authorization', `Bearer ${recipientToken}`) 
        .expect(403);
      expect(res.body.message).toMatch(/Bạn không có quyền thu hồi lượt chia sẻ này/i);
    });

    it('should return 404 if shareId does not exist', async () => {
      const nonExistentShareId = new mongoose.Types.ObjectId();
      await api
        .delete(`/api/shares/${nonExistentShareId}`)
        .set('Authorization', `Bearer ${sharerToken}`)
        .expect(404);
    });

    it('should return 400 for invalid shareId', async () => {
        await api
            .delete('/api/shares/invalidID123')
            .set('Authorization', `Bearer ${sharerToken}`)
            .expect(400); 
    });
  });
});