import QRCode from "qrcode";

export type VariantKey = "square" | "portrait" | "story" | "wide";

export const VARIANTS: Record<VariantKey, { w: number; h: number; label: string; desc: string }> = {
  square: { w: 1080, h: 1080, label: "Square", desc: "1080×1080 — Feed post" },
  portrait: { w: 1080, h: 1350, label: "Portrait", desc: "1080×1350 — Instagram" },
  story: { w: 1080, h: 1920, label: "Story", desc: "1080×1920 — Story/Reel" },
  wide: { w: 1200, h: 630, label: "Wide", desc: "1200×630 — X / Link" },
};

export type ShareArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverImageUrl: string | null;
  author: { name: string; username: string | null; image: string | null };
};

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_~]+/g, "")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function chunkContent(article: ShareArticle, maxChars = 520, maxPages = 4): { pages: string[]; total: number } {
  const plain = stripMarkdown(article.content);
  const chunks: string[] = [];
  let rest = plain;
  while (rest.length > 0 && chunks.length < maxPages) {
    if (rest.length <= maxChars) {
      chunks.push(rest);
      break;
    }
    let cut = rest.lastIndexOf(" ", maxChars);
    if (cut < maxChars * 0.6) cut = maxChars;
    chunks.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  // first page is title+excerpt, so body chunks start at page 2; cap body pages to maxPages-1 and add overflow note
  if (chunks.length === maxPages && rest.length > 0) {
    chunks[chunks.length - 1] += " …";
  }
  return { pages: chunks, total: chunks.length + 1 }; // +1 for cover page; caller decides
}

export async function makeQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, { width: 220, margin: 1, color: { dark: "#0f0f0f", light: "#ffffff" } });
}

export function ShareCard({
  article,
  page,
  totalPages,
  variant,
  qrDataUrl,
  appUrl,
}: {
  article: ShareArticle;
  page: number;
  totalPages: number;
  variant: { w: number; h: number; label: string };
  qrDataUrl: string;
  appUrl: string;
}) {
  const isCover = page === 1;
  const host = appUrl.replace(/^https?:\/\//, "");
  const bodyPages = chunkContent(article).pages;
  const bodyText = !isCover ? bodyPages[page - 2] ?? "" : "";

  return (
    <div
      style={{
        width: `${variant.w}px`,
        height: `${variant.h}px`,
        display: "flex",
        flexDirection: "column",
        background: "#fafaf7",
        color: "#0f0f0f",
        padding: variant.label === "Story" ? 48 : 40,
        fontFamily: "Geist, sans-serif",
        position: "relative",
      }}
    >
      {/* Brand bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "#0f0f0f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            I
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>Inkora</span>
            <span style={{ fontSize: 10, opacity: 0.6, letterSpacing: 0.8 }}>WRITE · PUBLISH · BE HEARD</span>
          </div>
        </div>
        <span style={{ fontSize: 11, opacity: 0.5, border: "1px solid rgba(0,0,0,0.12)", padding: "4px 8px", borderRadius: 999 }}>
          {page}/{totalPages}
        </span>
      </div>

      {/* Cover artwork */}
      {article.coverImageUrl && isCover && (
        <div style={{ marginTop: 20, display: "flex", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(0,0,0,0.08)", height: variant.h > 1400 ? 520 : 320 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={article.coverImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" } as never} />
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: isCover ? "flex-start" : "center", marginTop: 24, gap: 14 }}>
        {isCover ? (
          <>
            <div
              style={{
                fontSize: variant.w === 1200 ? 44 : variant.h > 1400 ? 42 : 38,
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: -0.8,
                display: "flex",
              }}
            >
              {article.title}
            </div>
            {article.excerpt && (
              <div style={{ fontSize: 18, lineHeight: 1.5, opacity: 0.7, borderLeft: "3px solid #e85d3f", paddingLeft: 14, display: "flex" }}>
                {article.excerpt.length > 160 ? article.excerpt.slice(0, 157) + "…" : article.excerpt}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
              {article.author.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.author.image} alt="" style={{ width: 36, height: 36, borderRadius: 999, objectFit: "cover" } as never} />
              ) : (
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: "#e85d3f20",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {article.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{article.author.name}</span>
                {article.author.username && <span style={{ fontSize: 12, opacity: 0.6 }}>@{article.author.username}</span>}
              </div>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 22, lineHeight: 1.6, opacity: 0.85, display: "flex" }}>{bodyText}</div>
        )}
      </div>

      {/* Footer: QR + host + CTA */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 20, borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="QR" style={{ width: 72, height: 72, borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)" } as never} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Read on Inkora</span>
            <span style={{ fontSize: 11, opacity: 0.6 }}>{host}/articles/{article.slug}</span>
            <span style={{ fontSize: 10, opacity: 0.45 }}>{variant.label} · Share as image</span>
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            background: "#0f0f0f",
            color: "#fff",
            padding: "8px 14px",
            borderRadius: 999,
            display: "flex",
          }}
        >
          inkorablog.vercel.app
        </div>
      </div>
    </div>
  );
}
