import satori from "satori";
import sharp from "sharp";
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

let cachedFonts: { name: string; data: Buffer; weight: 400 | 700; style: "normal" }[] | null = null;

async function getFonts() {
  if (cachedFonts) return cachedFonts;
  try {
    const [regular, bold] = await Promise.all([
      fetch("https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-400-normal.woff").then((r) => r.arrayBuffer()),
      fetch("https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.18/files/inter-latin-700-normal.woff").then((r) => r.arrayBuffer()),
    ]);
    cachedFonts = [
      { name: "Inter", data: Buffer.from(regular), weight: 400 as const, style: "normal" as const },
      { name: "Inter", data: Buffer.from(bold), weight: 700 as const, style: "normal" as const },
    ];
    return cachedFonts;
  } catch {
    return [];
  }
}

async function renderCard(
  article: { id: string; title: string; slug: string; excerpt: string | null; content: string; coverImageUrl: string | null; author: { name: string; username: string | null; image: string | null } },
  searchParams: URLSearchParams
) {
  const variantKey = (searchParams.get("variant") as VariantKey) || "portrait";
  const variant = VARIANTS[variantKey] ?? VARIANTS.portrait;
  const theme = (searchParams.get("theme") as ThemeKey) || "light";
  const accentColor = searchParams.get("color") ?? undefined;
  const desiredTotal = Math.max(1, Math.min(4, parseInt(searchParams.get("pages") ?? "0", 10) || 0));
  const pageParam = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isNaN(pageParam) ? 1 : Math.max(1, pageParam);

  const { total: autoTotal } = chunkContentForPages(article as never, desiredTotal || 4);
  const totalPages = desiredTotal ? desiredTotal : autoTotal;
  if (page < 1 || page > totalPages) throw new Error("Page out of range");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://inkorablog.vercel.app";
  const articleUrl = `${appUrl}/articles/${article.slug}`;
  // adapt QR colors for dark themes
  const themeDef = THEMES[theme] ?? THEMES.light;
  const isDark = theme === "dark" || theme === "ink";
  const qrDataUrl = await makeQrDataUrl(articleUrl);

  const fonts = await getFonts();
  const svg = await satori(
    ShareCard({
      article: article as never,
      page,
      totalPages,
      variant,
      qrDataUrl,
      appUrl,
      theme,
      accentColor,
    }) as unknown as React.ReactElement,
    {
      width: variant.w,
      height: variant.h,
      fonts: fonts.length ? fonts : [{ name: "sans-serif", data: Buffer.from([]), weight: 400, style: "normal" }],
    }
  );
  const pngData = await sharp(Buffer.from(svg)).png().toBuffer();
  return { pngData, totalPages, variant, article, theme, accentColor };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        content: true,
        coverImageUrl: true,
        status: true,
        author: { select: { name: true, username: true, image: true } },
      },
    });
    if (!article) return new Response("Not found", { status: 404 });
    const { pngData, totalPages, variant, article: art } = await renderCard(article as never, searchParams);
    const page = parseInt(searchParams.get("page") ?? "1", 10) || 1;
    return new Response(new Uint8Array(pngData), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "X-Total-Pages": String(totalPages),
        "Content-Disposition": `inline; filename="inkora-${art.slug}-p${page}-${variant.w}x${variant.h}.png"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to render";
    const status = msg === "Page out of range" ? 400 : 500;
    return new Response(msg, { status });
  }
}

export async function HEAD(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const article = await prisma.article.findUnique({ where: { id }, select: { id: true, content: true } });
  if (!article) return new Response(null, { status: 404 });
  const desiredTotal = Math.max(1, Math.min(4, parseInt(searchParams.get("pages") ?? "0", 10) || 0));
  const { total } = chunkContentForPages(article as never, desiredTotal || 4);
  const totalPages = desiredTotal ? desiredTotal : total;
  return new Response(null, { headers: { "X-Total-Pages": String(totalPages) } });
}
