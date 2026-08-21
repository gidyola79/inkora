import { getSession } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return Response.json({ error: "Sign in first." }, { status: 401 });
  }

  let body: { publicKey?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const publicKey = String(body.publicKey ?? "").trim();
  if (!publicKey || publicKey.length > 2048) {
    return Response.json({ error: "A valid public key is required." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { publicKey },
  });

  revalidatePath("/dashboard/profile");

  return Response.json({ success: true });
}