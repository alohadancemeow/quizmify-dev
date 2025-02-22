import { prisma } from "@/lib/db";
// import { getAuthSession } from "@/lib/nextauth";
import { quizCreationSchema } from "@/schemas/forms/quiz";
import { NextResponse } from "next/server";
import { z } from "zod";
import axios from "axios";
import { auth } from "../../../../auth";

export async function POST(req: Request, res: Response) {
  const session = await auth();

  console.log("session", session?.user);

  if (!session?.user) {
    return NextResponse.json(
      { error: "You must be logged in to create a game." },
      {
        status: 401,
      }
    );
  }

  try {
    const body = await req.json();
    const { topic, type, amount } = quizCreationSchema.parse(body);

    // create a game
    const game = await prisma.game.create({
      data: {
        gameType: type,
        timeStarted: new Date(),
        userId: session.user.id,
        topic,
      },
    });

    // increment the topic count
    await prisma.topic_count.upsert({
      where: {
        topic,
      },
      create: {
        topic,
        count: 1,
      },
      update: {
        count: {
          increment: 1,
        },
      },
    });

    console.log("before axios call");

    // get questions
    const { data } = await axios.post(
      `${
        (process.env.API_URL as string) || "http://localhost:3000"
      }/api/questions`,
      {
        amount,
        topic,
        type,
        userId: session.user.id,
      }
      // {
      //   headers: {
      //     Cookie: req.headers.get("cookie") || "", // Forward cookies
      //   },
      // }
    );

    console.log("after axios call");
    console.log("data", data);

    // create questions
    // if (type === "mcq") {
    //   type mcqQuestion = {
    //     question: string;
    //     answer: string;
    //     option1: string;
    //     option2: string;
    //     option3: string;
    //   };

    //   const manyData = data.questions.map((question: mcqQuestion) => {
    //     // mix up the options lol
    //     const options = [
    //       question.option1,
    //       question.option2,
    //       question.option3,
    //       question.answer,
    //     ].sort(() => Math.random() - 0.5);
    //     return {
    //       question: question.question,
    //       answer: question.answer,
    //       options: JSON.stringify(options),
    //       gameId: game.id,
    //       questionType: "mcq",
    //     };
    //   });

    //   await prisma.question.createMany({
    //     data: manyData,
    //   });
    // } else if (type === "open_ended") {
    //   type openQuestion = {
    //     question: string;
    //     answer: string;
    //   };
    //   await prisma.question.createMany({
    //     data: data.questions.map((question: openQuestion) => {
    //       return {
    //         question: question.question,
    //         answer: question.answer,
    //         gameId: game.id,
    //         questionType: "open_ended",
    //       };
    //     }),
    //   });
    // }

    return NextResponse.json({ gameId: game.id }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues },
        {
          status: 400,
        }
      );
    } else {
      console.log("create game error", error);

      return NextResponse.json(
        { error: "An unexpected error occurred. while creating game" },
        {
          status: 500,
        }
      );
    }
  }
}

export async function GET(req: Request, res: Response) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in to create a game." },
        {
          status: 401,
        }
      );
    }
    const url = new URL(req.url);
    const gameId = url.searchParams.get("gameId");
    if (!gameId) {
      return NextResponse.json(
        { error: "You must provide a game id." },
        {
          status: 400,
        }
      );
    }

    const game = await prisma.game.findUnique({
      where: {
        id: gameId,
      },
      include: {
        questions: true,
      },
    });
    if (!game) {
      return NextResponse.json(
        { error: "Game not found." },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      { game },
      {
        status: 400,
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      {
        status: 500,
      }
    );
  }
}
