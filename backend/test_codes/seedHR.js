import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    const hrAccounts = [
      { email: 'hr1@gmail.com', password: 'hrpass123', name: 'HR One', role: 'hr' },
      { email: 'hr2@gmail.com', password: 'hrpass456', name: 'HR Two', role: 'hr' }
    ];

    for (const acc of hrAccounts) {
      const existing = await User.findOne({ email: acc.email });
      if (!existing) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(acc.password, salt);
        await User.create({
          email: acc.email,
          password: hashed,
          name: acc.name,
          role: acc.role,
          currentStep: 'completed'  
        });
        console.log(`Added HR: ${acc.email}`);
      } else {
        console.log(`HR exists: ${acc.email}`);
      }
    }

    mongoose.disconnect();
  })
  .catch(err => console.error(err));