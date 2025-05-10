import User from '../models/User.js';
import axios from 'axios';


const fetchStockDataForSymbols = async (symbols) => {
  if (!symbols || symbols.length === 0) {
    return [];
  }

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.error('FINNHUB_API_KEY chưa được thiết lập trong file .env');
    throw new Error('Lỗi cấu hình máy chủ: API key cho dịch vụ tài chính bị thiếu.');
  }

  const pricePromises = symbols.map(async (symbol) => {
    try {
      const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
        params: {
          symbol: symbol,
          token: apiKey
        }
      });

      if (response.data && typeof response.data.c !== 'undefined') {
        return {
          symbol: symbol,
          currentPrice: response.data.c,
          openPrice: response.data.o,
          previousClosePrice: response.data.pc,
        };
      } else {
        console.warn(`Không tìm thấy dữ liệu giá cho mã: ${symbol} từ Finnhub. Phản hồi:`, response.data);
        return { symbol: symbol, currentPrice: null, error: `Không tìm thấy dữ liệu giá cho ${symbol}.` };
      }
    } catch (apiError) {
      console.error(`Lỗi khi gọi API Finnhub cho mã ${symbol}:`, apiError.message);
      let errorMessage = `Lỗi khi lấy giá cho ${symbol}.`;
      if (apiError.response) {
        if (apiError.response.status === 401 || apiError.response.status === 403) {
             errorMessage = 'Lỗi xác thực với API tài chính.';
        } else if (apiError.response.status === 429) {
             errorMessage = 'Đã vượt quá giới hạn request API tài chính.';
        }
      }
      return { symbol: symbol, currentPrice: null, error: errorMessage };
    }
  });

  return Promise.all(pricePromises);
};

export const getFavoriteStocks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }
    res.json(user.favoriteStocks);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách cổ phiếu yêu thích:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};


export const addFavoriteStock = async (req, res) => {
  const { symbol } = req.body;
  if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
    return res.status(400).json({ message: 'Mã cổ phiếu (symbol) không hợp lệ.' });
  }
  try {
    const stockSymbol = symbol.trim().toUpperCase();
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { favoriteStocks: stockSymbol } },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }
    res.status(200).json(updatedUser.favoriteStocks);
  } catch (error) {
    console.error('Lỗi khi thêm cổ phiếu yêu thích:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};


export const removeFavoriteStock = async (req, res) => {
  const { symbol } = req.params;
  if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
    return res.status(400).json({ message: 'Mã cổ phiếu (symbol) không hợp lệ.' });
  }
  try {
    const stockSymbol = symbol.trim().toUpperCase();
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { favoriteStocks: stockSymbol } },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }
    res.status(200).json(updatedUser.favoriteStocks);
  } catch (error) {
    console.error('Lỗi khi xóa cổ phiếu yêu thích:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};


export const getStockPrices = async (req, res) => {
  const symbolsString = req.query.symbols;
  if (!symbolsString) {
    return res.status(400).json({ message: 'Vui lòng cung cấp danh sách mã cổ phiếu (symbols).' });
  }
  const symbols = symbolsString.split(',').map(s => s.trim().toUpperCase());
  if (symbols.length === 0) {
    return res.status(400).json({ message: 'Danh sách mã cổ phiếu rỗng.' });
  }

  try {
    const results = await fetchStockDataForSymbols(symbols);
    res.json(results);
  } catch (error) {
    console.error('Lỗi trong getStockPrices:', error.message);
    if (error.message.includes('API key cho dịch vụ tài chính bị thiếu')) {
        return res.status(500).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi lấy giá cổ phiếu.' });
  }
};

export const getFavoriteStocksWithDetails = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    const favoriteSymbols = user.favoriteStocks;
    if (!favoriteSymbols || favoriteSymbols.length === 0) {
      return res.json([]); 
    }

    const stockDetails = await fetchStockDataForSymbols(favoriteSymbols);
    res.json(stockDetails);

  } catch (error) {
    console.error('Lỗi khi lấy chi tiết cổ phiếu yêu thích:', error);
    if (error.message && error.message.includes('API key cho dịch vụ tài chính bị thiếu')) {
        return res.status(500).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ.' });
  }
};
