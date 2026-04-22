import { useEffect, useState } from "react";
import { connectSocket, disconnectSocket } from "../services/socket";
import api from "../services/api";

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f3f5f9",
    padding: 24,
    fontFamily: "Inter, system-ui, sans-serif",
  },
  layout: {
    maxWidth: 1200,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "320px 1fr",
    gap: 24,
  },
  panel: {
    background: "white",
    borderRadius: 20,
    boxShadow: "0 20px 50px rgba(15,23,42,0.08)",
    padding: 20,
  },
  sectionTitle: {
    margin: 0,
    marginBottom: 16,
    fontSize: 20,
    color: "#0f172a",
  },
  searchBar: {
    display: "flex",
    gap: 10,
    marginBottom: 16,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: 14,
  },
  button: {
    border: "none",
    borderRadius: 12,
    padding: "12px 18px",
    background: "#2563eb",
    color: "white",
    cursor: "pointer",
    fontWeight: 600,
  },
  conversationItem: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
  activeConversation: {
    background: "#eff6ff",
  },
  messageList: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    maxHeight: 420,
    overflowY: "auto",
    paddingRight: 6,
  },
  messageRow: {
    display: "flex",
  },
  messageBubble: {
    padding: "14px 18px",
    borderRadius: 20,
    background: "#e2e8f0",
    maxWidth: "70%",
    lineHeight: 1.6,
  },
  messageBubbleSelf: {
    background: "#2563eb",
    color: "white",
  },
  messageMeta: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 8,
  },
};

