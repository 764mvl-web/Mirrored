"use client";

import { useState, useRef, useEffect } from "react";

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"soft" | "sharp">("sharp");

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const sendMessage = async () => {
    if (!input) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: newMessages,
        mode,
      }),
    });

    const data = await res.json();

    setMessages([
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

        {/* MODE SWITCH */}
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

      {/* CHAT */}
      <div style={styles.chat}>
        {messages.map((m, i) => (
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
        ))}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div style={styles.inputBox}>
        <input
          style={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write something..."
        />

        <button style={styles.button} onClick={sendMessage}>
          Send
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
    padding: "12px 16px",
    borderBottom: "1px solid #222",
  },

  title: {
    fontSize: 18,
    fontWeight: 600,
  },

  modeBtn: {
    padding: "6px 10px",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },

  chat: {
    flex: 1,
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    overflowY: "auto",
  },

  message: {
    maxWidth: "70%",
    padding: "10px 14px",
    borderRadius: 12,
    lineHeight: 1.4,
  },

  inputBox: {
    display: "flex",
    padding: 10,
    borderTop: "1px solid #222",
  },

  input: {
    flex: 1,
    padding: 12,
    background: "#111",
    border: "1px solid #222",
    color: "#fff",
    borderRadius: 8,
  },

  button: {
    marginLeft: 10,
    padding: "12px 16px",
    background: "#fff",
    color: "#000",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
};