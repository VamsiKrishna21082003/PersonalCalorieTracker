import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Check if user already exists
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email },
      });
    } catch (dbError: any) {
      console.error('Database query error:', dbError);
      // If it's a table doesn't exist error, provide helpful message
      if (dbError.message?.includes('does not exist') || dbError.code === '42P01') {
        return res.status(500).json({ 
          message: 'Database tables not found. Please run: npx prisma migrate dev',
          error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
      }
      throw dbError; // Re-throw if it's a different error
    }

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } catch (dbError: any) {
      console.error('Database query error during login:', dbError);
      // If it's a table doesn't exist error, provide helpful message
      if (dbError.message?.includes('does not exist') || dbError.code === '42P01') {
        return res.status(500).json({ 
          message: 'Database tables not found. Please run: npx prisma migrate dev',
          error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
      }
      // If it's a connection error
      if (dbError.code === 'ECONNREFUSED' || dbError.message?.includes('connect')) {
        return res.status(500).json({ 
          message: 'Database connection failed. Please check your DATABASE_URL.',
          error: process.env.NODE_ENV === 'development' ? dbError.message : undefined
        });
      }
      throw dbError; // Re-throw if it's a different error
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    let isValidPassword;
    try {
      isValidPassword = await bcrypt.compare(password, user.password);
    } catch (bcryptError: any) {
      console.error('Password comparison error:', bcryptError);
      return res.status(500).json({ 
        message: 'Error verifying password',
        error: process.env.NODE_ENV === 'development' ? bcryptError.message : undefined
      });
    }

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check JWT_SECRET
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.warn('JWT_SECRET is not set, using default secret (not recommended)');
    }

    // Generate token
    let token;
    try {
      token = jwt.sign(
        { userId: user.id },
        jwtSecret || 'secret',
        { expiresIn: '7d' }
      );
    } catch (jwtError: any) {
      console.error('JWT signing error:', jwtError);
      return res.status(500).json({ 
        message: 'Error generating authentication token',
        error: process.env.NODE_ENV === 'development' ? jwtError.message : undefined
      });
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      name: error?.name,
      stack: error?.stack,
    });
    res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
