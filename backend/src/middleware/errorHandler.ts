import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }

  if (err.code === 'ER_DUP_ENTRY' || err.constraint === 'users_email_key') {
    return res.status(400).json({ error: 'Email already exists' });
  }

  res.status(500).json({ error: 'Internal server error' });
};

export class AppError extends Error {
  constructor(
    public message: string,
    public status: number = 500
  ) {
    super(message);
  }
}
