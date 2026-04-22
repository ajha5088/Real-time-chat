import {
  MilvusClient,
  DataType,
  MetricType,
  IndexType,
} from "@zilliz/milvus2-sdk-node";
import { env } from "../config/env.js";
import { embeddingService } from "./embeddingService.js";

const COLLECTION_NAME = "chat_messages";
const VECTOR_DIM = 1536;
let initialized = false;
let milvusClient = null;

const getMilvusClient = () => {
  if (!env.milvusAddress) {
    throw new Error('Milvus is not configured. Set MILVUS_ADDRESS to enable vector search.');
  }

  if (!milvusClient) {
    milvusClient = new MilvusClient({
      address: env.milvusAddress,
      maxRetries: 3,
      retryDelay: 1000,
    });
  }

  return milvusClient;
};

const ensureCollection = async () => {
  if (initialized) {
    return;
  }

  const milvus = getMilvusClient();

  try {
    await milvus.connectPromise;
  } catch (error) {
    throw new Error(`Milvus connection failed: ${error.message}`);
  }

  const hasCollection = await milvus.hasCollection({
    collection_name: COLLECTION_NAME,
  });

  if (!hasCollection?.value) {
    await milvus.createCollection({
      collection_name: COLLECTION_NAME,
      fields: [
        {
          name: "message_id",
          data_type: DataType.VarChar,
          is_primary_key: true,
          max_length: 128,
        },
        {
          name: "conversation_id",
          data_type: DataType.VarChar,
          max_length: 128,
        },
        {
          name: "sender_id",
          data_type: DataType.VarChar,
          max_length: 128,
        },
        {
          name: "created_at",
          data_type: DataType.Float,
        },
        {
          name: "body",
          data_type: DataType.VarChar,
          max_length: 2048,
        },
        {
          name: "vector",
          data_type: DataType.FloatVector,
          dim: VECTOR_DIM,
        },
      ],
      index_params: [
        {
          field_name: "vector",
          index_type: IndexType.HNSW,
          metric_type: MetricType.COSINE,
          params: {
            M: 16,
            efConstruction: 128,
          },
        },
      ],
    });
  }

  await milvus.loadCollection({ collection_name: COLLECTION_NAME });
  initialized = true;
};

const normalizeResult = (result) => {
  const hits = Array.isArray(result?.results) ? result.results[0] || [] : [];

  return hits.map((hit) => ({
    messageId: hit.id ?? hit.message_id,
    conversationId: hit.conversation_id,
    senderId: hit.sender_id,
    body: hit.body,
    createdAt: hit.created_at,
    score: hit.score,
  }));
};

export const vectorSearchService = {
  indexMessage: async (message) => {
    await ensureCollection();

    const embedding = await embeddingService.getEmbedding(message.body);

    await milvus.insert({
      collection_name: COLLECTION_NAME,
      data: [
        {
          message_id: message._id,
          conversation_id: message.conversationId,
          sender_id: message.senderId,
          created_at: message.createdAt
            ? new Date(message.createdAt).getTime()
            : Date.now(),
          body: message.body,
          vector: embedding,
        },
      ],
    });

    await milvus.flush({ collection_names: [COLLECTION_NAME] });
  },

  searchConversationMessages: async (conversationId, query, limit = 20) => {
    await ensureCollection();

    const embedding = await embeddingService.getEmbedding(query);

    const searchResponse = await milvus.search({
      collection_name: COLLECTION_NAME,
      data: [embedding],
      limit,
      output_fields: [
        "message_id",
        "conversation_id",
        "sender_id",
        "body",
        "created_at",
      ],
      filter: `conversation_id == "${conversationId}"`,
      metric_type: MetricType.COSINE,
      params: {
        ef: 64,
      },
    });

    return normalizeResult(searchResponse);
  },
};
