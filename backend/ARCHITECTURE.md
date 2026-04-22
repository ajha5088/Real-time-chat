# Chat App Architecture

This backend is now structured for a mid-level real-time chat project with the following flow:

- Frontend (React / Vite)
  - Sends REST requests and initial Socket.IO handshake to the API Gateway
- API Gateway (Node.js / Express)
  - Routes authentication and chat endpoints
  - Validates requests and forwards socket connections
- Authentication Service
  - Issues JWT tokens and validates socket auth
- Chat Service (WebSockets)
  - Handles room joins, message send events, presence updates
  - Writes chat messages to MongoDB and updates user/graph data
- Message Queue (Redis)
  - Enqueues message indexing tasks for asynchronous processing
- Message Processor
  - Consumes queue tasks
  - Generates embeddings and indexes messages in Milvus
- Milvus Vector Search
  - Stores message vectors for semantic chat search
  - Supports search across messages within a conversation
- Data stores
  - MongoDB: messages and attachments
  - PostgreSQL: users and conversation membership
  - Neo4j: user relationships and conversation graph

## New backend flow

1. User sends a message over Socket.IO.
2. `chatService.createMessage` saves the message immediately into MongoDB.
3. The backend publishes an indexing task into Redis.
4. A separate worker consumes Redis tasks and indexes the message into Milvus.
5. The frontend can query `/api/chat/conversations/:conversationId/search?q=...` for semantic search.

## Why this is mid-level

- Introduces asynchronous queue processing
- Separates chat writing from vector indexing
- Adds a dedicated vector search store with Milvus
- Keeps the gateway, auth, and chat layers clearly separated
- Supports a real-world architecture while staying manageable in one repository
