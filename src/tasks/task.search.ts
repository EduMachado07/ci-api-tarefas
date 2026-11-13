import { Router } from 'express';
import type pg from 'pg';

export function searchRouter(pool: pg.Pool): Router {
  const router = Router();

  router.get('/search', async (req, res) => {
    const title = typeof req.query.title === 'string' ? req.query.title : '';
    const { rows } = await pool.query(`SELECT * FROM tasks WHERE title = '${title}'`);
    res.json(rows);
  });

  return router;
}
