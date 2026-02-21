import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.split(' ')[1] 
      : authHeader;

    if (!token) {
      return res.status(401).json({ message: 'Token is required' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      req.userId = decoded.userId;
      next();
    } catch (jwtError: any) {
      console.error('JWT verification error:', {
        name: jwtError?.name,
        message: jwtError?.message,
        expiredAt: jwtError?.expiredAt,
      });

      if (jwtError?.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token has expired. Please login again.',
          code: 'TOKEN_EXPIRED'
        });
      } else if (jwtError?.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          message: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN'
        });
      } else {
        return res.status(401).json({ 
          message: 'Invalid or expired token',
          code: 'AUTH_ERROR'
        });
      }
    }
  } catch (error: any) {
    console.error('Authentication middleware error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};
