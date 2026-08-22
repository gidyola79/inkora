import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/prisma";
import { passwordPolicy } from "@/lib/password-policy";
import {
  sendResetPasswordEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "@/lib/email";

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
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    resetPasswordTokenExpiresIn: 3600,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({ to: user.email, name: user.name, url });
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationEmail({ to: user.email, name: user.name, url });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 300, max: 8, storage: "database" },
      "/sign-up/email": { window: 3600, max: 5, storage: "database" },
      "/request-password-reset": { window: 3600, max: 5, storage: "database" },
      "/reset-password": { window: 3600, max: 10, storage: "database" },
    },
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
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
        after: async (user) => {
          if (!user.email) return;
          const username = await prisma.user.findUnique({
            where: { id: user.id },
            select: { username: true },
          });
          await sendWelcomeEmail({
            to: user.email,
            name: user.name,
            username: username?.username,
          });
        },
      },
    },
  },
  advanced: {
    database: {
      joins: true,
    },
  },
  plugins: [nextCookies(), passwordPolicy()],
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});