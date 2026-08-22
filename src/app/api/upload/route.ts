import { v2 as cloudinary } from "cloudinary";

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
  } catch {
    return Response.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
