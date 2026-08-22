import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().replace(/^@+/, "");
  if (!q || q.length < 1) return Response.json([]);
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, username: true, image: true },
    orderBy: { name: "asc" },
    take: 8,
  });
  return Response.json(users);
}
