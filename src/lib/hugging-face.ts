import { HfInference } from "@huggingface/inference";

if (!process.env.HF_API_TOKEN) {
  throw new Error("HF_API_TOKEN is not defined");
}

const hf = new HfInference(process.env.HF_API_TOKEN);

interface GenerateQuestionsParams {
  amount: number;
  topic: string;
  type: string;
}

export const generateQuestions2 = async ({
  amount,
  topic,
  type,
}: GenerateQuestionsParams) => {
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

  try {
    const response = await hf.chatCompletion({
      model: "deepseek-ai/DeepSeek-R1",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      provider: "fireworks-ai",
      max_tokens: 500,
    });

    // console.log(response.choices[0].message);

    let textResponse = response.choices[0].message.content;
    //   console.log(textResponse, "Raw Response");

    // Clean up the response by removing XML-like tags and markdown
    textResponse = textResponse
      ?.replace(/<[^>]*>/g, "") // Remove XML-like tags
      ?.replace(/```json\n|\n```|```/g, "") // Remove markdown
      ?.trim();

    // Find the first { and last } to extract just the JSON part
    const startIndex = textResponse?.indexOf("{");
    const endIndex = textResponse?.lastIndexOf("}");
    if (startIndex !== -1 && endIndex !== -1) {
      textResponse = textResponse?.slice(startIndex, endIndex! + 1);
    }

    // Parse response to JSON
    try {
      const questions = JSON.parse(textResponse!);
      return questions;
    } catch (error) {
      console.error("Error parsing response to JSON:", error);
      throw new Error("Failed to parse response into valid JSON format");
    }
  } catch (error) {
    console.error("Error generating text with T5:", error);
    throw error;
  }

  //   const prompt = `
  //     สร้างคำถามปรนัย ${amount} ข้อเกี่ยวกับ ${topic}
  //     ส่งคำตอบกลับมาในรูปแบบอาร์เรย์ JSON โดยแต่ละอ็อบเจ็กต์มีโครงสร้างดังนี้:
  //     {
  //         "question": "ข้อความคำถาม",
  //         "answer": "คำตอบที่ถูกต้อง (ไม่เกิน 15 คำ)",
  //         "option1": "ตัวเลือกผิด 1 (ไม่เกิน 15 คำ)",
  //         "option2": "ตัวเลือกผิด 2 (ไม่เกิน 15 คำ)",
  //         "option3": "ตัวเลือกผิด 3 (ไม่เกิน 15 คำ)"
  //     }
  // `;

  //   const response = await fetch(
  //     "https://api-inference.huggingface.co/models/google-t5/t5-small",
  //     {
  //       method: "POST",
  //       headers: {
  //         Authorization: `Bearer ${process.env.HF_API_TOKEN}`, // Replace with your HF token
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({ inputs: prompt }),
  //     }
  //   );

  //   const data = await response.json();

  //   if (data.error) {
  //     console.log(data.error);
  //   }

  //   console.log(data[0].generated_text, "data");

  // const response = await model.generateContent(prompt);

  // let textResponse = response.response.text();
  // //   console.log(textResponse, "Raw Response");

  // // Remove Markdown code block formatting (if present)
  // textResponse = textResponse.replace(/```json|```/g, "").trim();

  // // Parse Gemini response to JSON
  // let questions;
  // try {
  //   questions = JSON.parse(textResponse);
  // } catch (error) {
  //   console.error("Error parsing Gemini response:", error);
  // }

  // //   console.log("Generated Questions:", questions);

  // return questions;
};
