export const dynamic = "force-dynamic"; // for Next.js Edge runtime (optional)

export async function POST(req: Request) {
  const { prompt } = await req.json();

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyApQcY06qqFCjj6yzJwgogJP9RV46PA158",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const result = await response.json();
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

  const questions = text
    .split("\n")
    .filter((line: string) => line.trim().length > 0);

  return Response.json({ questions });
}
