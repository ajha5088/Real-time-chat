import { z } from 'zod';

export const createConversationSchema = z.object({
  type: z.enum(['direct', 'group']),
  name: z.string().max(120).optional(),
  memberIds: z.array(z.string().uuid()).min(1)
});

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
  participantIds: z.array(z.string().uuid()).default([]),
  attachments: z.array(
    z.object({
      name: z.string(),
      url: z.string().url(),
      mimeType: z.string(),
      size: z.number().int().nonnegative()
    })
  ).optional().default([])
});