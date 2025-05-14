import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { api } from '../tests/setupTests.js';
import axios from 'axios'; 

describe('Stock API Routes', () => {
  let user, token;
  const originalFinnhubApiKey = process.env.FINNHUB_API_KEY; 

  beforeEach(async () => {
    axios.get.mockReset();
 
    user = await User.create({
      name: 'Nguyen Van A',
      username: 'UserA',
      email: 'Vana@gmail.com',
      password: 'Password123!',
      favoriteStocks: ['AAPL', 'GOOGL'],
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
      expect(axios.get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ params: expect.objectContaining({ symbol: 'AAPL', token: 'valid_key_for_success_case' }) }));
      expect(axios.get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ params: expect.objectContaining({ symbol: 'GOOGL', token: 'valid_key_for_success_case' }) }));
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
        return Promise.resolve({ data: {} });
      });

      const res = await api
        .get('/api/stocks/prices?symbols=GOODSYM,BADSYM')
        .expect(200);

      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(res.body).toEqual(expect.arrayContaining([
        { symbol: 'GOODSYM', currentPrice: 10.0, openPrice: 9.0, previousClosePrice: 8.0 },
        { symbol: 'BADSYM', currentPrice: null, error: 'Không tìm thấy dữ liệu giá cho BADSYM.' },
      ]));
    });

    it('should return 500 if Finnhub API key is missing in environment', async () => {
      const keyBackup = process.env.FINNHUB_API_KEY;
      delete process.env.FINNHUB_API_KEY; 

      const res = await api
        .get('/api/stocks/prices?symbols=AAPL')
        .expect(500);
      expect(res.body.message).toMatch(/API key cho dịch vụ tài chính bị thiếu/i);
      expect(axios.get).not.toHaveBeenCalled(); 

      process.env.FINNHUB_API_KEY = keyBackup; 
    });

    it('should handle Finnhub API errors gracefully (e.g., 401, 403, 429)', async () => {
      process.env.FINNHUB_API_KEY = 'valid_key_for_api_error_case';
      axios.get.mockImplementation(async (url, config) => {
        const symbol = config.params.symbol;
        if (symbol === 'AAPL') {
          const error = new Error('Simulated API Unauthorized');
          error.response = { status: 401 }; 
          error.isAxiosError = true;
          throw error;
        }
        if (symbol === 'MSFT') {
          const error = new Error('Simulated API Rate Limit');
          error.response = { status: 429 };
          error.isAxiosError = true;
          throw error;
        }
        if (symbol === 'GOOGL') return { data: { c: 10.0, o: 9.0, pc: 8.0 } };
        return Promise.resolve({ data: {} });
      });

      const res = await api.get('/api/stocks/prices?symbols=AAPL,MSFT,GOOGL').expect(200);
      expect(axios.get).toHaveBeenCalledTimes(3);
      expect(res.body).toEqual(expect.arrayContaining([
        { symbol: 'AAPL', currentPrice: null, error: 'Lỗi xác thực với API tài chính.' },
        { symbol: 'MSFT', currentPrice: null, error: 'Đã vượt quá giới hạn request API tài chính.' },
        { symbol: 'GOOGL', currentPrice: 10.0, openPrice: 9.0, previousClosePrice: 8.0 },
      ]));
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
      expect(res.body.message).toMatch(/API key cho dịch vụ tài chính bị thiếu/i);
      expect(axios.get).not.toHaveBeenCalled();
      process.env.FINNHUB_API_KEY = keyBackup;
    });

    it('should handle cases where some favorite stocks have no price data (favorites/details)', async () => {
      process.env.FINNHUB_API_KEY = 'valid_key_fav_details_no_data';
      await User.findByIdAndUpdate(user._id, { favoriteStocks: ['AAPL', 'UNKNOWN'] });
      axios.get.mockImplementation(async (url, config) => {
        const symbol = config.params.symbol;
        if (symbol === 'AAPL') return { data: { c: 170.50 } };
        if (symbol === 'UNKNOWN') return { data: {} }; 
        return Promise.resolve({ data: {} });
      });

      const res = await api
        .get('/api/stocks/favorites/details')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(axios.get).toHaveBeenCalledTimes(2);
      expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ symbol: 'AAPL', currentPrice: 170.50 }),
        expect.objectContaining({ symbol: 'UNKNOWN', currentPrice: null, error: 'Không tìm thấy dữ liệu giá cho UNKNOWN.' }),
      ]));
    });

    it('should handle Finnhub API errors for individual favorite stocks (favorites/details)', async () => {
      process.env.FINNHUB_API_KEY = 'valid_key_fav_details_api_error';
      await User.findByIdAndUpdate(user._id, { favoriteStocks: ['AAPL', 'ERROR', 'GOOGL'] });
      axios.get.mockImplementation(async (url, config) => {
        const symbol = config.params.symbol;
        if (symbol === 'AAPL') return { data: { c: 170.50 } };
        if (symbol === 'ERROR') {
          const apiError = new Error('Simulated API Error for ERROR stock');
          apiError.response = { status: 500 }; 
          apiError.isAxiosError = true;
          throw apiError;
        }
        if (symbol === 'GOOGL') return { data: { c: 2800.75 } };
        return Promise.resolve({ data: {} });
      });

      const res = await api
        .get('/api/stocks/favorites/details')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(axios.get).toHaveBeenCalledTimes(3);
      expect(res.body).toEqual(expect.arrayContaining([
        expect.objectContaining({ symbol: 'AAPL', currentPrice: 170.50 }),
        expect.objectContaining({ symbol: 'ERROR', currentPrice: null, error: 'Lỗi khi lấy giá cho ERROR.' }),
        expect.objectContaining({ symbol: 'GOOGL', currentPrice: 2800.75 }),
      ]));
    });
  });
});