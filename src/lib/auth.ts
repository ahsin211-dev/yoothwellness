import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            role: true,
            image: true,
            isActive: true,
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid credentials");
        }

        if (!user.isActive) {
          throw new Error("Account is deactivated. Please contact support.");
        }

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) {
          throw new Error("Invalid credentials");
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        await prisma.activityLog.create({
          data: {
            userId: user.id,
            type: "LOGIN",
            description: "User signed in",
          },
        });
      }
    },
    async signOut(message) {
      // next-auth v5: message may contain `session` or `token` depending on strategy
      const userId =
        "token" in message && message.token
          ? (message.token.id as string | undefined)
          : "session" in message && message.session
          ? (message.session as { userId?: string }).userId
          : undefined;

      if (userId) {
        await prisma.activityLog.create({
          data: {
            userId,
            type: "LOGOUT",
            description: "User signed out",
          },
        });
      }
    },
  },
});
