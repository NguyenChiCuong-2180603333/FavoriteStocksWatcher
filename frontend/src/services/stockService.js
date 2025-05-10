import api from './api'; 

const StockService = {
  getFavoriteStocksWithDetails: async () => {
    try {
      const response = await api.get('/stocks/favorites/details');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy chi tiết cổ phiếu yêu thích:', error);
      throw error.response?.data || error;
    }
  },

  addFavoriteStock: async (symbol) => {
    try {
      const response = await api.post('/stocks/favorites', { symbol });
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi thêm mã ${symbol}:`, error);
      throw error.response?.data || error;
    }
  },

  removeFavoriteStock: async (symbol) => {
    try {
      const response = await api.delete(`/stocks/favorites/${symbol}`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi xóa mã ${symbol}:`, error);
      throw error.response?.data || error;
    }
  },

  getPublicStockPrices: async (symbolsString) => {
    if (!symbolsString) return Promise.resolve([]);
    try {
      const response = await api.get(`/stocks/prices?symbols=${symbolsString}`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi lấy giá công khai cho các mã ${symbolsString}:`, error);
      throw error.response?.data || error; 
    }
  },

};

export default StockService;