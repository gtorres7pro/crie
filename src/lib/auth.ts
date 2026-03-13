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
        const { createClient } = require('@supabase/supabase-js');
        const fs = require('fs');
        const log = (msg: string) => {
          try {
            fs.appendFileSync('/tmp/auth_debug.log', `[${new Date().toISOString()}] ${msg}\n`);
          } catch (e) {}
        };

        log(`SUPABASE CLIENT: Login attempt for: ${credentials?.email}`);
        if (!credentials?.email || !credentials?.password) return null;

        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        try {
          // Fetch user
          const { data: user, error: userError } = await supabaseAdmin
            .from('User')
            .select('id, name, email, password, role')
            .ilike('email', credentials.email.trim())
            .single();
          
          if (userError || !user) {
            log(`User not found or error: ${userError?.message || 'Unknown'}`);
            return null;
          }

          const isPassValid = await bcrypt.compare(credentials.password, user.password);
          log(`Password valid: ${isPassValid}`);

          if (!isPassValid) {
            log(`Password mismatch`);
            return null;
          }

          // Fetch cities
          const { data: userCities, error: cityError } = await supabaseAdmin
            .from('_UserCities')
            .select('B')
            .eq('A', user.id);
          
          const cityIds = userCities ? userCities.map((c: any) => c.B) : [];
          log(`User cities found: ${cityIds.join(', ')}`);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            cityIds
          };
        } catch (err: any) {
          log(`AUTH ERROR SUPABASE CLIENT: ${err.message}`);
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
