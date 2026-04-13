import db from '../src/db.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const seed = async () => {
  console.log('Seeding database...');

  try {
    const now = new Date().toISOString();

    // Upsert test user and always return its id
    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash('password123', 12);

    const userResult = await db.query(
      `INSERT INTO users (id, name, email, password, created_at)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE
       SET name = EXCLUDED.name,
           password = EXCLUDED.password
       RETURNING id`,
      [userId, 'Test User', 'test@example.com', hashedPassword, now]
    );
    const stableUserId = userResult.rows[0].id as string;

    // Reuse project if it exists, otherwise create it
    let projectId: string;
    const projectLookup = await db.query(
      'SELECT id FROM projects WHERE owner_id = $1 AND name = $2 LIMIT 1',
      [stableUserId, 'Website Redesign']
    );

    if (projectLookup.rows.length > 0) {
      projectId = projectLookup.rows[0].id as string;
      await db.query(
        'UPDATE projects SET description = $1 WHERE id = $2',
        ['Q2 project', projectId]
      );
    } else {
      projectId = uuidv4();
      await db.query(
        'INSERT INTO projects (id, name, description, owner_id, created_at) VALUES ($1, $2, $3, $4, $5)',
        [projectId, 'Website Redesign', 'Q2 project', stableUserId, now]
      );
    }

    // Create missing tasks only (idempotent)
    const tasks = [
      { title: 'Design homepage', status: 'in_progress', priority: 'high' },
      { title: 'Create API endpoints', status: 'todo', priority: 'high' },
      { title: 'Setup database', status: 'done', priority: 'medium' },
    ];

    for (const task of tasks) {
      const existingTask = await db.query(
        'SELECT id FROM tasks WHERE project_id = $1 AND title = $2 LIMIT 1',
        [projectId, task.title]
      );

      if (existingTask.rows.length === 0) {
        const taskId = uuidv4();
        await db.query(
          `INSERT INTO tasks (id, title, description, status, priority, project_id, created_by, assignee_id, due_date, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [taskId, task.title, null, task.status, task.priority, projectId, stableUserId, stableUserId, '2026-04-15', now, now]
        );
      }
    }

    console.log('✓ Database seeded');
    console.log('\nTest credentials:');
    console.log('  Email: test@example.com');
    console.log('  Password: password123');
  } catch (error: any) {
    console.error('✗ Seed error:', error);
    throw error;
  }
};

seed().then(() => process.exit(0)).catch(() => process.exit(1));
