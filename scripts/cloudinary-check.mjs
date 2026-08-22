import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error(
    "Missing CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY or CLOUDINARY_API_SECRET - fill them in .env first"
  );
  process.exit(1);
}

console.log(`Testing cloud: ${cloudName}, key: ${apiKey.slice(0, 4)}...`);

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });

// 1x1 transparent PNG
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64"
);

try {
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "inkora/misc", resource_type: "image" },
      (error, uploaded) =>
        error || !uploaded
          ? reject(error ?? new Error("Cloudinary returned no result"))
          : resolve(uploaded)
    );
    stream.end(png);
  });
  console.log(`CLOUDINARY OK - ${result.secure_url}`);
} catch (error) {
  console.error("CLOUDINARY FAILED -", error?.message ?? error);
  if (error?.http_code) console.error("HTTP status:", error.http_code);
  process.exit(1);
}
