import { consumeMessageIndexTask } from "./services/queueService.js";
import { vectorSearchService } from "./services/vectorSearchService.js";
import { log } from "./config/logger.js";

const processTask = async (task) => {
  if (!task || task.type !== "index_message" || !task.message) {
    return;
  }

  await vectorSearchService.indexMessage(task.message);
  log(`Indexed message ${task.message._id} in Milvus`);
};

const runProcessor = async () => {
  log("Message processor started");

  while (true) {
    try {
      const task = await consumeMessageIndexTask();
      await processTask(task);
    } catch (error) {
      log("Message processor error", error.message);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
};

runProcessor().catch((error) => {
  console.error("Message processor failed:", error);
  process.exit(1);
});
