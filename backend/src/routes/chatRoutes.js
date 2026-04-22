import { Router } from "express";
import {
  createConversation,
  listConversations,
  listMessages,
  searchUsers,
  searchConversationMessages,
} from "../controllers/chatController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { createConversationSchema } from "../validators/chatValidator.js";

const router = Router();

router.use(authMiddleware);

router.get("/users/search", searchUsers);
router.get("/conversations", listConversations);
router.post(
  "/conversations",
  validate(createConversationSchema),
  createConversation,
);
router.get("/conversations/:conversationId/search", searchConversationMessages);
router.get("/conversations/:conversationId/messages", listMessages);

export default router;
