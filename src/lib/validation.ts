import { z } from "zod";

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

export const articleFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or fewer"),
  content: z
    .string()
    .min(1, "Content is required"),
  excerpt: z.preprocess(
    emptyToUndefined,
    z.string().trim().max(500, "Excerpt must be 500 characters or fewer").optional()
  ),
  coverImageUrl: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .trim()
      .url("Cover image must be a valid URL")
      .optional()
  ),
});

export type ArticleFormValues = z.infer<typeof articleFormSchema>;

export const searchQuerySchema = z.object({
  q: z.string().trim().max(100, "Search query is too long").optional(),
});