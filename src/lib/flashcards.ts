export type GeneratedCard = {
  front: string;
  back: string;
};

const stripMarkdown = (text: string) => text.replace(/[*_`>#]/g, "").trim();

export function generateFlashcards(content: string, limit = 12): GeneratedCard[] {
  const lines = content.split(/\r?\n/);
  const cards: GeneratedCard[] = [];
  const seen = new Set<string>();

  const push = (front: string, back: string) => {
    const f = stripMarkdown(front);
    const b = stripMarkdown(back);
    if (!f || !b) return;
    const key = f.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    cards.push({
      front: f.slice(0, 200),
      back: b.slice(0, 500),
    });
  };

  let currentHeading = "";
  let buffer: string[] = [];

  const flush = () => {
    const body = buffer.join(" ").replace(/[*_`>#]/g, "").replace(/\s+/g, " ").trim();
    if (currentHeading && body) {
      push(currentHeading, body);
    }
    buffer = [];
  };

  for (const raw of lines) {
    const line = raw.trim();

    const headingMatch = line.match(/^#{2,3}\s+(.+)$/);
    if (headingMatch) {
      flush();
      currentHeading = stripMarkdown(headingMatch[1]);
      continue;
    }

    if (line === "---") {
      flush();
      continue;
    }

    if (!line) {
      continue;
    }

    const bulletDef = line.match(/^[-*]\s+(.+?)\s*[:：]\s+(.+)$/);
    if (bulletDef) {
      push(bulletDef[1], bulletDef[2]);
      continue;
    }

    const numberedDef = line.match(/^\d+[.)]\s+(.+?)\s*[:：]\s+(.+)$/);
    if (numberedDef) {
      push(numberedDef[1], numberedDef[2]);
      continue;
    }

    buffer.push(line);
  }

  flush();

  return cards.slice(0, limit);
}