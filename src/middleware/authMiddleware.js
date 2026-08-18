import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Seller from '../models/Seller.js';
import Session from '../models/Session.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Local dev bypass for dummy token
      if (token === 'dummy-jwt-access-token') {
        let dummyUser = await User.findOne({ email: 'test@example.com' });
        if (!dummyUser) {
          dummyUser = await User.create({
            name: 'Fahad Mazari',
            email: 'test@example.com',
            password: 'password123',
            role: 'Customer',
            isEmailVerified: true
          });
        }
        req.user = dummyUser;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      const session = await Session.findOne({ tokenHash: token });
      if (!session) {
        res.status(401);
        return next(new Error('Not authorized, session expired or revoked'));
      }

      // Update last active
      session.lastActive = new Date();
      await session.save();

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        res.status(401);
        return next(new Error('Not authorized, user not found'));
      }
      
      // Pass session ID in request so it can be used for "logout" 
      req.sessionId = session._id;

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      next(new Error('Not authorized, token failed'));
    }
  } else {
    res.status(401);
    next(new Error('Not authorized, no token'));
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(
        new Error(`User role ${req.user.role} is not authorized to access this route`)
      );
    }
    next();
  };
};

export const requireActiveSeller = async (req, res, next) => {
  try {
    if (req.user.role !== 'Seller') {
      res.status(403);
      return next(new Error('Only sellers can access this route'));
    }

    const seller = await Seller.findOne({ user: req.user._id });
    
    if (!seller) {
      res.status(404);
      return next(new Error('Seller profile not found'));
    }

    if (seller.status !== 'Approved') {
      res.status(403);
      return next(
        new Error(`Seller account is currently ${seller.status}. Dashboard access is blocked until Super Admin approval.`)
      );
    }

    req.seller = seller;
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (token === 'dummy-jwt-access-token') {
        const dummyUser = await User.findOne({ email: 'test@example.com' });
        if (dummyUser) {
          req.user = dummyUser;
        }
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      const session = await Session.findOne({ tokenHash: token });
      if (session) {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          req.sessionId = session._id;
        }
      }
    } catch (error) {
      // Ignore errors for optional auth
    }
  }
  next();
};
