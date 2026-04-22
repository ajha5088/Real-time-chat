import { asyncHandler } from "../utils/asyncHandler.js";
import { StatusCodes } from "http-status-codes";
import { ApiError } from "../utils/apiError.js";
import { chatService } from "../services/chatService.js";
import { vectorSearchService } from "../services/vectorSearchService.js";
import { conversationRepository } from "../repositories/conversationRepository.js";
import { userRepository } from "../repositories/userRepository.js";

export const createConversation = asyncHandler(async (req, res) => {
  const conversation = await chatService.createConversation({
    ...req.body,
    currentUserId: req.user.id,
  });

  res.status(201).json({ conversation });
});

export const listConversations = asyncHandler(async (req, res) => {
  const conversations = await chatService.listConversations(req.user.id);
  res.json({ conversations });
});

export const listMessages = asyncHandler(async (req, res) => {
  const messages = await chatService.listMessages(
    req.params.conversationId,
    req.user.id,
  );
  res.json({ messages: messages.reverse() });
});

export const searchUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").toString().trim();

  const users = q
    ? await userRepository.searchByNameOrEmail(q, req.user.id)
    : [];

  res.json({ users });
});

export const searchConversationMessages = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId;
  const q = (req.query.q || "").toString().trim();

  if (!q) {
    return res.json({ messages: [] });
  }

  const allowed = await conversationRepository.isParticipant(
    conversationId,
    req.user.id,
  );

  if (!allowed) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Access denied");
  }

  const messages = await vectorSearchService.searchConversationMessages(
    conversationId,
    q,
    20,
  );
  res.json({ messages });
});
