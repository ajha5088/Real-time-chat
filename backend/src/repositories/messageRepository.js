import { Message } from '../models/Message.js';

export const messageRepository = {
  create: (payload) => Message.create(payload),

  listByConversation: (conversationId, limit = 50) =>
    Message.find({ conversationId, deletedAt: null })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean(),

  findById: (id) => Message.findById(id),

  markDeleted: (id) =>
    Message.findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
};