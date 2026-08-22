import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import {
  ShareCard,
  VARIANTS,
  THEMES,
  chunkContentForPages,
  makeQrDataUrl,
  type VariantKey,
  type ThemeKey,
} from "@/lib/share-card";

export const runtime = "nodejs";

let cachedFonts: { name: string; data: ArrayBuffer; weight: 400 | 700; style: "normal" }[] | null = null;

async function getFonts() {
  if (cachedFonts) return cachedFonts;
  try {
    const [regular, bold] = await Promise.all([
      fetch("https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-400-normal.woff").then((r) => r.arrayBuffer()),
      fetch("https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-700-normal.woff").then((r) => r.arrayBuffer()),
    ]);
    cachedFonts = [
      { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
      { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const },
    ];
    return cachedFonts;
  } catch {
    return [];
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const variantKey = (searchParams.get("variant") as VariantKey) || "portrait";
  const variant = VARIANTS[variantKey] ?? VARIANTS.portrait;
  const theme = (searchParams.get("theme") as ThemeKey) || "light";
  const accentColor = searchParams.get("color") ?? undefined;
  const desiredTotal = Math.max(1, Math.min(4, parseInt(searchParams.get("pages") ?? "0", 10) || 0));
  const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isNaN(pageParam) ? 1 : Math.max(1, pageParam);

  const article = await prisma.article.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      coverImageUrl: true,
      author: { select: { name: true, username: true, image: true } },
    },
  });
  if (!article) return new Response("Not found", { status: 404 });

  const { total: autoTotal } = chunkContentForPages(article as never, 4);
  const totalPages = desiredTotal ? desiredTotal : autoTotal;
  if (page < 1 || page > totalPages) return new Response("Page out of range", { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://inkorablog.vercel.app";
  const qrDataUrl = await makeQrDataUrl(`${appUrl}/articles/${article.slug}`);
  const fonts = await getFonts();

  const element = ShareCard({
    article: article as never,
    page,
    totalPages,
    variant,
    qrDataUrl,
    appUrl,
    theme,
    accentColor,
  }) as unknown as React.ReactElement;

  const res = new ImageResponse(element as never, {
    width: variant.w,
    height: variant.h,
    fonts: fonts.length ? fonts : undefined,
  } as never);

  res.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
  res.headers.set("X-Total-Pages", String(totalPages));
  res.headers.set("Content-Disposition", `inline; filename="inkora-${article.slug}-p${page}.png"`);
  return res;
}

export async function HEAD(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const desiredTotal = Math.max(1, Math.min(4, parseInt(searchParams.get("pages") ?? "0", 10) || 0));
  const article = await prisma.article.findUnique({ where: { id }, select: { content: true } });
  if (!article) return new Response(null, { status: 404 });
  const { total } = chunkContentForPages(article as never, 4);
  const totalPages = desiredTotal ? desiredTotal : total;
  return new Response(null, { headers: { "X-Total-Pages": String(totalPages) } });
}
