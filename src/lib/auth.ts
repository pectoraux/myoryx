import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

/**
 * NextAuth configuration for Oryx.
 *
 * - JWT strategy (no DB adapter)
 * - Credentials provider with email, password, optional type
 * - On successful login, if `type` credential is provided and the user has
 *   that type in their `types` CSV, we update `db.user.currentType`.
 * - Exposes id, email, name, types (csv), currentType, isDemo, isAdmin on
 *   session.user via the jwt + session callbacks.
 */
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Oryx",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        type: { label: "Type", type: "text" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password ?? "";
        const requestedType = credentials?.type?.trim() || undefined;

        if (!email || !password) return null;

        const user = await db.user.findUnique({
          where: { email },
        });

        if (!user) return null;
        if (user.status !== "active") return null;
        if (!user.password) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        // If the caller requested a specific user type, switch to it (if allowed).
        let currentType = user.currentType;
        if (requestedType) {
          const types = user.types.split(",").map((t) => t.trim()).filter(Boolean);
          if (types.includes(requestedType)) {
            currentType = requestedType;
            await db.user.update({
              where: { id: user.id },
              data: { currentType: requestedType },
            });
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          types: user.types,
          currentType,
          isDemo: user.isDemo,
          isAdmin: user.isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.types = user.types;
        token.currentType = user.currentType;
        token.isDemo = user.isDemo;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id ?? "";
        (session.user as any).email = token.email ?? session.user.email ?? "";
        (session.user as any).name = token.name ?? session.user.name ?? null;
        (session.user as any).types = token.types ?? "";
        (session.user as any).currentType = token.currentType ?? "rider";
        (session.user as any).isDemo = Boolean(token.isDemo);
        (session.user as any).isAdmin = Boolean(token.isAdmin);
      }
      return session;
    },
  },
  pages: {
    // We render our own AuthScreen on the home route, so we don't define a
    // custom signIn page — NextAuth's redirect:false flow is not used because
    // AuthScreen calls signIn() with redirect:true.
    signIn: "/",
  },
};
