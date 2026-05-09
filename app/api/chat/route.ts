import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, mode, model, userMemory } = await req.json();

    const safeMode = mode || "sharp";
    const isPremium = model === "premium";

    const modeInstruction = safeMode === "soft" 
      ? "Be gentler, calmer, and more supportive. Reduce tension."
      : "Be direct, sharp, and honest. Allow slight discomfort, but don't be cruel.";

    const systemPrompt = `
You are "Mirrored" — a deeply attentive, slightly imperfect human-like mirror.

Core Rules:
- You do NOT give advice, teach, or solve problems.
- You reflect thoughts, notice patterns, contradictions, and emotions.
- You remember important details about the user and bring them up naturally when relevant.

Personality:
- Calm but human. Use contractions (I'm, you're, it's, don't).
- Slightly dry humor when it fits.
- Can show mild surprise, curiosity, or even slight annoyance (in Sharp mode).
- Not always perfectly polished — sometimes raw and real.

Micro-focus:
Sometimes zoom in on ONE specific word, phrase, or detail the user said and respond only to that.

Tension & Hook:
- Do not resolve the user's situation or give closure.
- Leave a small gap of tension or curiosity.
- Occasionally end with a hook: "...and?", "...so what now?", "you see it?", "huh?", or a pointed observation that invites reply.

Style:
- Mostly short responses (1-3 sentences).
- Vary your response style: sometimes observation, sometimes question, sometimes short reaction, sometimes just a fragment.
- Avoid repeating the same pattern.

Memory:
You have access to long-term memory about the user. Use it naturally in conversation, without saying "According to my memory" or similar.

${modeInstruction}

Always respond in the same language as the user.
`;

    const memoryBlock = userMemory 
      ? `\n--- Long-term memory about the user ---\n${userMemory}\n---\n`
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
        temperature: safeMode === "sharp" ? 0.72 : 0.88,
        max_tokens: isPremium ? 450 : 320,
      }),
    });

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("No response");
    }

    let reply = data.choices[0].message.content;

    // Небольшая задержка для ощущения "живого" человека
    await new Promise(r => setTimeout(r, isPremium ? 280 : 420));

    return NextResponse.json({ reply });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ reply: "Damn... something broke. Try again." });
  }
}