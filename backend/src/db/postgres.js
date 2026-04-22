import pkg from "pg";
import { env } from "../config/env.js";

const { Pool } = pkg;

export const pgPool = new Pool({
  connectionString: env.postgres.url,
});

export const initPostgres = async () => {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");

    if (env.nodeEnv !== "production") {
      // Drop existing tables in development to reset schema cleanly.
      await client.query(`
        DROP TABLE IF EXISTS message_reads CASCADE;
        DROP TABLE IF EXISTS messages CASCADE;
        DROP TABLE IF EXISTS conversation_participants CASCADE;
        DROP TABLE IF EXISTS conversations CASCADE;
        DROP TABLE IF EXISTS users CASCADE;
      `);
    }

    // 1. Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(120) NOT NULL,
        avatar_url TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'offline',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Conversations Table
    await client.query(`
      CREATE TABLE conversations (
        id UUID PRIMARY KEY,
        name VARCHAR(120),
        type VARCHAR(20) NOT NULL CHECK (type IN ('direct','group')),
        created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_message_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 3. Participants Table
    await client.query(`
      CREATE TABLE conversation_participants (
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL DEFAULT 'member',
        joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (conversation_id, user_id)
      );
    `);

    // 4. Messages Table
    await client.query(`
      CREATE TABLE messages (
        id UUID PRIMARY KEY,
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        attachments JSONB DEFAULT '[]'::jsonb,
        deleted_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 5. Message Reads Table
    await client.query(`
      CREATE TABLE message_reads (
        message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        read_at TIMESTAMP NOT NULL DEFAULT NOW(),
        PRIMARY KEY (message_id, user_id)
      );
    `);

    // 6. Indexes
    await client.query(`
      CREATE INDEX idx_users_email ON users(email);
      CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
      CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);
      CREATE INDEX idx_messages_conversation ON messages(conversation_id);
      CREATE INDEX idx_messages_sender ON messages(sender_id);
      CREATE INDEX idx_message_reads_user ON message_reads(user_id);
    `);

    await client.query("COMMIT");
    console.log("Postgres tables initialized successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Postgres init error:", err);
    throw err;
  } finally {
    client.release();
  }
};