export default function Chat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [chatMode, setChatMode] = useState("direct"); // 'direct' or 'group'
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [groupName, setGroupName] = useState("");

  const getFirstName = (name) => name?.split(" ")[0] || "";

  useEffect(() => {
    const init = async () => {
      console.log("🚀 Initializing chat application...");
      await fetchCurrentUser();
      await fetchConversations();
      const socket = connectSocket();

      socket.on("message:received", handleIncomingMessage);

      return () => {
        socket.off("message:received", handleIncomingMessage);
        disconnectSocket();
      };
    };
    init();
  }, []);

  const handleIncomingMessage = (data) => {
    console.log("📨 Message received:", data);
    if (
      selectedConversation &&
      data.conversationId === selectedConversation.id
    ) {
      setMessages((prev) => {
        const exists = prev.some(
          (msg) => msg._id === data._id || msg.id === data.id,
        );
        if (exists) return prev;
        return [...prev, data];
      });
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !selectedConversation) return;

    const socket = connectSocket();
    const messageBody = message.trim();
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      conversationId: selectedConversation.id,
      senderId: currentUser?.id,
      body: messageBody,
      createdAt: new Date(),
      sender: {
        id: currentUser?.id,
        fullName: currentUser?.full_name,
        email: currentUser?.email,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessage("");

    socket.emit(
      "message:send",
      {
        conversationId: selectedConversation.id,
        body: messageBody,
      },
      (response) => {
        if (!response.ok) {
          alert("Failed to send message: " + response.message);
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== optimisticMessage.id),
          );
          return;
        }

        const sentMessage = response.message;
        if (
          sentMessage &&
          selectedConversation?.id === sentMessage.conversationId
        ) {
          setMessages((prev) => {
            const exists = prev.some(
              (msg) => msg._id === sentMessage._id || msg.id === sentMessage.id,
            );
            if (exists) return prev;
            return prev.map((msg) =>
              msg.id === optimisticMessage.id ? sentMessage : msg,
            );
          });
        }
      },
    );
  };

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    try {
      const res = await api.get(
        `/api/chat/users/search?q=${encodeURIComponent(searchQuery)}`,
      );
      setSearchResults(res.data.users || []);
    } catch (err) {
      console.error("Failed to search users", err);
    }
  };

  const getConversationTitle = (conversation) => {
    if (!conversation) return "Conversation";
    if (conversation.name) return conversation.name;
    const others =
      conversation.participants?.filter(
        (participant) => participant.id !== currentUser?.id,
      ) || [];
    const names = others.map(
      (participant) => participant.fullName.split(" ")[0],
    );
    return names.length ? names.join(", ") : "Chat";
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCurrentUser(res.data.user);
    } catch (err) {
      console.error("Failed to load current user", err);
    }
  };

  const fetchConversations = async (selectedId) => {
    try {
      const res = await api.get("/api/chat/conversations", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const list = res.data.conversations || [];
      setConversations(list);

      if (selectedId) {
        const found = list.find((conv) => conv.id === selectedId);
        setSelectedConversation(found || list[0] || null);
      } else if (!selectedConversation && list.length > 0) {
        setSelectedConversation(list[0]);
      }
    } catch (err) {
      console.error("Failed to fetch conversations", err);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.layout}>
        <aside style={styles.panel}>
          <h3 style={styles.sectionTitle}>Conversations</h3>
          <div style={styles.searchBar}>
            <input
              style={styles.input}
              placeholder="Search users by name or email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && searchUsers()}
            />
            <button style={styles.button} onClick={searchUsers}>
              Find
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <button
              style={{
                ...styles.button,
                background: chatMode === "direct" ? "#2563eb" : "#d1d5db",
                flex: 1,
              }}
              onClick={() => {
                setChatMode("direct");
                setSelectedMembers([]);
                setGroupName("");
              }}
            >
              Direct Chat
            </button>
            <button
              style={{
                ...styles.button,
                background: chatMode === "group" ? "#2563eb" : "#d1d5db",
                flex: 1,
              }}
              onClick={() => {
                setChatMode("group");
                setSelectedMembers([]);
              }}
            >
              Group Chat
            </button>
          </div>

          {searchResults.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ marginBottom: 10, color: "#475569", fontSize: 14 }}>
                {chatMode === "direct"
                  ? "Create a new direct chat"
                  : "Select members for group"}
              </p>

              {chatMode === "group" && (
                <div style={{ marginBottom: 12 }}>
                  <input
                    style={styles.input}
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>
              )}

              {searchResults.map((user) => {
                const isSelected = selectedMembers.some(
                  (m) => m.id === user.id,
                );
                return (
                  <div
                    key={user.id}
                    onClick={() => {
                      if (chatMode === "direct") {
                        createConversation(user.id);
                      } else {
                        toggleMemberSelection(user);
                      }
                    }}
                    style={{
                      ...styles.conversationItem,
                      background: isSelected ? "#dbeafe" : "#f8fafc",
                      border: isSelected
                        ? "2px solid #2563eb"
                        : "1px solid #e2e8f0",
                      cursor: "pointer",
                    }}
                  >
                    {chatMode === "group" && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleMemberSelection(user)}
                        style={{ marginRight: 8, cursor: "pointer" }}
                      />
                    )}
                    <strong>{user.full_name}</strong>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      {user.email}
                    </div>
                  </div>
                );
              })}

              {chatMode === "group" && selectedMembers.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <button
                    style={{
                      ...styles.button,
                      width: "100%",
                      background:
                        selectedMembers.length >= 2 && groupName.trim()
                          ? "#2563eb"
                          : "#9ca3af",
                    }}
                    onClick={createGroupChat}
                    disabled={selectedMembers.length < 2 || !groupName.trim()}
                  >
                    Create Group ({selectedMembers.length} members)
                  </button>
                </div>
              )}
            </div>
          )}

          {conversations.map((conv) => {
            const title = getConversationTitle(conv);
            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                style={{
                  ...styles.conversationItem,
                  ...(selectedConversation?.id === conv.id
                    ? styles.activeConversation
                    : {}),
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {conv.participants?.length
                    ? `${conv.participants.length} participant${conv.participants.length > 1 ? "s" : ""}`
                    : "No participants"}
                </div>
              </div>
            );
          })}
        </aside>

        <main style={styles.panel}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <div>
              <p style={{ margin: 0, color: "#94a3b8", fontSize: 14 }}>
                Active chat
              </p>
              <h2 style={{ margin: 0, fontSize: 26 }}>
                {getConversationTitle(selectedConversation)}
              </h2>
            </div>
            <div style={{ textAlign: "right", color: "#64748b", fontSize: 14 }}>
              <div>
                {getFirstName(currentUser?.full_name) || currentUser?.email}
              </div>
              <div style={{ color: "#94a3b8" }}>{currentUser?.email}</div>
            </div>
          </div>

          <div style={{ marginBottom: 20, color: "#475569" }}>
            {selectedConversation ? (
              <div>
                Participants:{" "}
                {selectedConversation.participants
                  ?.map((participant) => participant.fullName.split(" ")[0])
                  .join(", ")}
              </div>
            ) : (
              <div>Select a conversation to start chatting.</div>
            )}
          </div>

          <div
            style={{
              ...styles.panel,
              background: "#f8fafc",
              padding: 20,
              minHeight: 520,
            }}
          >
            {selectedConversation ? (
              <div style={styles.messageList}>
                {messages.map((msg) => {
                  const isOwn = msg.senderId === currentUser?.id;
                  return (
                    <div
                      key={msg.id || msg._id}
                      style={{
                        ...styles.messageRow,
                        justifyContent: isOwn ? "flex-end" : "flex-start",
                      }}
                    >
                      <div
                        style={{
                          ...styles.messageBubble,
                          ...(isOwn ? styles.messageBubbleSelf : {}),
                        }}
                      >
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>
                          {getSenderName(msg)}
                        </div>
                        <div>{msg.body}</div>
                        <div style={styles.messageMeta}>
                          {new Date(
                            msg.createdAt || msg.created_at,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ color: "#64748b" }}>No conversation selected.</div>
            )}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <input
              style={styles.input}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Write a message..."
            />
            <button style={styles.button} onClick={sendMessage}>
              Send
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
