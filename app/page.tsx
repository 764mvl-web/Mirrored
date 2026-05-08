"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"soft" | "sharp">("sharp");
  const [showOnboarding, setShowOnboarding] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Примеры быстрых стартов
  const quickStarts = [
    "Помоги разобраться, почему я постоянно прокрастинирую",
    "У меня проблемы в отношениях с девушкой, помоги посмотреть на ситуацию",
    "Думаю уволиться с работы. Помоги разложить мысли",
    "Я чувствую, что застрял в жизни. Что со мной не так?",
  ];

  const sendMessage = async (text?: string) => {
    const messageText = text || input;
    if (!messageText) return;

    const newMessages = [...messages, { role: "user", content: messageText }];
    setMessages(newMessages);
    setInput("");
    setShowOnboarding(false);

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages: newMessages, mode }),
    });

    const data = await res.json();

    setMessages((prev) => [
      ...newMessages,
      { role: "assistant", content: data.reply },
    ]);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div style={styles.title}>mirrored</div>
        
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setMode("soft")}
            style={{
              ...styles.modeBtn,
              background: mode === "soft" ? "#fff" : "#222",
              color: mode === "soft" ? "#000" : "#fff",
            }}
          >
            Soft
          </button>
          <button
            onClick={() => setMode("sharp")}
            style={{
              ...styles.modeBtn,
              background: mode === "sharp" ? "#fff" : "#222",
              color: mode === "sharp" ? "#000" : "#fff",
            }}
          >
            Sharp
          </button>
        </div>
      </div>

      {/* CHAT AREA */}
      <div style={styles.chat}>
        {showOnboarding && messages.length === 0 ? (
          <div style={styles.onboarding}>
            <h2>Привет. Я — твое зеркало.</h2>
            <p>Я не даю советы.<br />Я помогаю тебе самому увидеть ситуацию clearer.</p>
            
            <div style={{ marginTop: 30 }}>
              <p style={{ marginBottom: 12, opacity: 0.7 }}>Попробуй начать с:</p>
              {quickStarts.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  style={styles.quickStart}
                >
                  {q}
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
                background: m.role === "user" ? "#2a2a2a" : "#1a1a1a",
              }}
            >
              {m.content}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={styles.inputBox}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Напиши, что тебя сейчас беспокоит..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button style={styles.button} onClick={() => sendMessage()}>
          →
        </button>
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    background: "#0b0b0b",
    color: "#fff",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 16px",
    borderBottom: "1px solid #222",
  },
  title: { fontSize: 20, fontWeight: 700, letterSpacing: "-0.5px" },
  modeBtn: {
    padding: "6px 12px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
  },
  chat: {
    flex: 1,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    overflowY: "auto",
  },
  onboarding: {
    textAlign: "center",
    maxWidth: 420,
    margin: "auto",
    paddingTop: 60,
  },
  message: {
    maxWidth: "75%",
    padding: "12px 16px",
    borderRadius: 12,
    lineHeight: 1.45,
  },
  quickStart: {
    display: "block",
    width: "100%",
    textAlign: "left",
    padding: "12px 16px",
    marginBottom: 8,
    background: "#1a1a1a",
    border: "1px solid #333",
    borderRadius: 8,
    cursor: "pointer",
    color: "#fff",
  },
  inputBox: {
    display: "flex",
    padding: 12,
    borderTop: "1px solid #222",
    gap: 8,
  },
  input: {
    flex: 1,
    padding: "14px 16px",
    background: "#111",
    border: "1px solid #333",
    color: "#fff",
    borderRadius: 10,
    fontSize: 16,
  },
  button: {
    padding: "0 20px",
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 18,
  },
};