import 'dotenv/config'; 
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables.');
    return null;
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '30d', 
  });
};

export const registerUser = async (req, res) => {
  const { name, username, email, password, confirmPassword, agreedToTerms } = req.body;

  try {
    // --- VALIDATION START ---
    if (!name || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ các trường: tên, tên người dùng, email, mật khẩu, xác nhận mật khẩu.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu và mật khẩu xác nhận không khớp.' });
    }

    if (agreedToTerms !== true) {
      return res.status(400).json({ message: 'Bạn phải đồng ý với các điều khoản dịch vụ để đăng ký.' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      return res.status(400).json({ message: 'Người dùng đã tồn tại (email hoặc username đã được sử dụng).' });
    }

    const user = await User.create({
      name,
      username,
      email,
      password,
      agreedToTerms,
    });

    if (user) {
      res.status(201).json({
        message: 'Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.',
        userId: user._id, 
      });
    } else {
      res.status(400).json({ message: 'Dữ liệu người dùng không hợp lệ, không thể tạo tài khoản.' });
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
  const { emailOrUsername, password, rememberMe } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ message: 'Vui lòng cung cấp email/username và mật khẩu.' });
  }

  try {
    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
    }).select('+password'); 

    if (user && (await user.matchPassword(password))) { 
      const token = generateToken(user._id);
      if (!token) {
        return res.status(500).json({ message: 'Lỗi tạo token xác thực. Vui lòng thử lại.' });
      }
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        favoriteStocks: user.favoriteStocks || [], // Đảm bảo trả về mảng
        token: token,
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
  if (req.user && req.user.id) { 
    try {
      const user = await User.findById(req.user.id).select('-password'); 
      if (user) {
        res.json({
          _id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          favoriteStocks: user.favoriteStocks || [],
          agreedToTerms: user.agreedToTerms,
        });
      } else {
        res.status(404).json({ message: 'Người dùng không tồn tại.' });
      }
    } catch (error) {
        console.error('Lỗi lấy thông tin người dùng hiện tại:', error);
        res.status(500).json({ message: 'Lỗi máy chủ khi lấy thông tin người dùng.' });
    }
  } else {
    res.status(401).json({ message: 'Chưa xác thực, không có thông tin người dùng hợp lệ trong token.' });
  }
};

