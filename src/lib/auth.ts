import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Estendendo os tipos de sessão
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      cityIds: string[];
    } & DefaultSession["user"]
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          // Fetch user via Prisma (single DB stack)
          const user = await prisma.user.findFirst({
            where: { email: { contains: credentials.email.trim(), mode: 'insensitive' } },
            select: { id: true, name: true, email: true, password: true, role: true }
          });

          if (!user || !user.password) return null;

          const isPassValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPassValid) return null;

          // Fetch city associations
          const userCities = await prisma.user.findUnique({
            where: { id: user.id },
            select: { cities: { select: { id: true } } }
          });

          const cityIds = userCities?.cities?.map((c) => c.id) ?? [];

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            cityIds,
          };
        } catch (err) {
          console.error("[Auth] Login error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.cityIds = (user as any).cityIds || [];
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.cityIds = (token.cityIds as string[]) || [];
      }
      return session;
    },
  },
};
