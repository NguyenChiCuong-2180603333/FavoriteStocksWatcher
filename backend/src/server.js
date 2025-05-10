import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import stockRoutes from './routes/stockRoutes.js';
import userRoutes from './routes/userRoutes.js'; 
import configurePassport from './config/passportConfig.js';
import shareRoutes from './routes/shareRoutes.js';
import cors from 'cors';


const app = express();        
const port = process.env.PORT || 3000; 
const dbURI = process.env.MONGODB_URI;

mongoose.connect(dbURI)
  .then(() => {
    console.log('Đã kết nối thành công tới MongoDB!');
    // Chỉ khởi động server sau khi kết nối DB thành công
    app.listen(port, () => {
      console.log(`Express server đang lắng nghe tại http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Lỗi kết nối MongoDB:', err);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
configurePassport(passport);
app.use(cors());
app.use('/api/users', userRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/shares', shareRoutes);

app.get('/', (req, res) => {
  res.send('Hello World from Express.js!');
});

mongoose.connection.on('error', err => {
  console.error('Lỗi kết nối MongoDB trong quá trình hoạt động:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Đã ngắt kết nối MongoDB.');
});