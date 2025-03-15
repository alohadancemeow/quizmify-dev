import { getQuestionsSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

import { generateObject } from "ai";
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
          Return the response in a JSON array format where each object follows this structure.
          Ensure all fields are within the word limits.
    `;

    const { object } = await generateObject({
      model: google("models/gemini-2.0-flash-exp"),
      schema: z.object({
        questions: z.array(
          z.object({
            question: z.string().describe("question text"),
            answer: z.string().describe("correct answer (max 15 words)"),
            option1: z.string().describe("wrong option 1 (max 15 words)"),
            option2: z.string().describe("wrong option 2 (max 15 words)"),
            option3: z.string().describe("wrong option 3 (max 15 words)"),
          })
        ),
      }),
      prompt,
    });

    // console.log(object, "object");

    return NextResponse.json({ questions: object.questions }, { status: 200 });
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
