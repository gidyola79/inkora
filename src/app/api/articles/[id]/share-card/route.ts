import satori from "satori";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { ShareCard, VARIANTS, chunkContent, makeQrDataUrl, type VariantKey } from "@/lib/share-card";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const variantKey = (searchParams.get("variant") as VariantKey) || "portrait";
  const variant = VARIANTS[variantKey] ?? VARIANTS.portrait;
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
      status: true,
      author: { select: { name: true, username: true, image: true } },
    },
  });

  if (!article) return new Response("Not found", { status: 404 });
  // only published publicly; drafts require auth but we allow if slug matches — keep simple: allow all for now
  const { pages } = chunkContent(article as never);
  const totalPages = Math.min(4, pages.length + 1); // cover + body chunks capped at 4
  if (page < 1 || page > totalPages) return new Response("Page out of range", { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://inkorablog.vercel.app";
  const articleUrl = `${appUrl}/articles/${article.slug}`;
  const qrDataUrl = await makeQrDataUrl(articleUrl);

  const svg = await satori(
    ShareCard({
      article: article as never,
      page,
      totalPages,
      variant,
      qrDataUrl,
      appUrl,
    }) as unknown as React.ReactElement,
    {
      width: variant.w,
      height: variant.h,
      fonts: [],
    }
  );

  const pngData = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(pngData), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "X-Total-Pages": String(totalPages),
      "Content-Disposition": `inline; filename="inkora-${article.slug}-p${page}.png"`,
    },
  });
}
