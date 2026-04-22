import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    conversationId: { type: String, required: true, index: true },
    senderId: { type: String, required: true, index: true },
    body: { type: String, required: true, trim: true },
    attachments: [
      {
        name: String,
        url: String,
        mimeType: String,
        size: Number
      }
    ],
    editedAt: { type: Date, default: null },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

export const Message = mongoose.model('Message', messageSchema);