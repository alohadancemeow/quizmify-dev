import NextAuth from "next-auth";

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import getServerSession, { type DefaultSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/db";

declare module "next-auth" {
  interface JWT {
    id: string;
  }
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    jwt: async ({ token }) => {
      const db_user = await prisma.user.findFirst({
        where: {
          email: token?.email,
        },
      });
      if (db_user) {
        token.id = db_user.id;
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email ?? "";
        session.user.image = token.picture;
      }
      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
});

// export const getAuthSession = () => {
//   return getServerSession(authOptions);
// };
