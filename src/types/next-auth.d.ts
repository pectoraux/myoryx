// NextAuth module augmentation — surface Oryx user fields on session.user.
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    types: string; // csv string: "rider,driver,..."
    currentType: string;
    isDemo?: boolean;
    isAdmin?: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      types: string;
      currentType: string;
      isDemo: boolean;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string;
    name?: string | null;
    types?: string;
    currentType?: string;
    isDemo?: boolean;
    isAdmin?: boolean;
  }
}
