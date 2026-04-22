import { neo4jDriver } from '../db/neo4j.js';

export const graphService = {
  ensureUserNode: async ({ id, fullName, email }) => {
    const session = neo4jDriver.session();
    try {
      await session.run(
        `MERGE (u:User {id: $id})
         SET u.fullName = $fullName, u.email = $email`,
        { id, fullName, email }
      );
    } finally {
      await session.close();
    }
  },

  linkConversationMembers: async (conversationId, memberIds) => {
    const session = neo4jDriver.session();
    try {
      await session.run(
        `UNWIND $memberIds AS userId
         MERGE (u:User {id: userId})
         MERGE (c:Conversation {id: $conversationId})
         MERGE (u)-[:PART_OF]->(c)`,
        { conversationId, memberIds }
      );
    } finally {
      await session.close();
    }
  },

  incrementInteraction: async (fromUserId, toUserIds) => {
    const session = neo4jDriver.session();
    try {
      await session.run(
        `UNWIND $toUserIds AS toUserId
         MATCH (a:User {id: $fromUserId}), (b:User {id: toUserId})
         MERGE (a)-[r:INTERACTS_WITH]->(b)
         ON CREATE SET r.weight = 1, r.lastAt = datetime()
         ON MATCH SET r.weight = r.weight + 1, r.lastAt = datetime()`,
        { fromUserId, toUserIds }
      );
    } finally {
      await session.close();
    }
  }
};