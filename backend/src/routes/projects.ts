import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';

const router = Router();

// GET /projects
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT p.* FROM projects p
       WHERE p.owner_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user!.user_id, limit, offset]
    );

    res.json({ projects: result.rows });
  } catch (error) {
    next(error);
  }
});

// POST /projects
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'validation failed',
        fields: { name: 'is required' },
      });
    }

    const projectId = uuidv4();
    const now = new Date().toISOString();

    await db.query(
      'INSERT INTO projects (id, name, description, owner_id, created_at) VALUES ($1, $2, $3, $4, $5)',
      [projectId, name, description || null, req.user!.user_id, now]
    );

    res.status(201).json({
      id: projectId,
      name,
      description: description || null,
      owner_id: req.user!.user_id,
      created_at: now,
    });
  } catch (error) {
    next(error);
  }
});

// GET /projects/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const projectResult = await db.query(
      'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
      [id, req.user!.user_id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ error: 'not found' });
    }

    const tasksResult = await db.query(
      'SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      ...projectResult.rows[0],
      tasks: tasksResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /projects/:id
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const projectResult = await db.query(
      'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
      [id, req.user!.user_id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const updates: string[] = [];
    const values: any[] = [id];
    let paramCount = 2;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }

    if (updates.length === 0) {
      return res.json(projectResult.rows[0]);
    }

    const updateResult = await db.query(
      `UPDATE projects SET ${updates.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );

    res.json(updateResult.rows[0]);
  } catch (error) {
    next(error);
  }
});

// DELETE /projects/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const projectResult = await db.query(
      'SELECT * FROM projects WHERE id = $1 AND owner_id = $2',
      [id, req.user!.user_id]
    );

    if (projectResult.rows.length === 0) {
      return res.status(403).json({ error: 'forbidden' });
    }

    await db.query('DELETE FROM tasks WHERE project_id = $1', [id]);
    await db.query('DELETE FROM projects WHERE id = $1', [id]);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// GET /projects/:id/stats (BONUS)
router.get('/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const statusResult = await db.query(
      `SELECT status, COUNT(*) as count FROM tasks WHERE project_id = $1 GROUP BY status`,
      [id]
    );

    const assigneeResult = await db.query(
      `SELECT u.name, COUNT(t.id) as count FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.project_id = $1
       GROUP BY u.id, u.name`,
      [id]
    );

    res.json({
      by_status: statusResult.rows,
      by_assignee: assigneeResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

export { router as projectRoutes };
