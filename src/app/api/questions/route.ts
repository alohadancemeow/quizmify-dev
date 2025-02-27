import { getQuestionsSchema } from "@/schemas/questions";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { generateQuestions } from "@/lib/gemini";

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
    const questions = await generateQuestions({ amount, topic, type });

    console.log("Generated Questions:", questions);

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
      console.error("Error in question generation:", error);
      return NextResponse.json(
        { error: "An unexpected error occurred. while creating questions" },
        {
          status: 500,
        }
      );
    }
  }
}

// try {
//   const { amount, topic, type } = getQuestionsSchema.parse(body);

//   let questions: any;

//   // create prompt based on type
//   if (type === "open_ended") {
//     questions = await strict_output(
//       "You are a helpful AI that is able to generate a pair of question and answers, the length of each answer should not be more than 15 words, store all the pairs of answers and questions in a JSON array",
//       new Array(amount).fill(
//         `You are to generate a random hard open-ended questions about ${topic}`
//       ),
//       {
//         question: "question",
//         answer: "answer with max length of 15 words",
//       }
//     );
//   } else if (type === "mcq") {
//     console.log("Before strict_output call");

//     questions = await strict_output(
//       "You are a helpful AI that is able to generate mcq questions and answers, the length of each answer should not be more than 15 words, store all answers and questions and options in a JSON array",
//       new Array(amount).fill(
//         `You are to generate a random hard mcq question about ${topic}`
//       ),
//       {
//         question: "question",
//         answer: "answer with max length of 15 words",
//         option1: "option1 with max length of 15 words",
//         option2: "option2 with max length of 15 words",
//         option3: "option3 with max length of 15 words",
//       }
//     );
