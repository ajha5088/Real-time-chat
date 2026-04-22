import { v4 as uuid } from "uuid";
import { StatusCodes } from "http-status-codes";
import { conversationRepository } from "../repositories/conversationRepository.js";
import { messageRepository } from "../repositories/messageRepository.js";
import { graphService } from "./graphService.js";
import { ApiError } from "../utils/apiError.js";
import { enqueueMessageIndexTask } from "./queueService.js";

export const chatService = {
  createConversation: async ({ type, name, memberIds, currentUserId }) => {
    const normalized = Array.from(new Set([currentUserId, ...memberIds]));

    if (type === "direct" && normalized.length !== 2) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Direct conversation must include exactly two users",
      );
    }

    if (type === "group" && normalized.length < 3) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Group conversation requires at least three users",
      );
    }

    // Check if direct conversation already exists
    if (type === "direct") {
      const existingConversation =
        await conversationRepository.findDirectConversation(
          currentUserId,
          normalized[1],
        );
      if (existingConversation) {
        return existingConversation;
      }
    }

    const conversation = await conversationRepository.createConversation({
      id: uuid(),
      name,
      type,
      createdBy: currentUserId,
    });

    for (const userId of normalized) {
      await conversationRepository.addParticipant({
        conversationId: conversation.id,
        userId,
        role: userId === currentUserId ? "admin" : "member",
      });
    }

    await graphService.linkConversationMembers(conversation.id, normalized);
    return conversation;
  },

  listConversations: async (userId) => {
    return conversationRepository.listForUser(userId);
  },

  listMessages: async (conversationId, userId) => {
    const allowed = await conversationRepository.isParticipant(
      conversationId,
      userId,
    );

    if (!allowed) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Access denied");
    }

    return messageRepository.listByConversation(conversationId);
  },

  createMessage: async ({
    conversationId,
    senderId,
    body,
    attachments = [],
    participantIds = [],
  }) => {
    const allowed = await conversationRepository.isParticipant(
      conversationId,
      senderId,
    );

    if (!allowed) {
      throw new ApiError(StatusCodes.FORBIDDEN, "Access denied");
    }

    const message = await messageRepository.create({
      _id: uuid(),
      conversationId,
      senderId,
      body,
      attachments,
    });

    await conversationRepository.touchConversation(conversationId);
    await graphService.incrementInteraction(
      senderId,
      participantIds.filter((id) => id !== senderId),
    );

    enqueueMessageIndexTask({
      type: "index_message",
      message: message.toObject(),
    }).catch((error) => {
      console.error("Failed to enqueue message index task:", error.message);
    });

    return message.toObject();
  },
};
