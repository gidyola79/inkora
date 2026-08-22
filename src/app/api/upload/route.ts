import { v2 as cloudinary } from "cloudinary";
import { getSession } from "@/lib/auth-helpers";
import { consumeRateLimit } from "@/lib/rate-limit";
import { logSecurityEvent } from "@/lib/security-log";

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const FOLDERS: Record<string, string> = {
  cover: "inkora/covers",
  avatar: "inkora/avatars",
};

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) return false;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
  return true;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user) {
    return Response.json({ error: "Sign in to upload images." }, { status: 401 });
  }

  const limit = await consumeRateLimit(`upload:${session.user.id}`, 20, 3600);
  if (!limit.ok) {
    logSecurityEvent("ratelimit.blocked", { route: "/api/upload", userId: session.user.id });
    return Response.json(
      { error: `Too many uploads. Try again in about ${Math.ceil((limit.retryAfterSec ?? 60) / 60)} minutes.` },
      { status: 429 }
    );
  }

  if (!configureCloudinary()) {
    return Response.json(
      { error: "Image uploads are not configured on this deployment." },
      { status: 500 }
    );
  }

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
    return Response.json(
      { error: "Unsupported file type. Use JPEG, PNG, WebP, GIF or AVIF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return Response.json({ error: "Image must be smaller than 5 MB." }, { status: 400 });
  }

  const kind = String(formData.get("kind") ?? "");
  const folder = FOLDERS[kind] ?? "inkora/misc";
  const maxDimension = kind === "avatar" ? 800 : 1600;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          unique_filename: true,
          overwrite: false,
          transformation: [{ width: maxDimension, height: maxDimension, crop: "limit" }],
          fetch_format: "auto",
          quality: "auto",
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            reject(error ?? new Error("Cloudinary returned no result."));
            return;
          }
          resolve(uploaded);
        }
      );
      stream.end(buffer);
    });

    return Response.json({ url: result.secure_url });
  } catch (error) {
    console.error("[upload] Cloudinary upload failed:", error);
    const detail = error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);
    const message = /invalid|signature|api[_ ]?key|unauthor|denied|auth/i.test(detail)
      ? "Upload service rejected the credentials - check the Cloudinary configuration."
      : "Upload failed. Please try again.";
    return Response.json({ error: message }, { status: 500 });
  }
}
