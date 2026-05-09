
"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("sharp");
  const [model, setModel] = useState("free");
  const [showOnboarding, setShowOnboarding] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(6px);
        }
        to {
          opacity: 1;
          transform: translateY(0px);
        }
      }

      @keyframes pulse {
        0% { opacity: 0.25; }
        50% { opacity: 0.55; }
        100% { opacity: 0.25; }
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: input,
    };

    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);
    setShowOnboarding(false);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: updatedMessages,
          mode,
          model,
        }),
      });

      const data = await response.json();

      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: data.reply,
        },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <div style={styles.logo}>Mirrored</div>

        <button
          style={styles.newChatBtn}
          onClick={() => {
            setMessages([]);
            setShowOnboarding(true);
          }}
        >
          New reflection
        </button>

        <div style={styles.conversationItem}>New Conversation</div>

      </div>

      <div style={styles.main}>
        <div style={styles.topBar}>
          <div style={styles.modeSwitcher}>
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
          </div>

          <div style={styles.modeSwitcher}>
            <button
  style={{
    ...styles.modeBtn,
    ...(model === "premium" ? styles.activeMode : {}),
  }}
  onClick={() => {
    alert(
      "Premium is limited while Mirrored evolves."
    );
  }}
>
  Premium ✨
</button>
          </div>
        </div>

        <div style={styles.chatArea}>
          {showOnboarding && messages.length === 0 ? (
            <div style={styles.onboarding}>
              <div style={styles.heroGlow} />

              <div style={styles.heroSmall}>Mirrored</div>

              <h1 style={styles.heroTitle}>
                Say what’s been sitting in your head.
              </h1>

              <p style={styles.heroText}>
                I’ll reflect it back.
              </p>

              <p style={styles.heroSubtext}>
                Not advice. Not therapy. Just reflection.
              </p>

              <button
                onClick={() => setShowOnboarding(false)}
                style={styles.primaryBtn}
              >
                Enter
              </button>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
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
                        ? "#161616"
                        : "#0f0f0f",
                    border:
                      message.role === "assistant"
                        ? "1px solid #1f1f1f"
                        : "none",
                  }}
                >
                  {message.content}
                </div>
              ))}

              {isLoading && (
                <div style={styles.loading}>reflecting...</div>
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
    height: "100vh",
    background: "#050505",
    color: "#fff",
    fontFamily: "Inter, system-ui, sans-serif",
  },

  sidebar: {
    width: 270,
    borderRight: "1px solid #1b1b1b",
    display: "flex",
    flexDirection: "column",
    background: "#090909",
    padding: 16,
  },

  logo: {
    fontSize: 34,
    fontWeight: 700,
    marginBottom: 18,
  },

  newChatBtn: {
    padding: "14px 18px",
    borderRadius: 14,
    border: "none",
    background: "#fff",
    color: "#000",
    cursor: "pointer",
    marginBottom: 20,
    fontWeight: 600,
  },

  conversationItem: {
    padding: "14px 16px",
    borderRadius: 12,
    background: "#121212",
    color: "#fff",
  },

  

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  topBar: {
    padding: "14px 24px",
    borderBottom: "1px solid #1b1b1b",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    backdropFilter: "blur(10px)",
  },

  modeSwitcher: {
    display: "flex",
    gap: 8,
  },

  modeBtn: {
    padding: "10px 16px",
    borderRadius: 10,
    border: "1px solid #252525",
    background: "#0f0f0f",
    color: "#fff",
    cursor: "pointer",
  },

  activeMode: {
    background: "#fff",
    color: "#000",
  },

  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    overflowY: "auto",
    padding: 28,
  },

  onboarding: {
    margin: "auto",
    textAlign: "center",
    maxWidth: 720,
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },

  heroGlow: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.03)",
    filter: "blur(120px)",
    zIndex: 0,
  },

  heroSmall: {
    fontSize: 14,
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.5,
    marginBottom: 24,
    position: "relative",
    zIndex: 2,
  },

  heroTitle: {
    fontSize: 58,
    lineHeight: 1.05,
    letterSpacing: "-2px",
    fontWeight: 700,
    marginBottom: 20,
    position: "relative",
    zIndex: 2,
  },

  heroText: {
    fontSize: 22,
    opacity: 0.92,
    marginBottom: 12,
    position: "relative",
    zIndex: 2,
  },

  heroSubtext: {
    fontSize: 15,
    opacity: 0.42,
    marginBottom: 42,
    position: "relative",
    zIndex: 2,
  },

  primaryBtn: {
    padding: "14px 30px",
    borderRadius: 14,
    border: "none",
    background: "#fff",
    color: "#000",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 15,
    position: "relative",
    zIndex: 2,
  },

  message: {
    maxWidth: "70%",
    padding: "16px 20px",
    borderRadius: 18,
    lineHeight: 1.7,
    fontSize: 15.5,
    animation: "fadeUp 0.18s ease",
    whiteSpace: "pre-wrap",
  },

  loading: {
    alignSelf: "flex-start",
    padding: "10px 16px",
    opacity: 0.38,
    fontStyle: "italic",
    animation: "pulse 1.6s infinite",
  },

  inputArea: {
    display: "flex",
    gap: 14,
    padding: 24,
    borderTop: "1px solid #1b1b1b",
  },

  input: {
    flex: 1,
    padding: "17px 20px",
    background: "#101010",
    border: "1px solid #262626",
    borderRadius: 16,
    color: "#fff",
    fontSize: 15.5,
    outline: "none",
    transition: "0.2s",
  },

  sendBtn: {
    width: 56,
    height: 56,
    borderRadius: 16,
    border: "none",
    background: "#fff",
    color: "#000",
    fontSize: 22,
    cursor: "pointer",
    transition: "0.2s",
  },
};
