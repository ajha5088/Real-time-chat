import { pgPool } from '../db/postgres.js';

export const userRepository = {
  create: async (user) => {
    const { rows } = await pgPool.query(
      `INSERT INTO users (id, email, password_hash, full_name, avatar_url, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, avatar_url, status, created_at`,
      [user.id, user.email, user.passwordHash, user.fullName, user.avatarUrl || null, 'offline']
    );
    return rows[0];
  },

  findByEmail: async (email) => {
    const { rows } = await pgPool.query(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return rows[0] || null;
  },

  findById: async (id) => {
    const { rows } = await pgPool.query(
      'SELECT id, email, full_name, avatar_url, status, created_at FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  updateStatus: async (id, status) => {
    await pgPool.query(
      'UPDATE users SET status = $2, updated_at = NOW() WHERE id = $1',
      [id, status]
    );
  },

  searchByNameOrEmail: async (query, currentUserId) => {
    const like = `%${query}%`;
    const { rows } = await pgPool.query(
      `SELECT id, email, full_name, avatar_url, status
       FROM users
       WHERE id <> $1 AND (full_name ILIKE $2 OR email ILIKE $2)
       ORDER BY full_name ASC
       LIMIT 20`,
      [currentUserId, like]
    );
    return rows;
  }
};