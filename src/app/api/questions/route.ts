import { getQuestionsSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";

import path from "path";
import fs from "fs";

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

    const myTopic = [
      "นาม",
      "อาขยาต",
      "กิตก์",
      "สมาส",
      "ตัทธิต",
      "สมัญญาภิธาน",
      "สนธิ",
      "ชื่อสัมพันธ์",
    ];

    // Read the book content
    const bookPath = path.join(
      process.cwd(),
      "src",
      "datasets",
      "palibook-1-5.json"
    );
    const bookContent = JSON.parse(fs.readFileSync(bookPath, "utf-8"));

    // console.log(JSON.stringify(bookContent));

    // Structured prompt to enforce JSON output
    // const prompt = `
    //       Generate ${amount} multiple-choice questions about ${topic} baseed on the given book.
    //       Return the response in a JSON array format where each object follows this structure.
    //       Ensure all fields are within the word limits.
    // `;

    const prompt = `
      Using this book content as reference: ${JSON.stringify(bookContent)}
      
      Generate ${amount} multiple-choice questions about ${myTopic}.
      The questions must be based on the provided book content.
      Each question should test understanding of key concepts from the book.
      
      Return the response in a JSON array format where each object follows this structure.
      Make sure each question and its options are directly related to the book content.
      Ensure all fields are within the word limits.
      Translate all questions, answers, and options to Thai language.
`;

    const { object } = await generateObject({
      model: google("models/gemini-2.0-flash-exp"),
      schema: z.object({
        questions: z.array(
          // z.object({
          //   question: z.string().describe("question text"),
          //   answer: z.string().describe("correct answer (max 15 words)"),
          //   option1: z.string().describe("wrong option 1 (max 15 words)"),
          //   option2: z.string().describe("wrong option 2 (max 15 words)"),
          //   option3: z.string().describe("wrong option 3 (max 15 words)"),
          // })

          z.object({
            question: z
              .string()
              .describe("question text based on the book content"),
            answer: z
              .string()
              .describe("correct answer from the book (max 15 words)"),
            option1: z
              .string()
              .describe("wrong option 1 from the book (max 15 words)"),
            option2: z
              .string()
              .describe("wrong option 2 from the book (max 15 words)"),
            option3: z
              .string()
              .describe("wrong option 3 from the book (max 15 words)"),
          })
        ),
      }),
      prompt,
    });

    console.log(object, "object");

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
