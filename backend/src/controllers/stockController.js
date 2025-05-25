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
        },
        timeout: 5000
      });

      if (response.data && typeof response.data.c !== 'undefined') {

        if (response.data.pc === 0 && response.data.c === 0 && response.data.h === 0 && response.data.l === 0 && response.data.o === 0) {
            console.warn(`Dữ liệu trả về cho mã ${symbol} có vẻ không hợp lệ (toàn số 0). Xem xét là không có dữ liệu.`);
            return { symbol: symbol, currentPrice: null, openPrice: null, previousClosePrice: null, error: `Không có dữ liệu giá cho ${symbol} hoặc mã không hợp lệ.` };
        }
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
      if (apiError.code === 'ECONNABORTED' || apiError.message.includes('timeout')) {
             console.error(`Timeout khi lấy dữ liệu cho mã ${symbol} từ Finnhub:`, apiError.message);
             return { symbol: symbol, currentPrice: null, error: `Timeout khi lấy dữ liệu cho ${symbol}.` };
        }
      console.error(`Lỗi API khi lấy dữ liệu cho mã ${symbol} từ Finnhub:`, apiError.message);
      return { symbol: symbol, currentPrice: null, error: `Lỗi API khi lấy dữ liệu cho ${symbol}.` };
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
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }

    const { symbol } = req.body;
    if (!symbol || typeof symbol !== 'string' || symbol.trim() === '') {
      return res.status(400).json({ message: 'Vui lòng cung cấp mã cổ phiếu hợp lệ.' });
    }

    const normalizedSymbol = symbol.trim().toUpperCase();
    const validationResult = await validateStockSymbol(normalizedSymbol);
    if (!validationResult.isValid) {
      return res.status(400).json({ message: validationResult.message });
    }

    if (user.favoriteStocks.includes(normalizedSymbol)) {
      return res.status(409).json({ message: `Mã cổ phiếu '${normalizedSymbol}' đã có trong danh sách yêu thích.` });
    }

    user.favoriteStocks.push(normalizedSymbol);
    await user.save();

    res.status(201).json({ 
      message: `Đã thêm mã '${normalizedSymbol}' vào danh sách yêu thích!`,
      favoriteStocks: user.favoriteStocks,
    });

  } catch (error) {
    console.error('Lỗi khi thêm cổ phiếu yêu thích:', error.message); // Log error message
    if (error.message.includes('Lỗi cấu hình máy chủ')) {
        return res.status(500).json({ message: error.message });
    }
    if (error.name === 'ValidationError') { 
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi thêm cổ phiếu yêu thích.' });
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

const validateStockSymbol = async (symbol) => {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    console.error('FINNHUB_API_KEY chưa được thiết lập trong file .env');
    throw new Error('Lỗi cấu hình máy chủ: API key cho dịch vụ tài chính bị thiếu.');
  }

  try {
    const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
      params: { symbol, token: apiKey },
      timeout: 5000, // Thêm timeout 5 giây
    });

    const data = response.data;
    if (data && (data.pc !== 0 || data.c !== 0)) {
      return { isValid: true };
    } else if (data && data.pc === 0 && data.c === 0 && data.h === 0 && data.l === 0 && data.o === 0) {
      return { isValid: false, message: `Mã cổ phiếu '${symbol}' không tìm thấy hoặc không phải là mã hợp lệ.` };
    }
    console.warn(`Dữ liệu không chắc chắn cho mã ${symbol} từ Finnhub:`, data);
    return { isValid: false, message: `Không thể xác nhận tính hợp lệ của mã cổ phiếu '${symbol}'.` };

  } catch (apiError) {
    if (apiError.code === 'ECONNABORTED' || apiError.message.includes('timeout')) {
        console.error(`Timeout khi xác thực mã ${symbol} với Finnhub:`, apiError.message);
        return { isValid: false, message: 'Dịch vụ xác thực mã cổ phiếu bị quá tải hoặc không phản hồi. Vui lòng thử lại sau.' };
    }
    if (apiError.response) {
      console.error(`Lỗi API (${apiError.response.status}) khi xác thực mã ${symbol} với Finnhub:`, apiError.response.data);
      if (apiError.response.status === 401 || apiError.response.status === 403) {
        return { isValid: false, message: 'Lỗi xác thực với dịch vụ tài chính. Vui lòng kiểm tra API key phía máy chủ.' };
      } else if (apiError.response.status === 429) {
        return { isValid: false, message: 'Vượt quá giới hạn yêu cầu đến dịch vụ tài chính. Vui lòng thử lại sau.' };
      }
    } else if (apiError.request) {
      console.error(`Không nhận được phản hồi từ Finnhub khi xác thực mã ${symbol}:`, apiError.message);
    } else {
      console.error(`Lỗi không xác định khi xác thực mã ${symbol} với Finnhub:`, apiError.message);
    }
    return { isValid: false, message: 'Không thể xác thực mã cổ phiếu do sự cố dịch vụ bên ngoài.' };
  }
};
