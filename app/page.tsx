
"use client";

import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Chat {
  id: number;
  title: string;
  messages: Message[];
}

export default function Home() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("sharp");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("mirrored_chats");

    if (stored) {
      const parsed = JSON.parse(stored);
      setChats(parsed);

      if (parsed.length > 0) {
        setActiveChatId(parsed[0].id);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("mirrored_chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, activeChatId]);

  const activeChat = chats.find((c) => c.id === activeChatId);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now(),
      title: "New reflection",
      messages: [],
    };

    setChats([newChat, ...chats]);
    setActiveChatId(newChat.id);
    setSidebarOpen(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !activeChat) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    const updatedMessages = [...activeChat.messages, userMessage];

    const updatedChats = chats.map((chat) =>
      chat.id === activeChat.id
        ? {
            ...chat,
            messages: updatedMessages,
            title:
              chat.messages.length === 0
                ? input.slice(0, 28)
                : chat.title,
          }
        : chat
    );

    setChats(updatedChats);

    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          mode,
          model: "free",
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply,
      };

      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id !== activeChat.id) return chat;

          return {
            ...chat,
            messages: [...updatedMessages, assistantMessage],
          };
        })
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {!isMobile && (
        <div style={styles.sidebar}>
          <div style={styles.logo}>Mirrored</div>

          <button style={styles.newBtn} onClick={createNewChat}>
            + New reflection
          </button>

          <div style={styles.sectionTitle}>Reflections</div>

          <div style={styles.chatList}>
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                style={{
                  ...styles.chatItem,
                  ...(activeChatId === chat.id
                    ? styles.activeChatItem
                    : {}),
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {chat.title}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          const filtered = chats.filter(
                            (c) => c.id !== chat.id
                          );

                          setChats(filtered);

                          if (activeChatId === chat.id) {
                            setActiveChatId(
                              filtered.length > 0
                                ? filtered[0].id
                                : null
                            );
                          }
                        }}
                        style={styles.deleteBtn}
                      >
                        ×
                      </button>
                    </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={styles.main}>
        <div style={styles.topbar}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {isMobile && (
              <button
                style={styles.iconBtn}
                onClick={() => setSidebarOpen(true)}
              >
                ☰
              </button>
            )}

            <div style={styles.mobileLogo}>mirrored</div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              style={{
                ...styles.modeBtn,
                ...(mode === "soft" ? styles.activeMode : {}),
              }}
              onClick={() => setMode("soft")}
            >
              Soft
            </button>

            <button
              style={{
                ...styles.modeBtn,
                ...(mode === "sharp" ? styles.activeMode : {}),
              }}
              onClick={() => setMode("sharp")}
            >
              Sharp
            </button>

            <button
              style={styles.crownBtn}
              onClick={() => {
                alert(
                  "Premium is limited while Mirrored evolves."
                );
              }}
            >
              ♛
            </button>
          </div>
        </div>

        {isMobile && sidebarOpen && (
          <>
            <div
              style={styles.overlay}
              onClick={() => setSidebarOpen(false)}
            />

            <div style={styles.mobileSidebar}>
              <div style={styles.mobileSidebarHeader}>
                <div style={styles.logo}>mirrored</div>

                <button
                  style={styles.iconBtn}
                  onClick={() => setSidebarOpen(false)}
                >
                  ✕
                </button>
              </div>

              <button
                style={styles.newBtn}
                onClick={createNewChat}
              >
                + New reflection
              </button>

              <div style={styles.sectionTitle}>Reflections</div>

              <div style={styles.chatList}>
                {chats.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setActiveChatId(chat.id);
                      setSidebarOpen(false);
                    }}
                    style={{
                      ...styles.chatItem,
                      ...(activeChatId === chat.id
                        ? styles.activeChatItem
                        : {}),
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {chat.title}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();

                          const filtered = chats.filter(
                            (c) => c.id !== chat.id
                          );

                          setChats(filtered);

                          if (activeChatId === chat.id) {
                            setActiveChatId(
                              filtered.length > 0
                                ? filtered[0].id
                                : null
                            );
                          }
                        }}
                        style={styles.deleteBtn}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div style={styles.chatArea}>
          {!activeChat ? (
            <div style={styles.emptyState}>
              <div style={styles.heroSmall}>MIRRORED</div>

              <h1 style={styles.heroTitle}>
                Say what’s been sitting in your head.
              </h1>

              <p style={styles.heroText}>
                I’ll reflect it back.
              </p>

              <button
                style={styles.enterBtn}
                onClick={createNewChat}
              >
                Enter
              </button>
            </div>
          ) : (
            <>
              {activeChat.messages.map((message, index) => (
                <div
                  key={index}
                  style={{
                    ...styles.message,
                    alignSelf:
                      message.role === "user"
                        ? "flex-end"
                        : "flex-start",
                    background:
                      message.role === "user"
                        ? "#171717"
                        : "#101010",
                    maxWidth: isMobile ? "88%" : "72%",
                  }}
                >
                  {message.content}
                </div>
              ))}

              {isLoading && (
                <div style={styles.loading}>
                  reflecting...
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div style={styles.inputArea}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            placeholder="Say what's on your mind..."
            style={styles.input}
          />

          <button style={styles.sendBtn} onClick={sendMessage}>
            →
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    display: "flex",
    height: "100dvh",
    background: "#050505",
    color: "white",
    overflow: "hidden",
    fontFamily: "Inter, sans-serif",
  },

  sidebar: {
    width: 280,
    background: "#090909",
    borderRight: "1px solid #181818",
    padding: 18,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  mobileSidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: 300,
    height: "100dvh",
    background: "#090909",
    zIndex: 50,
    padding: 18,
    borderRight: "1px solid #181818",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    backdropFilter: "blur(4px)",
    zIndex: 40,
  },

  mobileSidebarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  logo: {
    fontSize: 34,
    fontWeight: 700,
  },

  mobileLogo: {
    fontSize: 20,
    fontWeight: 600,
  },

  newBtn: {
    border: "none",
    background: "white",
    color: "black",
    padding: "14px",
    borderRadius: 14,
    cursor: "pointer",
    fontWeight: 600,
  },

  sectionTitle: {
    fontSize: 12,
    opacity: 0.4,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
  },

  chatList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
  },

  chatItem: {
    padding: "14px",
    borderRadius: 14,
    background: "#101010",
    border: "1px solid #1a1a1a",
    cursor: "pointer",
    color: "#cfcfcf",
    fontSize: 14,
  },

  activeChatItem: {
    background: "#171717",
    border: "1px solid #2b2b2b",
    color: "white",
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  topbar: {
    padding: "14px 18px",
    borderBottom: "1px solid #181818",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    border: "1px solid #222",
    background: "#111",
    color: "white",
    cursor: "pointer",
  },

  modeBtn: {
    border: "1px solid #242424",
    background: "#101010",
    color: "white",
    borderRadius: 12,
    padding: "10px 14px",
    cursor: "pointer",
  },

  activeMode: {
    background: "white",
    color: "black",
  },

  crownBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    border: "1px solid #2a2a2a",
    background: "#111",
    color: "#f5d0a9",
    cursor: "pointer",
    fontSize: 18,
  },

  chatArea: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 18,
    padding: "24px 18px",
  },

  emptyState: {
    margin: "auto",
    textAlign: "center",
    maxWidth: 700,
  },

  heroSmall: {
    opacity: 0.4,
    letterSpacing: 2,
    fontSize: 12,
    marginBottom: 18,
  },

  heroTitle: {
    fontSize: "clamp(38px, 7vw, 72px)",
    lineHeight: 1,
    marginBottom: 18,
    letterSpacing: -2,
  },

  heroText: {
    opacity: 0.75,
    fontSize: 22,
    marginBottom: 30,
  },

  enterBtn: {
    border: "none",
    background: "white",
    color: "black",
    padding: "14px 30px",
    borderRadius: 16,
    cursor: "pointer",
    fontWeight: 600,
  },

  message: {
    padding: "16px 18px",
    borderRadius: 18,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },

  loading: {
    opacity: 0.4,
    fontStyle: "italic",
  },

  inputArea: {
    padding: 16,
    borderTop: "1px solid #181818",
    display: "flex",
    gap: 12,
    paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
  },

  input: {
    flex: 1,
    background: "#101010",
    border: "1px solid #222",
    borderRadius: 16,
    padding: "16px 18px",
    color: "white",
    fontSize: 16,
    outline: "none",
  },

  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 8,
    border: "1px solid #2a2a2a",
    background: "#151515",
    color: "#8a8a8a",
    cursor: "pointer",
    fontSize: 14,
    flexShrink: 0,
  },

  sendBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    border: "none",
    background: "white",
    color: "black",
    cursor: "pointer",
    fontSize: 22,
  },
};

