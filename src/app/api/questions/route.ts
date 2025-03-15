import { getQuestionsSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: Request) {
  const body = await req.json();

  if (!body?.userId) {
    return NextResponse.json(
      { error: "You must be logged in to create questions." },
      {
        status: 401,
      }
    );
  }

  try {
    const { amount, topic, type } = getQuestionsSchema.parse(body);

    // Structured prompt to enforce JSON output
    const prompt = `
      Generate ${amount} multiple-choice questions about ${topic}.
      Return the response in a JSON array format where each object follows this structure:
        {
          "question": "question text",
          "answer": "correct answer (max 15 words)",
          "option1": "wrong option 1 (max 15 words)",
          "option2": "wrong option 2 (max 15 words)",
          "option3": "wrong option 3 (max 15 words)"
        }
      Ensure all fields are within the word limits.
`;

    const { text } = await generateText({
      model: google("models/gemini-2.0-flash-exp"),
      prompt: prompt,
    });

    // Remove Markdown code block formatting (if present)
    const finalText = text.replace(/```json|```/g, "").trim();
    console.log("Final Text:", finalText);

    // Parse Gemini response to JSON
    let questions;
    try {
      questions = JSON.parse(finalText);
    } catch (error) {
      console.error("Error parsing Gemini response:", error);
    }

    return NextResponse.json({ questions }, { status: 200 });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: error.issues },
        {
          status: 400,
        }
      );
    } else {
      console.log("Error in question generation:", error.message);
      return NextResponse.json(
        { error: "An unexpected error occurred. while creating questions" },
        {
          status: 500,
        }
      );
    }
  }
}
