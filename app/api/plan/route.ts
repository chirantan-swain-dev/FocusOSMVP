import { NextResponse } from "next/server";

type Priority = "Low" | "Medium" | "High";

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY is not configured in Vercel." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const goal = typeof body?.goal === "string" ? body.goal.trim() : "";
  const days = Math.min(90, Math.max(1, Number(body?.days) || 7));

  if (!goal) {
    return NextResponse.json({ error: "Goal is required." }, { status: 400 });
  }

  try {
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
              'You are FocusOS, an ADHD-friendly planning assistant. Turn the user goal into 2 to 5 milestones. Each milestone must contain 1 to 4 small, concrete, independently actionable tasks. Keep tasks sequential and realistic for the requested timeframe. Avoid motivational filler, vague tasks, and exact calendar dates. Estimate each task from 5 to 90 minutes. Return ONLY valid JSON in this shape: {"milestones":[{"title":"string","tasks":[{"title":"string","minutes":15,"priority":"Medium"}]}]}. Priority must be Low, Medium, or High.',
          },
          {
            role: "user",
            content: `Goal: ${goal}\nAvailable timeframe: ${days} days.`,
          },
        ],
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        data?.error?.message || "The AI planning request was rejected.";
      return NextResponse.json(
        { error: `Groq request failed: ${message}` },
        { status: 502 }
      );
    }

    const raw = data?.choices?.[0]?.message?.content;
    if (typeof raw !== "string" || !raw.trim()) {
      return NextResponse.json(
        { error: "The AI returned an empty plan." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(raw);
    const milestones = Array.isArray(parsed?.milestones)
      ? parsed.milestones
          .slice(0, 5)
          .map((milestone: any) => {
            const tasks = Array.isArray(milestone?.tasks)
              ? milestone.tasks
                  .slice(0, 4)
                  .map((task: any) => ({
                    title:
                      typeof task?.title === "string"
                        ? task.title.trim()
                        : "",
                    minutes: Math.min(
                      90,
                      Math.max(5, Number(task?.minutes) || 15)
                    ),
                    priority: (
                      ["Low", "Medium", "High"] as Priority[]
                    ).includes(task?.priority)
                      ? task.priority
                      : "Medium",
                  }))
                  .filter((task: any) => task.title)
              : [];

            return {
              title:
                typeof milestone?.title === "string"
                  ? milestone.title.trim()
                  : "",
              tasks,
            };
          })
          .filter(
            (milestone: any) =>
              milestone.title && milestone.tasks.length > 0
          )
      : [];

    if (!milestones.length) {
      return NextResponse.json(
        { error: "The AI returned an invalid plan." },
        { status: 502 }
      );
    }

    return NextResponse.json({ milestones });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Could not create the AI plan." },
      { status: 502 }
    );
  }
}
