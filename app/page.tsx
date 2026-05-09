"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };
type Chat = {
  id: string;
  title: string;
  messages: Message[];
  memory: string;           // ← Новая память
  createdAt: Date;
};

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"soft" | "sharp">("sharp");
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chats
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
      createNewChat();
    }
  }, []);

  // Save chats
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
      memory: "",
      createdAt: new Date(),
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    setMessages([]);
  };

  const deleteChat = (id: string) => {
    if (chats.length === 1) return alert("You need at least one chat");
    const filtered = chats.filter(c => c.id !== id);
    setChats(filtered);
    if (currentChatId === id) setCurrentChatId(filtered[0].id);
  };

  // Summarize memory
  const updateMemory = async (chatId: string, currentMessages: Message[]) => {
    if (currentMessages.length < 4) return;

    setIsSummarizing(true);
    try {
      const res = await fetch("/api/memory/summarize", {
        method: "POST",
        body: JSON.stringify({ messages: currentMessages, currentMemory: "" }),
      });
      const data = await res.json();

      if (data.summary) {
        setChats(prev => prev.map(chat =>
          chat.id === chatId
            ? { ...chat, memory: data.summary }
            : chat
        ));
      }
    } catch (e) {
      console.error("Memory update failed", e);
    } finally {
      setIsSummarizing(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentChatId || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    let newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    setChats(prev => prev.map(chat =>
      chat.id === currentChatId ? { ...chat, messages: newMessages } : chat
    ));

    try {
      const currentChat = chats.find(c => c.id === currentChatId);
      const memory = currentChat?.memory || "";

      const res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          messages: newMessages,
          mode,
          model: isPremium ? "premium" : "free",
          userMemory: memory,
        }),
      });

      const data = await res.json();
      const assistantMessage: Message = { role: "assistant", content: data.reply };

      newMessages = [...newMessages, assistantMessage];

      setMessages(newMessages);
      setChats(prev => prev.map(chat =>
        chat.id === currentChatId
          ? { 
              ...chat, 
              messages: newMessages,
              title: chat.messages.length <= 1 
                ? newMessages[0].content.slice(0, 45) + "..." 
                : chat.title 
            }
          : chat
      ));

      // Update memory every ~5-6 messages
      if (newMessages.length % 6 === 0) {
        updateMemory(currentChatId, newMessages);
      }

    } catch (error) {
      console.error(error);
      alert("Connection error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const currentChat = chats.find(c => c.id === currentChatId);

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.logo}>mirrored</div>
          <button onClick={createNewChat} style={styles.newChatBtn}>+ New Chat</button>
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
              <div style={{ flex: 1 }}>{chat.title}</div>
              {chat.memory && <span style={styles.memoryDot}>🧠</span>}
              <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} style={styles.deleteBtn}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat */}
      <div style={styles.main}>
        <div style={styles.topBar}>
          <div style={styles.modeContainer}>
            <button onClick={() => setMode("soft")} style={{...styles.modeBtn, background: mode === "soft" ? "#fff" : "#222", color: mode === "soft" ? "#000" : "#fff" }}>Soft</button>
            <button onClick={() => setMode("sharp")} style={{...styles.modeBtn, background: mode === "sharp" ? "#fff" : "#222", color: mode === "sharp" ? "#000" : "#fff" }}>Sharp</button>
          </div>

          <div style={styles.modelToggle}>
            <button onClick={() => setIsPremium(false)} style={{...styles.modelBtn, background: !isPremium ? "#fff" : "#222", color: !isPremium ? "#000" : "#fff" }}>Free</button>
            <button onClick={() => setIsPremium(true)} style={{...styles.modelBtn, background: isPremium ? "#fff" : "#222", color: isPremium ? "#000" : "#fff" }}>Premium ✨</button>
          </div>
        </div>

        <div style={styles.chatArea}>
          {messages.length === 0 ? (
            <div style={styles.onboarding}>
              <h1 style={{ fontSize: 48 }}>Mirror your mind.</h1>
              <p style={{ fontSize: 18, opacity: 0.8 }}>I reflect. I don&apos;t fix.</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} style={{
                ...styles.message,
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "#2a2a2a" : "#171717",
              }}>
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
          <button style={styles.sendBtn} onClick={sendMessage} disabled={isLoading || !input.trim()}>→</button>
        </div>
      </div>
    </div>
  );
}

