import { Router, Request, Response, NextFunction } from 'express';
import db from '../db.js';

const router = Router();
router.get('/search', async (req: Request, res: Response) => {
  const rawQuery = String(req.query.q ?? '').trim();
  const rawLimit = Number(req.query.limit ?? 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 10;

  if (!rawQuery) {
    return res.json({ users: [] });
  }

  const likeQuery = `%${rawQuery}%`;
  const prefixQuery = `${rawQuery}%`;

  const result = await db.query(
    `SELECT id, name, email, created_at
     FROM users
     WHERE name ILIKE $1 OR email ILIKE $1
     ORDER BY
       CASE WHEN name ILIKE $2 THEN 0 ELSE 1 END,
       name ASC
     LIMIT $3`,
    [likeQuery, prefixQuery, limit]
  );

  return res.json({ users: result.rows });
});

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, created_at FROM users ORDER BY created_at ASC'
    );

    res.json({ users: result.rows });
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };
