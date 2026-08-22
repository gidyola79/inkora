import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST() {
  const session = await getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.user.update({
    where: { id: session.user.id },
    data: { lastSeenAt: new Date() },
  });
  return Response.json({ ok: true });
}

export async function GET(request: Request) {
  const session = await getSession();
  if (!session?.user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  if (!userId) return Response.json({ error: "Missing userId" }, { status: 400 });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { showOnlineStatus: true, lastSeenAt: true },
  });
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });
  const online =
    Boolean(user.showOnlineStatus && user.lastSeenAt && Date.now() - new Date(user.lastSeenAt).getTime() < 3 * 60 * 1000);
  return Response.json({ online, lastSeenAt: user.lastSeenAt });
}
