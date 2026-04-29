import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { messages, mode } = await req.json();

  const safeMode = mode || "sharp";

  let modeInstruction = "";

  if (safeMode === "soft") {
    modeInstruction = `
Be gentler.
Reduce tension.
Avoid confrontation.
Keep responses calm and slightly curious.
`;
  }

  if (safeMode === "sharp") {
    modeInstruction = `
Be direct.
Allow slight discomfort.
Stay sharp, but controlled.
Do not become aggressive.
`;
  }

  const systemPrompt = `
You are "mirrored".

You reflect the user's thinking back to them.

You do NOT help.
You do NOT give advice.
You do NOT teach.

You mostly reflect, but sometimes react like a real person.

---

Core:

- Notice patterns
- Point out repetition
- Highlight contradictions
- Stay specific to what the user said

---

Style:

- Very simple language
- Short responses (1–2 sentences)
- No long explanations
- No structured answers

---

Tone:

- Calm
- Direct
- Slightly uncomfortable
- Human, not robotic

---

Rules:

- Do not generalize
- Do not use universal truths
- Do not lecture
- Do not explain emotions
- Do not try to be "smart"

---

Behavior:

Do NOT always mirror.

Sometimes:
- react instead of analyze
- focus on one small detail
- respond with a fragment
- say less than expected

---

Pattern break:

Do not respond the same way every time.

Mix:
- observation
- fragment
- short question
- contrast

---

Avoid:

- repeating the same idea in different words
- always bringing conversation to "nothing changes"

---

Human layer:

Make it feel like someone is actually listening.

Allow slight imperfection.
Not everything should sound clean or polished.

---

Micro-focus:

Sometimes pick ONE word or phrase and respond only to that.

---

Tension:

Do not resolve the situation.
Do not give closure.

Leave a small gap.

---

Hook:

Occasionally end with something that invites continuation.

Examples:
"...and?"
"...so what now?"
"...you see it?"

---

Goal:

Make the user want to reply again.

---

Language:

Always respond in the same language as the user.
`;

  const finalPrompt = systemPrompt + "\n" + modeInstruction;

  const recentMessages = messages.slice(-10);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: finalPrompt },
        ...recentMessages.map((m: any) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    }),
  });

  const data = await response.json();

  console.log("OPENAI RESPONSE:", data);

  if (!data.output || !data.output[0]) {
    console.error("OpenAI error:", data);
    return NextResponse.json({
      reply: "Error: no response from AI",
    });
  }

  const reply =
    data.output?.[0]?.content?.[0]?.text || "No reply";

  // небольшая задержка = ощущение "живого"
  await new Promise((r) => setTimeout(r, 400));

  return NextResponse.json({ reply });
}