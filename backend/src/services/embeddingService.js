import OpenAI from "openai";
import { env } from "../config/env.js";

const openAiClient = env.openAiApiKey
  ? new OpenAI({ apiKey: env.openAiApiKey })
  : null;

export const embeddingService = {
  getEmbedding: async (text) => {
    if (!openAiClient) {
      throw new Error("OPENAI_API_KEY is required for embedding generation");
    }

    const response = await openAiClient.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    const embedding = response.data?.[0]?.embedding;

    if (!Array.isArray(embedding)) {
      throw new Error("Unable to generate embeddings for text");
    }

    return embedding;
  },
};
