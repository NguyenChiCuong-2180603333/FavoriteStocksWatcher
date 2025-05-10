import express from 'express';
import {
  getFavoriteStocks,
  addFavoriteStock,
  removeFavoriteStock,
  getStockPrices,
  getFavoriteStocksWithDetails, 
} from '../controllers/stockController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/prices', getStockPrices);


// Lấy danh sách mã cổ phiếu yêu thích 
router.get('/favorites', protect, getFavoriteStocks);

// Lấy chi tiết danh sách cổ phiếu yêu thích
router.get('/favorites/details', protect, getFavoriteStocksWithDetails); // <-- ROUTE MỚI

// Thêm một mã cổ phiếu vào danh sách yêu thích
router.post('/favorites', protect, addFavoriteStock);

// Xóa một mã cổ phiếu khỏi danh sách yêu thích
router.delete('/favorites/:symbol', protect, removeFavoriteStock);

export default router;
