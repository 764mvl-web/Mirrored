"use client";

import { useState, useRef, useEffect } from "react";

type Message = { role: "user" | "assistant"; content: string };
type Chat = {
  id: string;
  title: string;
  messages: Message[];
  memory: string;
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

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(true);

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
        setShowOnboarding(false);
      }
    } else {
      createNewChat();
    }
  }, []);

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
    setShowOnboarding(true);
  };

  const deleteChat = (id: string) => {
    if (chats.length === 1) return alert("You need at least one chat");
    const filtered = chats.filter(c => c.id !== id);
    setChats(filtered);
    if (currentChatId === id) setCurrentChatId(filtered[0].id);
  };

  const sendMessage = async () => {
    if (!input.trim() || !currentChatId || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    let newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setShowOnboarding(false);

    // ... (остальная логика sendMessage без изменений)
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

      if (newMessages.length % 6 === 0 && newMessages.length > 4) {
        // updateMemory logic (если есть)
      }
    } catch (error) {
      console.error(error);
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
              <div style={{ flex: 1 }}>{chat.title}</div>
              {chat.memory && <span style={styles.memoryDot}>🧠</span>}
              <button onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} style={styles.deleteBtn}>✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN CHAT */}
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
          {messages.length === 0 && showOnboarding ? (
            <div style={styles.onboarding}>
              <h1 style={{ fontSize: 54, marginBottom: 32 }}>Mirror your mind.</h1>
              
              <div style={{ fontSize: 21, lineHeight: 1.6, opacity: 0.95, maxWidth: 460 }}>
                <p>1. You say what&apos;s been sitting in your head</p>
                <p>2. I reflect it back</p>
                <p>3. Some things become difficult to ignore</p>
              </div>

              <button 
                onClick={() => setShowOnboarding(false)}
                style={styles.primaryBtn}
              >
                Start Reflecting
              </button>
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

          {isLoading && <div style={styles.loading