import { prisma } from "@/lib/prisma";

export type RateLimitResult = { ok: boolean; retryAfterSec?: number };

/**
 * Fixed-window rate limiter backed by the shared RateLimit table so limits
 * persist across serverless invocations. Fails open on infrastructure errors
 * so a database hiccup never takes the product down.
 */
export async function consumeRateLimit(
  key: string,
  max: number,
  windowSec: number
): Promise<RateLimitResult> {
  const now = Date.now();
  try {
    const row = await prisma.rateLimit.findUnique({ where: { key } });
    const windowExpired = !row || row.lastRequest < now - windowSec * 1000;

    if (windowExpired) {
      await prisma.rateLimit.upsert({
        where: { key },
        update: { count: 1, lastRequest: now },
        create: { key, count: 1, lastRequest: now },
      });
      return { ok: true };
    }

    if (row.count >= max) {
      return {
        ok: false,
        retryAfterSec: Math.max(1, Math.ceil((row.lastRequest + windowSec * 1000 - now) / 1000)),
      };
    }

    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 }, lastRequest: now },
    });
    return { ok: true };
  } catch (error) {
    console.error("[ratelimit] store unavailable, failing open:", error);
    return { ok: true };
  }
}

export async function getClientIp(): Promise<string> {
  try {
    const { headers } = await import("next/headers");
    const forwarded = (await headers()).get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0].trim();
    return "unknown";
  } catch {
    return "unknown";
  }
}
