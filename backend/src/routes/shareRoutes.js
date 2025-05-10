import express from 'express';
import {
  shareMyFavorites,
  getListsSharedWithMe,
  getMySharedInstances,
  unshareList,
} from '../controllers/shareController.js';
import { protect } from '../middleware/authMiddleware.js'; 

const router = express.Router();



router.post('/', protect, shareMyFavorites);

router.get('/with-me', protect, getListsSharedWithMe);

router.get('/my-shares', protect, getMySharedInstances);

router.delete('/:shareId', protect, unshareList);

export default router;
