import { AuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";

declare module "next-auth" {
  interface Profile {
    id?: string;
  }
}

export const authOptions: AuthOptions = {
  debug: true, // Enable detailed logging
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: "MPRS"
  }),
  callbacks: {
    async signIn({ profile, user }) {
      if (profile?.id) {
        user.discordId = profile.id;
        user.characterName = null;
        user.cid = null;
      }
      return true;
    },
    async session({ session, user }) {
      session.user = {
        id: user.id,
        discordId: user.discordId,
        characterName: user.characterName || null,
        cid: user.cid || null,
        role: user.role || "pending",
        isApproved: user.isApproved || false,
      };
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        // Ensure we pass all user data to the token
        token.id = user.id;
        token.discordId = user.discordId;
        token.characterName = user.characterName;
        token.cid = user.cid;
        token.role = user.role;
        token.isApproved = user.isApproved;
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to update-profile after initial sign in
      if (url.includes("/signin") || url.includes("/callback")) {
        const response = await fetch(`${baseUrl}/api/auth/session`);
        const data = await response.json();
        
        if (data?.user) {
          const { characterName, cid } = data.user;
          
          if (!characterName || !cid) {
            return `${baseUrl}/update-profile`;
          }
        }
      }
      
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },
  pages: {
    "signIn": "/login",
  },
};
