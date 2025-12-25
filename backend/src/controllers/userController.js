import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const login = async (req, res) => {
  try {
    const {email, password} = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Credentials are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        currentStep: user.currentStep
      }
    });

  } catch (error) {
    console.error('Error: ', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// export const saveBasicInfo = async (req, res) => {
//   try {
//     const userId = req.user.id;  
//     const { name, phone } = req.body;  

//     if (!name) {
//       return res.status(400).json({ success: false, message: 'Name is required' });
//     }

//     const user = await User.findById(userId);
//     if (!user) {
//       return res.status(404).json({ success: false, message: 'User not found' });
//     }

//     user.name = name.trim();
//     user.phone = phone?.trim() || '';
//     user.currentStep = 'mcq'; 

//     await user.save();

//     res.status(200).json({
//       success: true,
//       message: 'Basic info updated successfully',
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         currentStep: user.currentStep
//       }
//     });

//   } catch (error) {
//     console.error('Error saving basic info:', error);
//     res.status(500).json({ success: false, message: 'Server error', error: error.message });
//   }
// };

export const saveProfile = async (req, res) => {
  try {
    const updates = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...updates,
        currentStep: 'mcq'  // Advance after saving
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Profile saved successfully!",
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
