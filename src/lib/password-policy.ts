import { APIError, createAuthMiddleware } from "better-auth/api";
import type { BetterAuthPlugin } from "better-auth";
import { passwordMeetsPolicy } from "@/lib/password-rules";

export function passwordPolicy() {
  return {
    id: "password-policy",
    hooks: {
      before: [
        {
          matcher: (context: { path?: string }) => context.path === "/sign-up/email",
          handler: createAuthMiddleware(async (ctx) => {
            const password = (ctx.body as { password?: unknown } | undefined)?.password;
            if (typeof password === "string" && !passwordMeetsPolicy(password)) {
              throw new APIError("BAD_REQUEST", {
                message:
                  "Password must be at least 8 characters and include a letter, a number, and a special character.",
              });
            }
          }),
        },
      ],
    },
  } satisfies BetterAuthPlugin;
}
