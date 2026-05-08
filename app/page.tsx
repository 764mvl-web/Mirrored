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
  const [isPremium, setIsPremium] = useState(false); // false = Free, true = Premium
  const [isLoading, setIsLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("mirrored-chats");
    if (saved) {
      const parsed: Chat[] = JSON.parse(saved);
      setChats(parsed);
      if (parsed.length > 0) {
        setCurrentChatId(parsed[0].id);
        setMessages(parsed[0].messages);
      }
    } else {
      createNewChat(); // создаём первый чат при первом заходе
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("mirrored-chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (currentChatId) {
      const current = chats.find(c => c.id === currentChatId);
      if (current) setMessages(current.messages);
    }
  }, [currentChatId, chats]);

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

  const deleteChat = (id: string) => {
    if (chats.length === 1) {
      alert("You need at least one chat");
      return;
    }
    const filtered = chats.filter(c => c.id !== id);
    setChats(filtered);
    if (currentChatId === id) {
      setCurrentChatId(filtered[0].id);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentChatId || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    setChats(prev => prev.map(chat =>
      chat.id === currentChatId ? { ...chat, messages: newMessages } : chat
    ));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: newMessages,
          mode,
          model: isPremium ? "premium" : "free"
        }),
      });

      const data = await res.json();
      const assistantMessage: Message = { role: "assistant", content: data.reply || "..." };

      const finalMessages = [...newMessages, assistantMessage];

      // Генерируем нормальное название чата
      let newTitle = "New Conversation";
      if (newMessages.length === 1) {
        const firstMsg = newMessages[0].content;
        newTitle = firstMsg.length > 45 
          ? firstMsg.slice(0, 42) + "..." 
          : firstMsg;
      }

      setMessages(finalMessages);
      setChats(prev => prev.map(chat =>
        chat.id === currentChatId
          ? { ...chat, messages: finalMessages, title: newTitle }
          : chat
      ));
    } catch (error) {
      console.error(error);
      alert("Connection error. Please try again.");
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
              <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                {chat.title}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }}
                style={styles.deleteBtn}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN AREA */}
      <div style={styles.main}>
        <div style={styles.topBar}>
          <div style={styles.modeContainer}>
            <button onClick={() => setMode("soft")} style={{ ...styles.modeBtn, background: mode === "soft" ? "#fff" : "#222", color: mode === "soft" ? "#000" : "#fff" }}>
              Soft
            </button>
            <button onClick={() => setMode("sharp")} style={{ ...styles.modeBtn, background: mode === "sharp" ? "#fff" : "#222", color: mode === "sharp" ? "#000" : "#fff" }}>
              Sharp
            </button>
          </div>

          <div style={styles.modelToggle}>
            <button
              onClick={() => setIsPremium(false)}
              style={{ ...styles.modelBtn, background: !isPremium ? "#fff" : "#222", color: !isPremium ? "#000" : "#fff" }}
            >
              Free
            </button>
            <button
              onClick={() => setIsPremium(true)}
              style={{ ...styles.modelBtn, background: isPremium ? "#fff" : "#222", color: isPremium ? "#000" : "#fff" }}
            >
              Premium ✨
            </button>
          </div>
        </div>

        <div style={styles.chatArea}>
          {messages.length === 0 ? (
            <div style={styles.onboarding}>
              <h1 style={{ fontSize: 48, margin: "0 0 16px 0" }}>Mirror your mind.</h1>
              <p style={{ fontSize: 18, opacity: 0.75, lineHeight: 1.4 }}>
                I don&apos;t give advice.<br />
                I reflect your thoughts back to you.
              </p>

              <div style={{ marginTop: 50 }}>
                {[
                  "I keep procrastinating and I don&apos;t know why",
                  "I&apos;m thinking about quitting my job",
                  "I feel stuck in my relationship",
                  "Help me understand myself better"
                ].map((text, i) => (
                  <button key={i} onClick={() => { setInput(text); setTimeout(sendMessage, 80); }} style={styles.quickBtn}>
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

          {isLoading && <div style={styles.loading}>Mirrored is reflecting...</div>}
          <div ref={bottomRef} />
        </div>

        <div style={styles.inputArea}>
          <input
            style={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write what's on your mind..."
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
  container: { display: "flex", height: "100vh", background: "#0b0b0b", color: "#fff", fontFamily: "system-ui, sans-serif" },
  sidebar: { width: 280, borderRight: "1px solid #222", display: "flex", flexDirection: "column" },
  sidebarHeader: { padding: "20px 16px", borderBottom: "1px solid #222" },
  logo: { fontSize: 24, fontWeight: 700, letterSpacing: "-1px" },
  newChatBtn: { marginTop: 12, padding: "10px", background: "#fff", color: "#000", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 600, width: "100%" },

  chatList: { flex: 1, overflowY: "auto", padding: "8px" },
  chatItem: { 
    padding: "10px 12px", 
    borderRadius: 8, 
    marginBottom: 4, 
    cursor: "pointer", 
    display: "flex", 
    alignItems: "center", 
    gap: 8 
  },
  deleteBtn: { 
    background: "none", 
    border: "none", 
    color: "#666", 
    cursor: "pointer", 
    fontSize: 16, 
    padding: "0 4px" 
  },

  main: { flex: 1, display: "flex", flexDirection: "column" },
  topBar: { padding: "12px 20px", borderBottom: "1px solid #222", display: "flex", justifyContent: "space-between", alignItems: "center" },
  modeContainer: { display: "flex", gap: 6 },
  modeBtn: { padding: "7px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 14 },

  modelToggle: { display: "flex", background: "#111", borderRadius: 8, padding: 3 },
  modelBtn: { padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 14 },

  chatArea: { flex: 1, padding: "30px 20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 },
  onboarding: { margin: "auto", textAlign: "center", maxWidth: 480 },
  message: { maxWidth: "72%", padding: "14px 18px", borderRadius: 14, lineHeight: 1.5 },
  loading: { alignSelf: "flex-start", padding: "10px 16px", fontStyle: "italic", opacity: 0.6 },

  inputArea: { padding: "16px 20px", borderTop: "1px solid #222", display: "flex", gap: 10 },
  input: { 
    flex: 1, 
    padding: "15px 18px", 
    background: "#111", 
    border: "1px solid #333", 
    borderRadius: 12, 
    color: "#fff", 
    fontSize: 16 
  },
  sendBtn: { 
    padding: "0 26px", 
    background: "#fff", 
    color: "#000", 
    border: "none", 
    borderRadius: 12, 
    fontSize: 22, 
    cursor: "pointer" 
  },

  quickBtn: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "15px 18px",
    marginBottom: 10,
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 15
  }
};