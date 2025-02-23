import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

interface GenerateQuestionsParams {
  amount: number;
  topic: string;
  type: string;
}

export const generateQuestions = async ({
  amount,
  topic,
  type,
}: GenerateQuestionsParams) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

  const response = await model.generateContent(prompt);

  let textResponse = response.response.text();
  //   console.log(textResponse, "Raw Response");

  // Remove Markdown code block formatting (if present)
  textResponse = textResponse.replace(/```json|```/g, "").trim();

  // Parse Gemini response to JSON
  let questions;
  try {
    questions = JSON.parse(textResponse);
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
  }

  //   console.log("Generated Questions:", questions);

  return questions;
};
