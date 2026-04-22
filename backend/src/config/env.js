import dotenv from "dotenv";
dotenv.config();

const required = [
  "PORT",
  "CLIENT_URL",
  "JWT_ACCESS_SECRET",
  "POSTGRES_URL",
  "MONGODB_URI",
  "NEO4J_URI",
  "NEO4J_USERNAME",
  "NEO4J_PASSWORD",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL,
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  postgres: {
    url: process.env.POSTGRES_URL,
  },
  mongoUri: process.env.MONGODB_URI,
  neo4j: {
    uri: process.env.NEO4J_URI,
    username: process.env.NEO4J_USERNAME,
    password: process.env.NEO4J_PASSWORD,
  },
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  messageQueueName:
    process.env.MESSAGE_QUEUE_NAME || "chat_message_index_queue",
  messageQueueTimeout: Number(process.env.MESSAGE_QUEUE_TIMEOUT || 0),
  milvusAddress: process.env.MILVUS_ADDRESS?.trim() || "",
  openAiApiKey: process.env.OPENAI_API_KEY || "",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 900000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 300),
};
