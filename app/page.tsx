"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState("sharp");
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
  }, [messages]);

  useEffect(() => {
    const style = document.createElement("style");

    style.innerHTML = `
      * {
        box-sizing: border-box;
      }

      html, body {
        margin: 0;
        padding: 0;
        background: #050505;
        overflow: hidden;
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(8px);
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
          model: "free",
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
      {!isMobile && (
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
        </div>
      )}

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

          <button
            style={styles.premiumBtn}
            onClick={() => {
              alert("Premium is limited while Mirrored evolves.");
            }}
          >
            Premium ✨
          </button>
        </div>

        <div style={styles.chatArea}>
          {showOnboarding && messages.length === 0 ? (
            <div style={styles.onboarding}>
              <div style={styles.heroGlow} />

              <div style={styles.heroSmall}>Mirrored</div>

              <h1
                style={{
                  ...styles.heroTitle,
                  fontSize: isMobile ? 36 : 58,
                }}
              >
                Say what’s been sitting in your head.
              </h1>

              <p
                style={{
                  ...styles.heroText,
                  fontSize: isMobile ? 18 : 22,
                }}
              >
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
                    maxWidth: isMobile ? "88%" : "70%",
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
    height: "100dvh",
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
    fontWeight: 600,
  },

  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },

  topBar: {
    padding: "14px 18px",
    borderBottom: "1px solid #1b1b1b",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "rgba(5,5,5,0.9)",
    backdropFilter: "blur(10px)",
  },

  modeSwitcher: {
    display: "flex",
    gap: 8,
  },

  modeBtn: {
    padding: "9px 14px",
    borderRadius: 10,
    border: "1px solid #252525",
    background: "#0f0f0f",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
  },

  activeMode: {
    background: "#fff",
    color: "#000",
  },

  premiumBtn: {
    padding: "9px 14px",
    borderRadius: 10,
    border: "1px solid #252525",
    background: "#0f0f0f",
    color: "#fff",
    cursor: "pointer",
    fontSize: 14,
  },

  chatArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 18,
    overflowY: "auto",
    padding: "24px 18px",
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
    padding: "0 10px",
  },

  heroGlow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.03)",
    filter: "blur(100px)",
    zIndex: 0,
  },

  heroSmall: {
    fontSize: 13,
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.45,
    marginBottom: 22,
    position: "relative",
    zIndex: 2,
  },

  heroTitle: {
    lineHeight: 1.05,
    letterSpacing: "-2px",
    fontWeight: 700,
    marginBottom: 18,
    position: "relative",
    zIndex: 2,
  },

  heroText: {
    opacity: 0.92,
    marginBottom: 12,
    position: "relative",
    zIndex: 2,
  },

  heroSubtext: {
    fontSize: 14,
    opacity: 0.42,
    marginBottom: 36,
    position: "relative",
    zIndex: 2,
    lineHeight: 1.5,
  },

  primaryBtn: {
    padding: "14px 28px",
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
    padding: "16px 18px",
    borderRadius: 18,
    lineHeight: 1.7,
    fontSize: 15.5,
    animation: "fadeUp 0.18s ease",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
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
    gap: 12,
    padding: "16px",
    paddingBottom: "calc(16px + env(safe-area-inset-bottom))",
    borderTop: "1px solid #1b1b1b",
    background: "#050505",
  },

  input: {
    flex: 1,
    padding: "16px 18px",
    background: "#101010",
    border: "1px solid #262626",
    borderRadius: 16,
    color: "#fff",
    fontSize: 16,
    outline: "none",
  },

  sendBtn: {
    width: 54,
    height: 54,
    borderRadius: 16,
    border: "none",
    background: "#fff",
    color: "#000",
    fontSize: 22,
    cursor: "pointer",
    flexShrink: 0,
  },
};
