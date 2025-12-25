import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import mcqRoutes from './routes/mcqRoutes.js';
import videoRoutes from './routes/videoRoutes.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import codingRoutes from './routes/codingRoutes.js'
dotenv.config();

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://your-frontend.onrender.com', // Add when you deploy frontend
  'https://your-frontend.vercel.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(helmet());
app.use(express.json({ limit: '10mb' })); 

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP"
});

app.use('/api/user', userRoutes, limiter);
app.use('/api/mcq', mcqRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/coding', codingRoutes);



app.get('/', (req, res) => {
  res.json({ message: 'AI Interview Platform Backend - Running!' });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
