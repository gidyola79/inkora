"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { updateProfileAction } from "@/lib/actions";

type ProfileFormProps = {
  name: string;
  username: string;
  bio: string;
  image: string;
  dob: string;
  phone: string;
  gender: string;
  website: string;
};

const initialState: { success: boolean; message?: string } = { success: false };

export function ProfileForm({
  name,
  username,
  bio,
  image,
  dob,
  phone,
  gender,
  website,
}: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileAction, initialState);
  const [avatar, setAvatar] = useState(image);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const router = useRouter();

  async function handleAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be smaller than 5 MB.");
      return;
    }

    const body = new FormData();
    body.append("file", file);
    body.append("kind", "avatar");
    setUploading(true);
    setUploadError(null);
    try {
      const response = await fetch("/api/upload", { method: "POST", body });
      const result = await response.json();
      if (!response.ok || !result.url) {
        throw new Error(result.error || "Upload failed.");
      }
      setAvatar(result.url);
      router.refresh();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="image" value={avatar} />

      {state.message && (
        <p
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            state.success
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-danger/30 bg-danger/10 text-danger"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-accent/15 text-xl font-semibold text-accent">
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            name.charAt(0).toUpperCase()
          )}
        </span>
        <div>
          <label className="btn btn-outline btn-sm cursor-pointer">
            {uploading ? "Uploading…" : "Change profile picture"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleAvatar}
              disabled={uploading}
            />
          </label>
          {uploadError && <p className="mt-1.5 text-sm text-danger">{uploadError}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="username" className="label">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            defaultValue={username}
            required
            pattern="[a-z0-9_]{3,30}"
            placeholder="your-username"
            className="input font-mono text-sm"
          />
          <p className="text-xs text-muted">
            3–30 characters. Letters, numbers, and underscores. Used for your profile URL and login.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="bio" className="label">
            Bio
          </label>
          <input
            id="bio"
            name="bio"
            type="text"
            defaultValue={bio}
            maxLength={160}
            placeholder="Tell people a little about yourself"
            className="input"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="dob" className="label">
            Date of birth <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="dob"
            name="dob"
            type="date"
            defaultValue={dob}
            className="input"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="label">
            Phone number <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={phone}
            placeholder="+1 555 000 0000"
            className="input"
          />
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="gender" className="label">
            Gender <span className="font-normal text-muted">(optional)</span>
          </label>
          <select id="gender" name="gender" defaultValue={gender} className="input">
            <option value="">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="nonbinary">Non-binary</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2">
          <label htmlFor="website" className="label">
            Website <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="website"
            name="website"
            type="url"
            defaultValue={website}
            placeholder="https://your-site.com"
            className="input"
          />
          <p className="text-xs text-muted">Your personal site or portfolio. Shown on your public profile.</p>
        </div>
      </div>

      <div className="flex items-center justify-end border-t border-border pt-5">
        <button type="submit" disabled={isPending} className="btn btn-primary">
          {isPending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}