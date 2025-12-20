import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    const candidateAccounts = [
      { email: 'gureee1@gmail.com', password: 'gureee123', name: 'Candidate One', role: 'candidate' },
      { email: 'gureee2@gmail.com', password: 'gureee456', name: 'Candidate Two', role: 'candidate' }
    ];

    for (const acc of candidateAccounts) {
      const existing = await User.findOne({ email: acc.email });
      if (!existing) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(acc.password, salt);
        await User.create({
          email: acc.email,
          password: hashed,
          name: acc.name,
          role: acc.role,
          currentStep: 'mcq'  
        });
        console.log(`Added Candidate: ${acc.email}`);
      } else {
        console.log(`Candidate exists: ${acc.email}`);
      }
    }

    mongoose.disconnect();
  })
  .catch(err => console.error(err));