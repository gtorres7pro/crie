import { NextAuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

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
  adapter: PrismaAdapter(prisma) as any,
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
        const fs = require('fs');
        const log = (msg: string) => {
          try {
            fs.appendFileSync('/tmp/auth_debug.log', `[${new Date().toISOString()}] ${msg}\n`);
          } catch (e) {}
        };

        log(`Login attempt for: ${credentials?.email}`);
        if (!credentials?.email || !credentials?.password) {
          log('Missing email or password');
          return null;
        }

        try {
          const user = await prisma.user.findFirst({
            where: { 
              email: {
                equals: credentials.email.trim(),
                mode: 'insensitive'
              }
            },
            include: { cities: true }
          });

          log(`User found in DB: ${!!user}`);
          if (!user) {
            log(`Email not found: ${credentials.email.trim()}`);
            return null;
          }

          const isPassValid = await bcrypt.compare(credentials.password, user.password);
          log(`Password valid: ${isPassValid}`);

          if (!isPassValid) {
            log(`Password mismatch for: ${credentials.email}`);
            return null;
          }

          log(`Success login for: ${user.email}`);
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            cityIds: user.cities.map(c => c.id)
          };
        } catch (err: any) {
          log(`AUTH ERROR: ${err.message}`);
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
