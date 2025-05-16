import StockService from '../services/stockService';
import api from '../services/api'; 

jest.mock('../services/api');

describe('StockService', () => {
  afterEach(() => {
    jest.clearAllMocks(); 
  });

  describe('getFavoriteStocksWithDetails', () => {
    test('should fetch favorite stocks with details successfully', async () => {
      const mockData = [{ symbol: 'AAPL', price: 150 }];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await StockService.getFavoriteStocksWithDetails();

      expect(api.get).toHaveBeenCalledWith('/stocks/favorites/details');
      expect(result).toEqual(mockData);
    });

    test('should throw error if API call fails', async () => {
      const errorMessage = 'Network Error';
      api.get.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });

      await expect(StockService.getFavoriteStocksWithDetails()).rejects.toEqual({ message: errorMessage });
      expect(api.get).toHaveBeenCalledWith('/stocks/favorites/details');
    });
  });

  describe('addFavoriteStock', () => {
    test('should add a favorite stock successfully', async () => {
      const symbol = 'MSFT';
      const mockResponse = { message: `${symbol} added` };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await StockService.addFavoriteStock(symbol);

      expect(api.post).toHaveBeenCalledWith('/stocks/favorites', { symbol });
      expect(result).toEqual(mockResponse);
    });

     test('should throw error if adding stock fails', async () => {
      const symbol = 'MSFT';
      const errorMessage = 'Failed to add';
      api.post.mockRejectedValueOnce({ response: { data: { message: errorMessage } } });

      await expect(StockService.addFavoriteStock(symbol)).rejects.toEqual({ message: errorMessage });
      expect(api.post).toHaveBeenCalledWith('/stocks/favorites', { symbol });
    });
  });

  describe('removeFavoriteStock', () => {
    test('should remove a favorite stock successfully', async () => {
      const symbol = 'AAPL';
      const mockResponse = { message: `${symbol} removed` };
      api.delete.mockResolvedValueOnce({ data: mockResponse });

      const result = await StockService.removeFavoriteStock(symbol);

      expect(api.delete).toHaveBeenCalledWith(`/stocks/favorites/${symbol}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPublicStockPrices', () => {
    test('should return empty array if symbolsString is empty', async () => {
      const result = await StockService.getPublicStockPrices('');
      expect(result).toEqual([]);
      expect(api.get).not.toHaveBeenCalled();
    });

    test('should fetch public stock prices successfully', async () => {
      const symbolsString = 'TSLA,NVDA';
      const mockData = [{ symbol: 'TSLA', price: 700 }];
      api.get.mockResolvedValueOnce({ data: mockData });

      const result = await StockService.getPublicStockPrices(symbolsString);
      expect(api.get).toHaveBeenCalledWith(`/stocks/prices?symbols=${symbolsString}`);
      expect(result).toEqual(mockData);
    });
  });
});