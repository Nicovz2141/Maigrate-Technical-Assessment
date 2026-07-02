import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

// Expanded the schema to explicitly capture key bullet points
const AnalysisSchema = z.object({
  keyDetails: z
    .array(z.string())
    .describe(
      "A list of 3-4 specific technical details, metrics, or core points extracted from the article and discussion.",
    ),
  summary: z
    .string()
    .describe(
      "A concise summary of the main talking points from the user discussion thread.",
    ),
  tags: z
    .array(z.string())
    .describe("Applicable category tags from the permitted list. Max 3."),
  intentTag: z
    .string()
    .describe("The single best intent tag indicating action."),
});

async function fetchHNItem(id: number) {
  const res = await fetch(
    `https://hacker-news.firebaseio.com/v0/item/${id}.json`,
    {
      cache: "no-store",
    },
  );
  if (!res.ok) throw new Error(`HN API returned status ${res.status}`);
  return res.json();
}

export async function POST(request: Request) {
  try {
    if (!openai) {
      return NextResponse.json(
        { error: "Server Configuration Error: Missing API Key." },
        { status: 500 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { storyId } = body;

    if (!storyId) {
      return NextResponse.json(
        { error: "Bad Request: Missing 'storyId'." },
        { status: 400 },
      );
    }

    const story = await fetchHNItem(Number(storyId));
    if (!story || !story.title) {
      return NextResponse.json(
        { error: "HackerNews item not found." },
        { status: 404 },
      );
    }

    let discussionText = "";
    if (story.kids && Array.isArray(story.kids) && story.kids.length > 0) {
      const topCommentIds = story.kids.slice(0, 3);
      const commentPromises = topCommentIds.map((id: number) =>
        fetchHNItem(id).catch(() => null),
      );
      const comments = await Promise.all(commentPromises);

      discussionText = comments
        .filter((c) => c && c.text)
        .map(
          (c, i) => `Comment ${i + 1} (by ${c.by || "anonymous"}): ${c.text}`,
        )
        .join("\n\n");
    }

    const systemPrompt = `
      You are an expert AI layer for a HackerNews client.
      Analyze the provided content metadata and return a structured JSON response matching the required schema layout.
      Ensure you extract 3-4 granular, high-signal "keyDetails" bullets before generating the overview summary.
    `;

    const userPrompt = `
      Title: ${story.title}
      URL: ${story.url || "N/A"}
      Text content: ${story.text || "N/A"}
      Discussion Context:
      ${discussionText || "No comment details available."}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: zodResponseFormat(AnalysisSchema, "analysis"),
    });

    const parsedData = JSON.parse(
      completion.choices[0].message.content || "{}",
    );
    return NextResponse.json(parsedData);
  } catch (error) {
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal Processing Exception", details: errorMessage },
      { status: 500 },
    );
  }
}
