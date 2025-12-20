// middleware/auth.js
import jwt from 'jsonwebtoken';

// 1. Main Auth Middleware (Protect Routes)
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token verification failed.'
    });
  }
};

// 2. Role-Based Middleware
export const isHR = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (req.user.role !== 'hr') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: HR access only'
    });
  }
  next();
};

export const isCandidate = (req, res, next) => {
  if (req.user.role !== 'candidate') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Candidate access only'
    });
  }
  next();
};