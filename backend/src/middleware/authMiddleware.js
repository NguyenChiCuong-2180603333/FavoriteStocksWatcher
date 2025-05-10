import passport from 'passport';

export const protect = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Lỗi xác thực JWT:', err);
      return res.status(500).json({ message: 'Lỗi máy chủ khi xác thực token.' });
    }
    if (!user) {
      let message = 'Xác thực thất bại: Token không hợp lệ hoặc đã hết hạn.';
      if (info && info.message) {
        if (info.message === 'No auth token') {
            message = 'Xác thực thất bại: Không tìm thấy token xác thực.';
        } else if (info.message === 'jwt expired') {
            message = 'Xác thực thất bại: Token đã hết hạn.';
        } else if (info.message === 'jwt malformed' || info.message.includes('Unexpected token') || info.message.includes('invalid signature')) {
            message = 'Xác thực thất bại: Token không đúng định dạng.';
        }
      }
      return res.status(401).json({ message: message }); // 401 Unauthorized
    }
    req.user = user;
    next(); 
  })(req, res, next); 
};


