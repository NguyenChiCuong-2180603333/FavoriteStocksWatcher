import 'dotenv/config';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import mongoose from 'mongoose';
import User from '../models/User.js'; 

export default function(passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: 'emailOrUsername' }, 
      async (emailOrUsername, password, done) => {
        try {
          const user = await User.findOne({
            $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
          }).select('+password'); 

          if (!user) {
            return done(null, false, { message: 'Email/Username không tồn tại.' });
          }

          const isMatch = await user.comparePassword(password);
          if (isMatch) {
            return done(null, user);
          } else {
            return done(null, false, { message: 'Mật khẩu không chính xác.' });
          }
        } catch (error) {
          console.error('Lỗi trong LocalStrategy:', error);
          return done(error);
        }
      }
    )
  );

  
  const opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); 
  opts.secretOrKey = process.env.JWT_SECRET; 

  passport.use(
    new JwtStrategy(opts, async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.id).select('-password'); 

        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (error) {
        console.error('Lỗi trong JwtStrategy:', error);
        return done(error, false);
      }
    })
  );

  
}
