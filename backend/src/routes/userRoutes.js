import 'dotenv/config';
import express from 'express';
import { registerUser, loginUser, getCurrentUser } from '../controllers/userController.js';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

router.post('/register', registerUser);

router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) {
      return next(err); 
    }
    if (!user) {
      return res.status(401).json({ message: info ? info.message : 'Đăng nhập thất bại.' });
    }
    const token = generateToken(user._id);
    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      favoriteStocks: user.favoriteStocks,
      token: token,
    });
  })(req, res, next); 
});


router.get('/profile',protect, getCurrentUser); 

export default router;
