import mongoose from 'mongoose';
import bcrypt from 'bcrypt'; 

const validatePasswordComplexity = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  return regex.test(password);
};

const userSchema = new mongoose.Schema(
  {
    name:{
        type: String,
      required: [true, 'Tên là bắt buộc.'],
      minlength: [3, 'Tên phải có ít nhất 3 ký tự.']
    },
    username: {
      type: String,
      required: [true, 'Tên người dùng là bắt buộc.'], 
      unique: true, 
      trim: true,  
      minlength: [3, 'Tên người dùng phải có ít nhất 3 ký tự.'],
      maxlength: [30, 'Tên người dùng không được vượt quá 30 ký tự.']
    },
    email: {
      type: String,
      required: [true, 'Email là bắt buộc.'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [ 
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Vui lòng cung cấp một địa chỉ email hợp lệ.'
      ]
    },
    password: {
      type: String,
      required: [true, 'Mật khẩu là bắt buộc.'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự.'],
      validate: { 
        validator: validatePasswordComplexity,
        message: 'Mật khẩu phải chứa ít nhất 6 ký tự, bao gồm một chữ hoa, một chữ thường, một số, và một ký tự đặc biệt (@$!%*?&).'
      },
      select: false
    },
    favoriteStocks: {
      type: [String], 
      default: []     
    },
  },
  {
    timestamps: true
  }
);


userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next(); 
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next(); 
  } catch (error) {
    next(error); 
  }
});


userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error; 
  }
};

const User = mongoose.model('User', userSchema);

export default User; 
