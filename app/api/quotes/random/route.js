import { NextResponse } from "next/server";

const FALLBACK_QUOTES = {
  motivational: [
    { quote: "Discipline beats motivation.", author: "Unknown" },
    { quote: "Small progress is still progress.", author: "Unknown" },
    { quote: "You do not need to be extreme, just consistent.", author: "Unknown" },
  ],
  reflective: [
    { quote: "Quiet growth is still growth.", author: "Unknown" },
    { quote: "Rest is part of the journey, not a break from it.", author: "Unknown" },
    { quote: "What you water today becomes tomorrow’s peace.", author: "Unknown" },
  ],
  celebratory: [
    { quote: "Great job. Completed tasks are promises kept to yourself.", author: "Unknown" },
    { quote: "Done is beautiful. Celebrate your consistency.", author: "Unknown" },
    { quote: "Momentum is built one completed task at a time.", author: "Unknown" },
  ],
};

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function toneFromTime(time, completed) {
  if (completed) return "celebratory";
  if (time === "evening" || time === "night") return "reflective";
  return "motivational";
}

function fallbackResponse(tone) {
  const item = randomFrom(FALLBACK_QUOTES[tone] || FALLBACK_QUOTES.motivational);
  return {
    quote: item.quote,
    author: item.author,
    tone,
    source: "fallback",
    fetchedAt: new Date().toISOString(),
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const time = String(searchParams.get("time") || "morning").toLowerCase();
  const completed = searchParams.get("completed") === "1";
  const tone = toneFromTime(time, completed);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4500);

    const response = await fetch("https://zenquotes.io/api/random", {
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(fallbackResponse(tone), { status: 200 });
    }

    const data = await response.json();
    const first = Array.isArray(data) ? data[0] : null;
    const quote = first?.q || first?.quote;
    const author = first?.a || first?.author || "Unknown";

    if (!quote) {
      return NextResponse.json(fallbackResponse(tone), { status: 200 });
    }

    return NextResponse.json(
      {
        quote,
        author,
        tone,
        source: "zenquotes",
        fetchedAt: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(fallbackResponse(tone), { status: 200 });
  }
}
