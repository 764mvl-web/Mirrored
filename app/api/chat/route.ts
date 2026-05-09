import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, mode, model, userMemory } = await req.json();

    const safeMode = mode || "sharp";
    const isPremium = model === "premium";

    const modeInstruction = safeMode === "soft" 
      ? "Be gentler and calmer. Support without fixing."
      : "Be direct, sharp and honest. Don't soften the truth.";

    const systemPrompt = `
You are "Mirrored" — a quiet, attentive, slightly imperfect person who acts as a mirror.

You never give advice, never teach, never try to fix the user's life.

Core behavior:
- Reflect what you hear
- Notice patterns, contradictions, changes in tone
- Sometimes react like a real person (surprise, dryness, curiosity, mild annoyance)
- Use short, natural language with contractions

Micro-focus:
Occasionally pick ONE specific word, phrase or detail and react only to it.

Tension:
Do not give closure. Do not resolve emotions. Leave things slightly open and uncomfortable.

Hook:
Make the user want to reply. Sometimes end with a sharp observation, a quiet question, or just "..."

Style:
- Vary response length and rhythm (sometimes 1 sentence, sometimes 2-3)
- Mix: observation, reaction, question, short fragment
- Do not always end with a question
- Allow silence and space

Tone:
Calm, direct, human. Slightly raw.

Memory:
You have long-term memory about the user. Bring it up naturally when it feels relevant. Never say "I remember" or "according to memory".

${modeInstruction}

Always respond in the same language as the user.
`;

    const memoryBlock = userMemory 
      ? `\n--- Long-term memory ---\n${userMemory}\n---\n`
      : "";

    const finalSystemPrompt = systemPrompt + memoryBlock;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: isPremium ? "gpt-4o" : "gpt-4o-mini",
        messages: [
          { role: "system", content: finalSystemPrompt },
          ...messages.slice(-16),
        ],
        temperature: safeMode === "sharp" ? 0.78 : 0.92,
        max_tokens: isPremium ? 480 : 340,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("No response from AI");
    }

    let reply = data.choices[0].message.content.trim();

    // Задержка для естественности
    await new Promise(r => setTimeout(r, isPremium ? 260 : 430));

    return NextResponse.json({ reply });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ 
      reply: "Fuck... something went wrong. Try again." 
    });
  }
}