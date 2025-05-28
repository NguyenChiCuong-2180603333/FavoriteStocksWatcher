import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Share from '../models/Share.js';
import { api } from '../tests/setupTests.js';

describe('Share API Routes', () => {
  let sharerUser, sharerToken;
  let recipientUser, recipientToken;
  let anotherRecipientUser, anotherRecipientToken;
  const nonExistentRecipientEmail = 'donotexist@example.com';

  beforeEach(async () => {
    await User.deleteMany({});
    await Share.deleteMany({});

    sharerUser = await User.create({
      name: 'Sharer User',
      username: 'sharer',
      email: 'sharer@example.com',
      password: 'Password123!',
      favoriteStocks: ['AAPL', 'TSLA'],
      agreedToTerms: true,
    });
    sharerToken = jwt.sign({ id: sharerUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    recipientUser = await User.create({
      name: 'Recipient User',
      username: 'recipient',
      email: 'recipient@example.com',
      password: 'Password123!',
      favoriteStocks: ['MSFT'],
      agreedToTerms: true,
    });
    recipientToken = jwt.sign({ id: recipientUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    anotherRecipientUser = await User.create({
      name: 'Another Recipient User',
      username: 'anotherrecipient',
      email: 'another@example.com',
      password: 'Password123!',
      agreedToTerms: true,
    });
    anotherRecipientToken = jwt.sign({ id: anotherRecipientUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Share.deleteMany({});
  });

  describe('POST /api/shares (Share My Favorites)', () => {
    it('should allow a user to share their favorites with a registered user', async () => {
      const res = await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: recipientUser.email })
        .expect(201);

      expect(res.body.message).toBe(`Đã chia sẻ thành công danh sách cổ phiếu yêu thích của bạn với ${recipientUser.email}.`);
      expect(res.body).toHaveProperty('shareDetails');
      const { shareDetails } = res.body;
      expect(shareDetails.sharer).toBe(sharerUser._id.toString());
      expect(shareDetails.recipientUser).toBe(recipientUser._id.toString());
      expect(shareDetails.sharedStocks).toEqual(expect.arrayContaining(['AAPL', 'TSLA']));
      expect(shareDetails.status).toBe('active');

      const shareDoc = await Share.findById(shareDetails._id);
      expect(shareDoc).not.toBeNull();
    });

    it('should return 404 if recipient email does not belong to a registered user', async () => {
      const res = await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: nonExistentRecipientEmail })
        .expect(404);

      expect(res.body.message).toBe(`Người dùng với email '${nonExistentRecipientEmail}' không tồn tại trong hệ thống.`);
    });

    it('should not allow sharing with oneself', async () => {
      const res = await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: sharerUser.email })
        .expect(400);
      expect(res.body.message).toBe('Bạn không thể chia sẻ danh sách cho chính mình.');
    });

    it('should return 409 if an active share already exists with the same recipient', async () => {
      await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: recipientUser.email })
        .expect(201);

      const res = await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: recipientUser.email })
        .expect(409);
      expect(res.body.message).toBe(`Bạn đã chia sẻ danh sách của mình với ${recipientUser.email} rồi.`);
    });

    it('should return 400 if recipientEmail is missing, empty, too long, or invalid format', async () => {
      let longEmail = 'a';
      for (let i = 0; i < 256; i++) { longEmail += 'a'; }
      longEmail += '@example.com';

      const testCases = [
        { payload: {}, expectedStatus: 400, expectedMessage: 'Vui lòng cung cấp email người nhận.' },
        { payload: { recipientEmail: '' }, expectedStatus: 400, expectedMessage: 'Vui lòng cung cấp email người nhận.' },
        { payload: { recipientEmail: '   ' }, expectedStatus: 400, expectedMessage: 'Vui lòng cung cấp email người nhận.' },
        { payload: { recipientEmail: 'invalidemailformat' }, expectedStatus: 400, expectedMessage: 'Địa chỉ email người nhận không hợp lệ.' },
        { payload: { recipientEmail: longEmail }, expectedStatus: 400, expectedMessage: 'Email người nhận không được vượt quá 256 ký tự.' },
      ];

      for (const tc of testCases) {
        const res = await api
          .post('/api/shares')
          .set('Authorization', `Bearer ${sharerToken}`)
          .send(tc.payload)
          .expect(tc.expectedStatus);
        expect(res.body.message).toBe(tc.expectedMessage);
      }
    });
    
    it('should return 400 if sharer has no favorite stocks', async () => {
      await User.findByIdAndUpdate(sharerUser._id, { favoriteStocks: [] });
      const res = await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: recipientUser.email })
        .expect(400);
      expect(res.body.message).toBe('Danh sách cổ phiếu yêu thích của bạn đang trống. Không thể chia sẻ.');
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
      if (shareResponse.body && shareResponse.body.shareDetails) {
        shareFromSharerToRecipient = shareResponse.body.shareDetails;
      } else {
        console.error('Unexpected shareResponse structure in GET /with-me beforeEach:', shareResponse.body);
      }
    });

    it('should return lists shared with the authenticated user (recipient)', async () => {
      expect(shareFromSharerToRecipient).toBeDefined(); 
      
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
      expect(sharedList.sharerInfo.name).toBe(sharerUser.name);
      expect(sharedList.favoriteStocks).toEqual(expect.arrayContaining(sharerUser.favoriteStocks));
      expect(sharedList).toHaveProperty('sharedAt');
    });

    it('should return an empty array if no lists are shared with the user', async () => {
      const res = await api
        .get('/api/shares/with-me')
        .set('Authorization', `Bearer ${anotherRecipientToken}`)
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
      await api.post('/api/shares').set('Authorization', `Bearer ${sharerToken}`).send({ recipientEmail: anotherRecipientUser.email });
    });

    it('should return all active instances where the authenticated user is the sharer', async () => {
      const res = await api
        .get('/api/shares/my-shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .expect(200);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(2);
      
      const expectedRecipients = [recipientUser.email, anotherRecipientUser.email];
      res.body.forEach(share => {
        expect(expectedRecipients).toContain(share.recipientEmail);
        expect(share).toHaveProperty('recipientName');
        expect(share).toHaveProperty('sharedStocksCount', sharerUser.favoriteStocks.length);
        expect(share).toHaveProperty('status', 'active');
        expect(share).toHaveProperty('_id');
        expect(share).toHaveProperty('createdAt');
        expect(share.sharedStocks).toBeUndefined();
      });
    });

    it('should return an empty array if user has not shared any lists', async () => {
      const res = await api
            .get('/api/shares/my-shares')
            .set('Authorization', `Bearer ${recipientToken}`)
            .expect(200);
      expect(res.body).toEqual([]);
    });

    it('should return 401 if not authenticated', async () => {
        await api.get('/api/shares/my-shares').expect(401);
    });
  });

  describe('DELETE /api/shares/:shareId (Unshare List)', () => {
    let shareIdToUnshare;

    beforeEach(async () => {
      const shareResponse = await api
        .post('/api/shares')
        .set('Authorization', `Bearer ${sharerToken}`)
        .send({ recipientEmail: recipientUser.email });
      if (shareResponse.body && shareResponse.body.shareDetails && shareResponse.body.shareDetails._id) {
        shareIdToUnshare = shareResponse.body.shareDetails._id;
      } else {
        console.error('Lỗi tạo share trong DELETE beforeEach:', shareResponse.body);
      
      }
    });

    it('should allow the sharer to unshare a list', async () => {
      expect(shareIdToUnshare).toBeDefined();

      const res = await api
        .delete(`/api/shares/${shareIdToUnshare}`)
        .set('Authorization', `Bearer ${sharerToken}`)
        .expect(200);

      expect(res.body.message).toMatch(/Đã thu hồi chia sẻ với/i);

      const shareDoc = await Share.findById(shareIdToUnshare);
      expect(shareDoc).toBeNull();
    });

    it('should not allow a non-sharer (e.g., recipient) to unshare', async () => {
      expect(shareIdToUnshare).toBeDefined();
      const res = await api
        .delete(`/api/shares/${shareIdToUnshare}`)
        .set('Authorization', `Bearer ${recipientToken}`)
        .expect(403);
      expect(res.body.message).toBe('Bạn không có quyền thu hồi lượt chia sẻ này.');
    });

    it('should return 404 if shareId does not exist', async () => {
      const nonExistentShareId = new mongoose.Types.ObjectId();
      const res = await api
        .delete(`/api/shares/${nonExistentShareId}`)
        .set('Authorization', `Bearer ${sharerToken}`)
        .expect(404);
      expect(res.body.message).toBe('Không tìm thấy lượt chia sẻ này.');
    });

    it('should return 400 for invalid shareId format', async () => {
      const res = await api
            .delete('/api/shares/invalidID123')
            .set('Authorization', `Bearer ${sharerToken}`)
            .expect(400); 
      expect(res.body.message).toBe('ID lượt chia sẻ không hợp lệ.'); 
    });

    it('should return 401 if not authenticated', async () => {
        const dummyShareId = new mongoose.Types.ObjectId().toString();
        await api.delete(`/api/shares/${shareIdToUnshare || dummyShareId}`).expect(401);
    });
  });
});