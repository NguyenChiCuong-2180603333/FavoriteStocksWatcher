import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { api } from '../tests/setupTests.js';
import axios from 'axios';

describe('Stock API Routes', () => {
  let user, token;
  const originalFinnhubApiKey = process.env.FINNHUB_API_KEY;

  beforeEach(async () => {
    if (axios.get.mockReset) {
        axios.get.mockReset();
    }
    await User.deleteMany({});
    process.env.FINNHUB_API_KEY = 'test_api_key_before_each';

    user = await User.create({
      name: 'Nguyen Van A',
      username: 'UserA',
      email: 'Vana@gmail.com',
      password: 'Password123!',
      favoriteStocks: ['AAPL', 'GOOGL'],
      agreedToTerms: true,
    });

    token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    process.env.FINNHUB_API_KEY = originalFinnhubApiKey;
  });

  describe('GET /api/stocks/prices', () => {
    it('should get stock prices for given symbols', async () => {
      process.env.FINNHUB_API_KEY = 'valid_key_for_success_case';
      axios.get.mockImplementation(async (url, config) => {
        const symbol = config.params.symbol;
        if (symbol === 'AAPL') return { data: { c: 150.0, o: 149.0, pc: 148.0 } };
        if (symbol === 'GOOGL') return { data: { c: 2500.0, o: 2490.0, pc: 2480.0 } };
        return Promise.resolve({ data: { message: `No mock for ${symbol}` } });
      });

      const res = await api
        .get('/api/stocks/prices?symbols=AAPL,GOOGL')
        .expect(200);

      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(res.body).toEqual(expect.arrayContaining([
        { symbol: 'AAPL', currentPrice: 150.0, openPrice: 149.0, previousClosePrice: 148.0 },
        { symbol: 'GOOGL', currentPrice: 2500.0, openPrice: 2490.0, previousClosePrice: 2480.0 },
      ]));
    });

    it('should handle symbols with no price data from Finnhub', async () => {
      process.env.FINNHUB_API_KEY = 'valid_key_for_no_data_case';
      axios.get.mockImplementation(async (url, config) => {
        const symbol = config.params.symbol;
        if (symbol === 'GOODSYM') return { data: { c: 10.0, o: 9.0, pc: 8.0 } };
        if (symbol === 'BADSYM') return { data: { o: 1.0, pc: 0.5 } };
        if (symbol === 'ZEROSYM') return { data: { c: 0, o: 0, h: 0, l: 0, pc: 0 } };
        return Promise.resolve({ data: {} });
      });

      const res = await api
        .get('/api/stocks/prices?symbols=GOODSYM,BADSYM,ZEROSYM')
        .expect(200);

      expect(axios.get).toHaveBeenCalledTimes(3);
      expect(res.body).toEqual(expect.arrayContaining([
        { symbol: 'GOODSYM', currentPrice: 10.0, openPrice: 9.0, previousClosePrice: 8.0 },
        { symbol: 'BADSYM', currentPrice: null, error: 'Không tìm thấy dữ liệu giá cho BADSYM.' },
        { symbol: 'ZEROSYM', currentPrice: null, openPrice: null, previousClosePrice: null, error: 'Không có dữ liệu giá cho ZEROSYM hoặc mã không hợp lệ.' },
      ]));
    });

    it('should return 500 if Finnhub API key is missing in environment', async () => {
      const keyBackup = process.env.FINNHUB_API_KEY;
      delete process.env.FINNHUB_API_KEY;

      const res = await api
        .get('/api/stocks/prices?symbols=AAPL')
        .expect(500);
      expect(res.body.message).toBe('Lỗi cấu hình máy chủ: API key cho dịch vụ tài chính bị thiếu.');
      process.env.FINNHUB_API_KEY = keyBackup;
    });

    it('should handle Finnhub API errors and timeouts gracefully', async () => {
      process.env.FINNHUB_API_KEY = 'valid_key_for_api_error_case';
      axios.get.mockImplementation(async (url, config) => {
        const symbol = config.params.symbol;
        if (symbol === 'APIERR') {
          const error = new Error('Simulated API Generic Error');
          error.isAxiosError = true;
          throw error;
        }
        if (symbol === 'TIMEOUTSYM') {
          const error = new Error('Simulated Timeout Error');
          error.code = 'ECONNABORTED';
          error.isAxiosError = true;
          throw error;
        }
        if (symbol === 'GOOGL') return { data: { c: 10.0, o: 9.0, pc: 8.0 } };
        return Promise.resolve({ data: {} });
      });

      const res = await api.get('/api/stocks/prices?symbols=APIERR,TIMEOUTSYM,GOOGL').expect(200);
      expect(axios.get).toHaveBeenCalledTimes(3);
      expect(res.body).toEqual(expect.arrayContaining([
        { symbol: 'APIERR', currentPrice: null, error: 'Lỗi API khi lấy dữ liệu cho APIERR.' },
        { symbol: 'TIMEOUTSYM', currentPrice: null, error: 'Timeout khi lấy dữ liệu cho TIMEOUTSYM.' },
        { symbol: 'GOOGL', currentPrice: 10.0, openPrice: 9.0, previousClosePrice: 8.0 },
      ]));
    });

    it('should return 400 if symbols parameter is missing or empty string', async () => {
      let res = await api.get('/api/stocks/prices').expect(400);
      expect(res.body.message).toBe('Vui lòng cung cấp danh sách mã cổ phiếu (symbols).');

      res = await api.get('/api/stocks/prices?symbols=').expect(400);
      expect(res.body.message).toBe('Vui lòng cung cấp danh sách mã cổ phiếu (symbols).');
    });
  });

  describe('GET /api/stocks/favorites (Lấy danh sách mã yêu thích)', () => {
    it('should get favorite stock symbols for the authenticated user', async () => {
      const res = await api
        .get('/api/stocks/favorites')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toEqual(expect.arrayContaining(['AAPL', 'GOOGL']));
      expect(res.body.length).toBe(2);
    });

    it('should return an empty array if user has no favorites', async () => {
      await User.findByIdAndUpdate(user._id, { favoriteStocks: [] });
      const res = await api
        .get('/api/stocks/favorites')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toEqual([]);
    });

    it('should return 401 if not authenticated', async () => {
      await api.get('/api/stocks/favorites').expect(401);
    });

    it('should return 401 if authenticated user is not found (e.g., deleted after token issuance)', async () => {
        const nonExistentUserId = new mongoose.Types.ObjectId();
        const nonExistentUserToken = jwt.sign({ id: nonExistentUserId }, process.env.JWT_SECRET);
        
        const res = await api
            .get('/api/stocks/favorites')
            .set('Authorization', `Bearer ${nonExistentUserToken}`)
            .expect(401); 
        expect(res.body.message).toBe('Xác thực thất bại: Token không hợp lệ hoặc đã hết hạn.');
    });
  });

  describe('GET /api/stocks/favorites/details', () => {
    it('should get detailed prices for favorite stocks', async () => {
      process.env.FINNHUB_API_KEY = 'valid_key_fav_details';
      axios.get.mockImplementation(async (url, config) => {
        const symbol = config.params.symbol;
        if (symbol === 'AAPL') return { data: { c: 170.50, o: 170.00, pc: 169.80 } };
        if (symbol === 'GOOGL') return { data: { c: 2800.75, o: 2790.00, pc: 2785.50 } };
        return Promise.resolve({ data: {} });
      });

      const res = await api
        .get('/api/stocks/favorites/details')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ symbol: 'AAPL', currentPrice: 170.50 }),
        expect.objectContaining({ symbol: 'GOOGL', currentPrice: 2800.75 }),
      ]));
    });

    it('should return an empty array if user has no favorite stocks for details', async () => {
      process.env.FINNHUB_API_KEY = 'valid_key_no_fav_details';
      await User.findByIdAndUpdate(user._id, { favoriteStocks: [] });
      const res = await api
        .get('/api/stocks/favorites/details')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).toEqual([]);
      expect(axios.get).not.toHaveBeenCalled();
    });
    
    it('should return 500 if Finnhub API key is missing for favorites/details', async () => {
      const keyBackup = process.env.FINNHUB_API_KEY;
      delete process.env.FINNHUB_API_KEY;
      const res = await api
        .get('/api/stocks/favorites/details')
        .set('Authorization', `Bearer ${token}`)
        .expect(500);
      expect(res.body.message).toBe('Lỗi cấu hình máy chủ: API key cho dịch vụ tài chính bị thiếu.');
      process.env.FINNHUB_API_KEY = keyBackup;
    });

    it('should handle cases where some favorite stocks have no price data (favorites/details)', async () => {
      process.env.FINNHUB_API_KEY = 'valid_key_fav_details_no_data';
      await User.findByIdAndUpdate(user._id, { favoriteStocks: ['AAPL', 'UNKNOWN', 'ZEROSYM'] });
      axios.get.mockImplementation(async (url, config) => {
        const symbol = config.params.symbol;
        if (symbol === 'AAPL') return { data: { c: 170.50, o:170.00, pc:169.80 } };
        if (symbol === 'UNKNOWN') return { data: { o: 1.0, pc: 0.5 } };
        if (symbol === 'ZEROSYM') return { data: { c: 0, o: 0, h: 0, l: 0, pc: 0 } };
        return Promise.resolve({ data: {} });
      });

      const res = await api
        .get('/api/stocks/favorites/details')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(axios.get).toHaveBeenCalledTimes(3);
      expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ symbol: 'AAPL', currentPrice: 170.50 }),
        expect.objectContaining({ symbol: 'UNKNOWN', currentPrice: null, error: 'Không tìm thấy dữ liệu giá cho UNKNOWN.' }),
        expect.objectContaining({ symbol: 'ZEROSYM', currentPrice: null, openPrice: null, previousClosePrice: null, error: 'Không có dữ liệu giá cho ZEROSYM hoặc mã không hợp lệ.' }),
      ]));
    });

    it('should handle Finnhub API errors for individual favorite stocks (favorites/details)', async () => {
      process.env.FINNHUB_API_KEY = 'valid_key_fav_details_api_error';
      await User.findByIdAndUpdate(user._id, { favoriteStocks: ['AAPL', 'ERRORSYM', 'TIMEOUTSYM', 'GOOGL'] });
      axios.get.mockImplementation(async (url, config) => {
        const symbol = config.params.symbol;
        if (symbol === 'AAPL') return { data: { c: 170.50, o:170.00, pc:169.80 } };
        if (symbol === 'ERRORSYM') {
          const apiError = new Error('Simulated API Error for ERRORSYM stock');
          apiError.isAxiosError = true;
          throw apiError;
        }
        if (symbol === 'TIMEOUTSYM') {
          const apiError = new Error('Simulated Timeout for TIMEOUTSYM stock');
          apiError.code = 'ECONNABORTED';
          apiError.isAxiosError = true;
          throw apiError;
        }
        if (symbol === 'GOOGL') return { data: { c: 2800.75, o:2790.00, pc:2785.50 } };
        return Promise.resolve({ data: {} });
      });

      const res = await api
        .get('/api/stocks/favorites/details')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(axios.get).toHaveBeenCalledTimes(4);
      expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ symbol: 'AAPL', currentPrice: 170.50 }),
        expect.objectContaining({ symbol: 'ERRORSYM', currentPrice: null, error: 'Lỗi API khi lấy dữ liệu cho ERRORSYM.' }),
        expect.objectContaining({ symbol: 'TIMEOUTSYM', currentPrice: null, error: 'Timeout khi lấy dữ liệu cho TIMEOUTSYM.' }),
        expect.objectContaining({ symbol: 'GOOGL', currentPrice: 2800.75 }),
      ]));
    });
     it('should return 401 if not authenticated for favorites/details', async () => {
      await api.get('/api/stocks/favorites/details').expect(401);
    });
  });

  describe('POST /api/stocks/favorites (Thêm cổ phiếu yêu thích)', () => {
    beforeEach(() => {
        process.env.FINNHUB_API_KEY = 'a_valid_api_key_for_add';
    });

    it('should add a new valid stock to favorites', async () => {
      axios.get.mockResolvedValueOnce({ data: { c: 200.0, pc: 198.0 } });

      const res = await api
        .post('/api/stocks/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'TSLA' })
        .expect(201);

      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('finnhub.io/api/v1/quote'), expect.objectContaining({ params: { symbol: 'TSLA', token: 'a_valid_api_key_for_add' } }));
      expect(res.body.message).toBe("Đã thêm mã 'TSLA' vào danh sách yêu thích!");
      expect(res.body.favoriteStocks).toContain('TSLA');
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.favoriteStocks).toContain('TSLA');
    });

    it('should return 409 if stock already in favorites', async () => {
      axios.get.mockResolvedValueOnce({ data: { c: 150.0, pc: 148.0 } });

      const res = await api
        .post('/api/stocks/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'AAPL' })
        .expect(409);
      expect(res.body.message).toBe("Mã cổ phiếu 'AAPL' đã có trong danh sách yêu thích.");
    });

    it('should return 400 if stock symbol is invalid (Finnhub returns all zeros)', async () => {
      axios.get.mockResolvedValueOnce({ data: { c: 0, o: 0, h: 0, l: 0, pc: 0 } });
      
      const res = await api
        .post('/api/stocks/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'ZEROSYMBOL' })
        .expect(400);
      expect(res.body.message).toBe("Mã cổ phiếu 'ZEROSYMBOL' không tìm thấy hoặc không phải là mã hợp lệ.");
    });
    
    it('should return 400 if stock symbol validation returns uncertain', async () => {
      axios.get.mockResolvedValueOnce({ data: { c: 0, pc: 0, o: 1, h: 1, l: 1 } }); 
      
      const res = await api
        .post('/api/stocks/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'UNCERTAIN' })
        .expect(400);
      expect(res.body.message).toBe("Không thể xác nhận tính hợp lệ của mã cổ phiếu 'UNCERTAIN'.");
    });

    it('should return 400 if stock symbol is empty or missing in request body', async () => {
      let res = await api
        .post('/api/stocks/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: '  ' })
        .expect(400);
      expect(res.body.message).toBe('Vui lòng cung cấp mã cổ phiếu hợp lệ.');

      res = await api
        .post('/api/stocks/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
      expect(res.body.message).toBe('Vui lòng cung cấp mã cổ phiếu hợp lệ.');
    });
    
    it('should return 500 if Finnhub API key is missing during validation call', async () => {
      delete process.env.FINNHUB_API_KEY;

      const res = await api
        .post('/api/stocks/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'ANYVALID' })
        .expect(500);
      expect(res.body.message).toBe('Lỗi cấu hình máy chủ: API key cho dịch vụ tài chính bị thiếu.');
    });

    it('should handle Finnhub API timeout during validation', async () => {
      axios.get.mockImplementationOnce(() => {
        const error = new Error('Simulated Finnhub Timeout');
        error.code = 'ECONNABORTED';
        throw error;
      });

      const res = await api
        .post('/api/stocks/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'TIMEOUTVALIDATE' })
        .expect(400);
      expect(res.body.message).toBe('Dịch vụ xác thực mã cổ phiếu bị quá tải hoặc không phản hồi. Vui lòng thử lại sau.');
    });

    it('should handle Finnhub 401/403 error during validation', async () => {
      axios.get.mockImplementationOnce(() => {
        const error = new Error('Simulated Finnhub Auth Error');
        error.response = { status: 401 };
        throw error;
      });

      const res = await api
        .post('/api/stocks/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'AUTHFAILSYM' })
        .expect(400);
      expect(res.body.message).toBe('Lỗi xác thực với dịch vụ tài chính. Vui lòng kiểm tra API key phía máy chủ.');
    });

    it('should handle Finnhub 429 error during validation', async () => {
      axios.get.mockImplementationOnce(() => {
        const error = new Error('Simulated Finnhub Rate Limit Error');
        error.response = { status: 429 };
        throw error;
      });

      const res = await api
        .post('/api/stocks/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'RATELIMITSYM' })
        .expect(400);
      expect(res.body.message).toBe('Vượt quá giới hạn yêu cầu đến dịch vụ tài chính. Vui lòng thử lại sau.');
    });
    
    it('should handle other Finnhub API errors during validation', async () => {
      axios.get.mockImplementationOnce(() => {
        const error = new Error('Some Other Finnhub Error');
        error.response = { status: 503 };
        throw error;
      });

      const res = await api
        .post('/api/stocks/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ symbol: 'OTHERAPIERR' })
        .expect(400);
      expect(res.body.message).toBe('Không thể xác thực mã cổ phiếu do sự cố dịch vụ bên ngoài.');
    });

    it('should return 401 if not authenticated', async () => {
      await api.post('/api/stocks/favorites').send({ symbol: 'TSLA' }).expect(401);
    });
  });

  describe('DELETE /api/stocks/favorites/:symbol (Xóa cổ phiếu yêu thích)', () => {
    it('should remove a stock from favorites and return the updated list', async () => {
      const res = await api
        .delete('/api/stocks/favorites/AAPL')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual(['GOOGL']);
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.favoriteStocks).not.toContain('AAPL');
    });

    it('should return the current list if stock to remove is not in favorites', async () => {
      const res = await api
        .delete('/api/stocks/favorites/MSFT')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body).toEqual(expect.arrayContaining(['AAPL', 'GOOGL']));
    });

    it('should return 400 if symbol in params is invalid (empty after trim)', async () => {
      const res = await api
        .delete('/api/stocks/favorites/%20%20%20')
        .set('Authorization', `Bearer ${token}`)
        .expect(400);
      expect(res.body.message).toBe('Mã cổ phiếu (symbol) không hợp lệ.');
    });
    
    it('should return 401 if not authenticated', async () => {
      await api.delete('/api/stocks/favorites/AAPL').expect(401);
    });

     it('should return 401 if authenticated user is not found', async () => {
        const nonExistentUserId = new mongoose.Types.ObjectId();
        const nonExistentUserToken = jwt.sign({ id: nonExistentUserId }, process.env.JWT_SECRET);
        
        const res = await api
            .delete('/api/stocks/favorites/AAPL')
            .set('Authorization', `Bearer ${nonExistentUserToken}`)
            .expect(401); 
        expect(res.body.message).toBe('Xác thực thất bại: Token không hợp lệ hoặc đã hết hạn.');
    });
  });
});