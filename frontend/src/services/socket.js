import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

let socket = null; // Socket instance scoped to the session

export const connectSocket = () => {
  if (!socket || !socket.connected) {
    console.log("🔌 Creating new socket instance...");
    socket = io(SOCKET_URL, {
      autoConnect: true,
      withCredentials: true,
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    // Add socket event listeners for debugging
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
    });

    socket.on("error", (error) => {
      console.error("❌ Socket error:", error);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    console.log("🔌 Disconnecting socket...");
    socket.disconnect();
    socket = null; // Clear the socket instance
  }
};
