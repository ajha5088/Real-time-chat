import { verifyAccessToken } from "../utils/jwt.js";
import { userRepository } from "../repositories/userRepository.js";
import { sendMessageSchema } from "../validators/chatValidator.js";
import { chatService } from "../services/chatService.js";

export const registerSocketHandlers = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const payload = verifyAccessToken(token);
      const user = await userRepository.findById(payload.sub);

      if (!user) {
        return next(new Error("Unauthorized"));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.error("Socket auth error:", error.message);
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    try {
      console.log(`✅ User connected: ${socket.user.id} (${socket.id})`);

      await userRepository.updateStatus(socket.user.id, "online");

      socket.join(`user:${socket.user.id}`);

      io.emit("presence:changed", {
        userId: socket.user.id,
        status: "online",
      });

      socket.on("conversation:join", (conversationId) => {
        console.log(
          `🚪 User ${socket.user.id} joining room: conversation:${conversationId}`,
        );
        socket.join(`conversation:${conversationId}`);
        console.log(
          `✅ User ${socket.user.id} joined room: conversation:${conversationId}`,
        );
      });

      socket.on("message:send", async (payload, callback) => {
        try {
          console.log(`📨 Message received from ${socket.user.id}:`, payload);

          const parsed = sendMessageSchema.parse(payload);

          const message = await chatService.createMessage({
            ...parsed,
            senderId: socket.user.id,
          });

          console.log(`💾 Message created:`, message._id);

          const payloadToEmit = {
            ...message,
            sender: {
              id: socket.user.id,
              fullName: socket.user.full_name,
              email: socket.user.email,
              avatarUrl: socket.user.avatar_url,
            },
          };

          console.log(
            `📤 Broadcasting to room: conversation:${parsed.conversationId}`,
          );
          io.to(`conversation:${parsed.conversationId}`).emit(
            "message:received",
            payloadToEmit,
          );

          if (callback) {
            callback({ ok: true, message: payloadToEmit });
          }
        } catch (error) {
          console.error("Error sending message:", error.message);
          if (callback) {
            callback({
              ok: false,
              message: error.message || "Unable to send message",
            });
          }
        }
      });

      socket.on("disconnect", async () => {
        try {
          console.log(`❌ User disconnected: ${socket.user.id}`);

          await userRepository.updateStatus(socket.user.id, "offline");

          io.emit("presence:changed", {
            userId: socket.user.id,
            status: "offline",
          });
        } catch (error) {
          console.error("Error handling disconnect:", error.message);
        }
      });
    } catch (error) {
      console.error("Socket connection error:", error.message);
    }
  });
};
