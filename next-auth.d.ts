import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    discordId?: string;
    characterName?: string | null;
    cid?: string | null;
    role?: string;
    isApproved?: boolean;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }

  interface Session {
    user: User;
  }
}
