import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";

async function generateUsername(email: string): Promise<string> {
  const base =
    email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "user";

  let username = base;
  let i = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${i}`;
    i++;
  }
  return username;
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (!user.email) return;
          const username = await generateUsername(user.email);
          return { data: { username } };
        },
      },
    },
  },
  advanced: {
    database: {
      joins: true,
    },
  },
  plugins: [nextCookies()],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});