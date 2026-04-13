import { Router, Request, Response } from 'express';
import { NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { User } from '../types.js';

const router = Router();

// POST /auth/register
router.post('/register', async (req: Request, res: Response, next: any) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'validation failed',
        fields: {
          ...(!name && { name: 'is required' }),
          ...(!email && { email: 'is required' }),
          ...(!password && { password: 'is required' }),
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const now = new Date().toISOString();

    await db.query(
      'INSERT INTO users (id, name, email, password, created_at) VALUES ($1, $2, $3, $4, $5)',
      [userId, name, email, hashedPassword, now]
    );

    const expiresIn = (process.env.JWT_EXPIRY || '24h') as jwt.SignOptions['expiresIn'];
    const token = jwt.sign(
      { user_id: userId, email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn }
    );

    res.status(201).json({
      token,
      user: { id: userId, name, email },
    });
  } catch (error: any) {
    if (error.constraint === 'users_email_key') {
      return res.status(400).json({
        error: 'validation failed',
        fields: { email: 'already in use' },
      });
    }
    next(error);
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response, next: any) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'validation failed',
        fields: {
          ...(!email && { email: 'is required' }),
          ...(!password && { password: 'is required' }),
        },
      });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0] as User | undefined;

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const expiresIn = (process.env.JWT_EXPIRY || '24h') as jwt.SignOptions['expiresIn'];
    const token = jwt.sign(
      { user_id: user.id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };
