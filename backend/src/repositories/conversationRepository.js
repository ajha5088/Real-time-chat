import { pgPool } from "../db/postgres.js";

export const conversationRepository = {
  createConversation: async ({ id, name, type, createdBy }) => {
    const { rows } = await pgPool.query(
      `INSERT INTO conversations (id, name, type, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, name || null, type, createdBy],
    );
    return rows[0];
  },

  addParticipant: async ({ conversationId, userId, role = "member" }) => {
    await pgPool.query(
      `INSERT INTO conversation_participants (conversation_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (conversation_id, user_id) DO NOTHING`,
      [conversationId, userId, role],
    );
  },

  listForUser: async (userId) => {
    const { rows } = await pgPool.query(
      `SELECT c.id, c.name, c.type, c.created_by, c.last_message_at, c.created_at,
              json_agg(
                json_build_object(
                  'id', u.id,
                  'fullName', u.full_name,
                  'email', u.email,
                  'avatarUrl', u.avatar_url,
                  'status', u.status
                )
              ) AS participants
       FROM conversations c
       JOIN conversation_participants cp ON cp.conversation_id = c.id
       JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
       JOIN users u ON u.id = cp2.user_id
       WHERE cp.user_id = $1
       GROUP BY c.id
       ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC`,
      [userId],
    );
    return rows;
  },

  isParticipant: async (conversationId, userId) => {
    const { rows } = await pgPool.query(
      `SELECT 1
       FROM conversation_participants
       WHERE conversation_id = $1 AND user_id = $2
       LIMIT 1`,
      [conversationId, userId],
    );
    return Boolean(rows[0]);
  },

  touchConversation: async (conversationId) => {
    await pgPool.query(
      `UPDATE conversations
       SET last_message_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [conversationId],
    );
  },

  findDirectConversation: async (userId1, userId2) => {
    const { rows } = await pgPool.query(
      `SELECT c.id, c.name, c.type, c.created_by, c.last_message_at, c.created_at,
              json_agg(
                json_build_object(
                  'id', u.id,
                  'fullName', u.full_name,
                  'email', u.email,
                  'avatarUrl', u.avatar_url,
                  'status', u.status
                )
              ) AS participants
       FROM conversations c
       JOIN conversation_participants cp ON cp.conversation_id = c.id
       JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
       JOIN users u ON u.id = cp2.user_id
       WHERE c.type = 'direct'
       AND c.id IN (
         SELECT conversation_id FROM conversation_participants WHERE user_id = $1
       )
       AND c.id IN (
         SELECT conversation_id FROM conversation_participants WHERE user_id = $2
       )
       GROUP BY c.id
       LIMIT 1`,
      [userId1, userId2],
    );
    return rows[0] || null;
  },
};
