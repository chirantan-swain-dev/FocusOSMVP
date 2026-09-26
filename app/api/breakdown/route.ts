import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY is not configured in Vercel." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  if (!title) return NextResponse.json({ error: "Task title is required." }, { status: 400 });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are FocusOS, an ADHD-friendly productivity assistant. Break a vague task into 3 to 7 concrete, independently actionable steps. Keep steps small, specific, sequential, and realistic. Do not add motivational filler. Return ONLY valid JSON with this shape: {steps:[{title:string,minutes:10}]}. Minutes must be an integer from 5 to 60.",
        },
        {
          role: "user",
          content: `Break down this task: ${title}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    const message = detail?.error?.message || "Groq request failed.";
    return NextResponse.json(
      { error: `Groq request failed: ${message}`, status: response.status },
      { status: 502 }
    );
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "";

  try {
    const parsed = JSON.parse(raw);
    const steps = Array.isArray(parsed.steps)
      ? parsed.steps
          .filter((step: any) => typeof step?.title === "string")
          .slice(0, 7)
          .map((step: any) => ({
            title: step.title.trim(),
            minutes: Math.min(60, Math.max(5, Number(step.minutes) || 10)),
          }))
          .filter((step: any) => step.title)
      : [];

    if (!steps.length) throw new Error("No steps returned.");
    return NextResponse.json({ steps });
  } catch {
    return NextResponse.json({ error: "The AI returned an invalid breakdown." }, { status: 502 });
  }
}
