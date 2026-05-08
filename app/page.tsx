"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };
type Chat = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
};

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"soft" | "sharp">("sharp");
  const [model, setModel] = useState<"4o-mini" | "4o">("4o-mini");
  const [isLoading, setIsLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chats from localStorage
  useEffect(() => {
    const savedChats = localStorage.getItem("mirrored-chats");
    if (savedChats) {
      const parsed = JSON.parse(savedChats);
      setChats(parsed);
      if (parsed.length > 0) {
        setCurrentChatId(parsed[0].id);
        setMessages(parsed[0].messages);
      }
    }
  }, []);

  // Save chats to localStorage
  useEffect(() => {
    localStorage.setItem("mirrored-chats", JSON.stringify(chats));
  }, [chats]);

  // Update messages when switching chats
  useEffect(() => {
    if (currentChatId) {
      const currentChat = chats.find(c => c.id === currentChatId);
      if (currentChat) setMessages(currentChat.messages);
    }
  }, [currentChatId, chats]);

  const currentChat = chats.find(c => c.id === currentChatId);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date(),
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    setMessages([]);
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentChatId || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const newMessages = [...messages, userMessage];

    // Update UI immediately
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    // Update chat in state
    setChats(prev => prev.map(chat =>
      chat.id === currentChatId
        ? { ...chat, messages: newMessages }
        : chat
    ));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: newMessages,
          mode,
          model,
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = { role: "assistant", content: data.reply };

      const finalMessages = [...newMessages, assistantMessage];

      setMessages(finalMessages);
      setChats(prev => prev.map(chat =>
        chat.id === currentChatId
          ? { 
              ...chat, 
              messages: finalMessages,
              title: chat.messages.length === 0 
                ? finalMessages[0].content.slice(0, 40) + "..." 
                : chat.title 
            }
          : chat
      ));
    } catch (error) {
      console.error(error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={styles.container}>
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>mirrored</div>
          <button onClick={createNewChat} style={styles.newChatBtn}>
            + New Chat
          </button>
        </div>

        <div style={styles.chatList}>
          {chats.map(chat => (
            <div
              key={chat.id}
              onClick={() => setCurrentChatId(chat.id)}
              style={{
                ...styles.chatItem,
                background: currentChatId === chat.id ? "#1f1f1f" : "transparent",
              }}
            >
              {chat.title}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div style={styles.main}>
        {/* Top Bar */}
        <div style={styles.topBar}>
          <div style={styles.modeContainer}>
            <button
              onClick={() => setMode("soft")}
              style={{ ...styles.modeBtn, background: mode === "soft" ? "#fff" : "#222", color: mode === "soft" ? "#000" : "#fff" }}
            >
              Soft
            </button>
            <button
              onClick={() => setMode("sharp")}
              style={{ ...styles.modeBtn, background: mode === "sharp" ? "#fff" : "#222", color: mode === "sharp" ? "#000" : "#fff" }}
            >
              Sharp
            </button>
          </div>

          <select
            value={model}
            onChange={(e) => setModel(e.target.value as "4o-mini" | "4o")}
            style={styles.modelSelect}
          >
            <option value="4o-mini">4o-mini (Free)</option>
            <option value="4o">4o (Paid soon)</option>
          </select>
        </div>

        {/* Messages */}
        <div style={styles.chatArea}>
          {messages.length === 0 ? (
            <div style={styles.onboarding}>
              <h1 style={{ fontSize: 42, marginBottom: 8 }}>Mirror your mind.</h1>
              <p style={{ fontSize: 18, opacity: 0.8, maxWidth: 420 }}>
                I don&apos;t give advice.<br />
                I help you see your own thoughts more clearly.
              </p>

              <div style={{ marginTop: 40 }}>
                <p style={{ marginBottom: 16, opacity: 0.6 }}>Try starting with:</p>
                {[
                  "I keep procrastinating and I don&apos;t know why",
                  "I&apos;m thinking about quitting my job",
                  "I feel stuck in my relationship",
                  "I want to understand myself better"
                ].map((text, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(text);
                      // Auto send after small delay
                      setTimeout(() => sendMessage(), 100);
                    }}
                    style={styles.quickBtn}
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                style={{
                  ...styles.message,
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  background: m.role === "user" ? "#2a2a2a" : "#171717",
                }}
              >
                {m.content}
              </div>
            ))
          )}
          {isLoading && <div style={styles.loading}>Mirrored is thinking...</div>}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={styles.inputArea}>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write what&apos;s on your mind..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            disabled={isLoading}
          />
          <button style={styles.sendBtn} onClick={sendMessage} disabled={isLoading || !input.trim()}>
            →
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  container: { display: "flex", height: "100vh", background: "#0b0b0b", color: "#fff" },
  sidebar: { width: 260, borderRight: "1px solid #222", display: "flex", flexDirection: "column" },
  sidebarHeader: { padding: "16px", borderBottom: "1px solid #222" },
  logo: { fontSize: 22, fontWeight: 700, letterSpacing: "-1px" },
  newChatBtn: { marginTop: 12, padding: "8px 14px", background: "#fff", color: "#000", border: "none", borderRadius: 8, cursor: "pointer", width: "100%" },
  chatList: { flex: 1, overflowY: "auto", padding: "8px" },
  chatItem: { padding: "10px 14px", borderRadius: 8, marginBottom: 4, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  
  main: { flex: 1, display: "flex", flexDirection: "column" },
  topBar: { padding: "12px 20px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" },
  modeContainer: { display: "flex", gap: 6 },
  modeBtn: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer" },
  modelSelect: { background: "#111", color: "#fff", border: "1px solid #333", padding: "6px 10px", borderRadius: 6 },

  chatArea: { flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 },
  onboarding: { margin: "auto", textAlign: "center", maxWidth: 460 },
  message: { maxWidth: "70%", padding: "13px 17px", borderRadius: 12, lineHeight: 1.5 },
  loading: { alignSelf: "flex-start", padding: "10px 16px", opacity: 0.7 },

  inputArea: { padding: "16px 20px", borderTop: "1px solid #222", display: "flex", gap: 10 },
  input: { flex: 1, padding: "14px 18px", background: "#111", border: "1px solid #333", borderRadius: 12, color: "#fff", fontSize: 16 },
  sendBtn: { padding: "0 24px", background: "#fff", color: "#000", border: "none", borderRadius: 12, fontSize: 20, cursor: "pointer" },

  quickBtn: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "14px 18px",
    marginBottom: 10,
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 10,
    cursor: "pointer"
  }
};