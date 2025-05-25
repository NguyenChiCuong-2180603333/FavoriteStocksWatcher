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
      if (error.response && error.response.data && error.response.data.message) {
        throw error.response.data; // err trong component sẽ là { message: "..." }
      }
      console.error(`Lỗi khi thêm mã ${symbol}:`, error.message);
      throw new Error(error.message || `Không thể thêm mã ${symbol}. Vui lòng thử lại.`);
    }
  },

  removeFavoriteStock: async (symbol) => {
    try {
      const response = await api.delete(`/stocks/favorites/${symbol}`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi xóa mã ${symbol}:`, error.response?.data || error);
      if (error.response && error.response.data && error.response.data.message) {
        throw error.response.data;
      }
      throw new Error(error.message || `Không thể xóa mã ${symbol}.`);
    }
  },

  getPublicStockPrices: async (symbolsString) => {
    if (!symbolsString) return Promise.resolve([]);
    try {
      const response = await api.get(`/stocks/prices?symbols=${symbolsString}`);
      return response.data;
    } catch (error) {
      console.error(`Lỗi khi lấy giá công khai cho các mã ${symbolsString}:`, error.response?.data || error);
       if (error.response && error.response.data && error.response.data.message) {
        throw error.response.data;
      }
      throw new Error(error.message || `Không thể lấy giá công khai cho mã ${symbolsString}.`);
    }
  },
};


export default StockService;