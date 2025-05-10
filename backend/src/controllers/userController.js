import 'dotenv/config';
import User from '../models/User.js'; 
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; 

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d', 
  });
};

export const registerUser = async (req, res) => {
  const { name, username, email, password } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({ message: 'Người dùng đã tồn tại (email hoặc username đã được sử dụng).' });
    }

    const user = await User.create({
      name,
      username,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        favoriteStocks: user.favoriteStocks,
        token: generateToken(user._id), 
      });
    } else {
      res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ.' });
    }
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.code === 11000) { 
        const field = Object.keys(error.keyValue)[0];
        return res.status(400).json({ message: `Giá trị '${error.keyValue[field]}' cho trường '${field}' đã tồn tại.` });
    }
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi đăng ký người dùng.' });
  }
};

export const loginUser = async (req, res) => {
  const { emailOrUsername, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    }).select('+password'); 

    if (user && (await user.comparePassword(password))) { 
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        favoriteStocks: user.favoriteStocks,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Email/Username hoặc mật khẩu không chính xác.' }); 
    }
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ khi đăng nhập.' });
  }
};

export const getCurrentUser = async (req, res) => {
  if (req.user) {
    const user = await User.findById(req.user.id).select('-password');
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        favoriteStocks: user.favoriteStocks,
      });
    } else {
      res.status(404).json({ message: 'Người dùng không tồn tại.' });
    }
  } else {
    res.status(401).json({ message: 'Chưa xác thực, không có token.' });
  }
};
