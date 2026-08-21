import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
]);

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "No file was provided." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: "Unsupported file type." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: "Image must be smaller than 5 MB." }, { status: 400 });
  }

  const extension = path.extname(file.name).toLowerCase() || ".img";
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${extension}`;
  const dir = path.join(process.cwd(), "public", "uploads");

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), Buffer.from(await file.arrayBuffer()));

  return Response.json({ url: `/uploads/${filename}` });
}