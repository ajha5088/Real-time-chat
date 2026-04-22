import { createClient } from "redis";
import { env } from "../config/env.js";

const redisClient = createClient({ url: env.redisUrl });
let redisConnected = false;

redisClient.on("error", (error) => {
  console.error("Redis error:", error);
});

const connectRedis = async () => {
  if (!redisConnected) {
    await redisClient.connect();
    redisConnected = true;
  }
};

export const enqueueMessageIndexTask = async (task) => {
  await connectRedis();
  await redisClient.rPush(env.messageQueueName, JSON.stringify(task));
};

export const consumeMessageIndexTask = async () => {
  await connectRedis();
  const result = await redisClient.blPop(
    env.messageQueueName,
    env.messageQueueTimeout,
  );

  if (!result) {
    return null;
  }

  const [, payload] = result;
  return JSON.parse(payload);
};

export const redisClientInstance = redisClient;
