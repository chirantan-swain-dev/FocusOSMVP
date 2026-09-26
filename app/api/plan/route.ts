import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GROQ_API_KEY is not configured in Vercel." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const goal = typeof body?.goal === "string" ? body.goal.trim() : "";
  const days = Math.min(90, Math.max(1, Number(body?.days) || 7));
  if (!goal) return NextResponse.json({ error: "Goal is required." }, { status: 400 });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are FocusOS, an ADHD-friendly planning assistant. Turn a goal into a realistic short plan. Create 2 to 5 milestones, each with 1 to 4 concrete tasks. Keep tasks independently actionable, small, specific, and sequential. Avoid vague tasks. Estimate each task in 5 to 90 minutes. Spread the work across the requested number of days without inventing exact calendar dates. Return ONLY valid JSON: {milestones:[{title:string,tasks:[{title:string,minutes:number,priority:"Low"|"Medium"|"High"}]}]}.",
        },
        {
          role: "user",
          content: `Goal: ${goal}\nAvailable timeframe: ${days} days.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    return NextResponse.json({ error: `Groq request failed: ${detail?.error?.message || "request rejected."}` }, { status: 502 });
  }

  const data = await response.json();
  const raw = data.choices?.[0]?.message?.content || "";

  try {
    const parsed = JSON.parse(raw);
    const milestones = Array.isArray(parsed.milestones)
      ? parsed.milestones.slice(0, 5).map((milestone: any) => ({
          title: typeof milestone?.title === "string" ? milestone.title.trim() : "",
          tasks: Array.isArray(milestone?.tasks)
            ? milestone.tasks.slice(0, 4).map((task: any) => ({
                title: typeof task?.title === "string" ? task.title.trim() : "",
                minutes: Math.min(90, Math.max(5, Number(task?.minutes) || 15)),
                priority: ["Low", "Medium", "High"].includes(task?.priority) ? task.priority : "Medium",
              })).filter((task: any) => task.title)
            : [],
        })).filter((milestone: any) => milestone.title && milestone.tasks.length)
      : [];

    if (!milestones.length) throw new Error("No plan returned.");
    return NextResponse.json({ milestones });
  } catch {
    return NextResponse.json({ error: "The AI returned an invalid plan." }, { status: 502 });
  }
}
