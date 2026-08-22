import { ImageResponse } from "next/og";
import { prisma } from "@/lib/prisma";
import { ShareCard, VARIANTS, makeQrDataUrl } from "@/lib/share-card";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

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

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.article.findUnique({
    where: { slug },
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://inkorablog.vercel.app";
  const qr = await makeQrDataUrl(`${appUrl}/articles/${article.slug}`);
  const fonts = await getFonts();
  return new ImageResponse(
    ShareCard({ article: article as never, page: 1, totalPages: 1, variant: VARIANTS.wide, qrDataUrl: qr, appUrl }) as unknown as React.ReactElement,
    { width: size.width, height: size.height, fonts: fonts.length ? fonts : undefined } as never
  );
}
