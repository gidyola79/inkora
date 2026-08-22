import satori from "satori";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { ShareCard, VARIANTS, makeQrDataUrl } from "@/lib/share-card";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: { slug: string } }) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
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
  const svg = await satori(
    ShareCard({ article: article as never, page: 1, totalPages: 1, variant: VARIANTS.wide, qrDataUrl: qr, appUrl }) as unknown as React.ReactElement,
    { width: size.width, height: size.height, fonts: [] }
  );
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=86400" } });
}
