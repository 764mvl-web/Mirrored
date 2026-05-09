import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages, currentMemory } = await req.json();

    if (!messages || messages.length < 4) {
      return NextResponse.json({ summary: currentMemory || "" });
    }

    const systemPrompt = `
You are an expert at creating concise, high-signal memory summaries for a reflection AI called "Mirrored".

Your task: Create a short, dense long-term memory summary about the user based on the conversation.

Rules:
- Be extremely concise (3-8 sentences max)
- Focus on facts, patterns, contradictions, important statements, emotional themes
- Include key life context, recurring issues, important decisions the user is facing
- Use neutral, factual language
- Do not add advice or interpretations
- If there is previous memory, update it with new information (merge, don't duplicate)

Previous memory:
${currentMemory || "No previous memory."}

Conversation:
${messages.map((m: any) => `${m.role}: ${m.content}`).join("\n")}

Respond with ONLY the updated memory summary. No explanations.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
        ],
        temperature: 0.5,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    let summary = data.choices?.[0]?.message?.content?.trim() || currentMemory || "";

    // Очистка
    summary = summary.replace(/^["']|["']$/g, "");

    return NextResponse.json({ summary });

  } catch (error) {
    console.error("Memory summarize error:", error);
    return NextResponse.json({ 
      summary: "" 
    });
  }
}