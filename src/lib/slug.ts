import slugify from "slugify";
import { prisma } from "@/lib/prisma";

export function slugifyTitle(title: string): string {
  const slug = slugify(title, {
    lower: true,
    strict: true,
    trim: true,
    remove: /[*+~.()'"!:@]/g,
  });
  return slug || "untitled";
}

export async function generateUniqueSlug(
  title: string,
  excludeId?: string
): Promise<string> {
  const base = slugifyTitle(title);
  let slug = base;
  let counter = 2;

  while (true) {
    const existing = await prisma.article.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      return slug;
    }

    slug = `${base}-${counter}`;
    counter += 1;
  }
}