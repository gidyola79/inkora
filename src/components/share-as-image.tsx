"use client";

import { useEffect, useRef, useState } from "react";
import { THEMES, VARIANTS, type ThemeKey, type VariantKey } from "@/lib/share-card";

export function ShareAsImage({ articleId, title }: { articleId: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [variant, setVariant] = useState<VariantKey>("portrait");
  const [theme, setTheme] = useState<ThemeKey>("light");
  const [customColor, setCustomColor] = useState("#4f46e5");
  const [pages, setPages] = useState(2);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(2);
  const [downloading, setDownloading] = useState(false);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgError, setImgError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const themeParam = theme === "custom" ? `&theme=custom&color=${encodeURIComponent(customColor)}` : `&theme=${theme}`;
  const src = `/api/articles/${articleId}/share-card?variant=${variant}&page=${page}&pages=${pages}${themeParam}`;

  // fetch total when variant/pages/theme changes
  useEffect(() => {
    if (!open) return;
    setImgLoading(true);
    setImgError(null);
    fetch(`/api/articles/${articleId}/share-card?variant=${variant}&page=1&pages=${pages}${themeParam}`, { method: "HEAD" })
      .then((r) => {
        const t = parseInt(r.headers.get("X-Total-Pages") ?? `${pages}`, 10);
        const nextTotal = Number.isNaN(t) ? pages : Math.min(pages, t);
        setTotal(nextTotal);
        setPage(1);
      })
      .catch(() => setTotal(pages));
  }, [open, variant, pages, themeParam, articleId]);

  useEffect(() => {
    setImgLoading(true);
    setImgError(null);
  }, [src]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") setPage((p) => Math.min(total, p + 1));
      if (e.key === "ArrowLeft") setPage((p) => Math.max(1, p - 1));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, total]);

  async function fetchBlob(p: number): Promise<Blob> {
    const url = `/api/articles/${articleId}/share-card?variant=${variant}&page=${p}&pages=${pages}${themeParam}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(await r.text());
    return r.blob();
  }

  async function downloadOne(p: number) {
    const blob = await fetchBlob(p);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.slice(0, 24).replace(/\s+/g, "-")}-p${p}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadAll() {
    setDownloading(true);
    try {
      for (let p = 1; p <= total; p++) await downloadOne(p);
    } finally {
      setDownloading(false);
    }
  }

  async function handleShare() {
    try {
      const blob = await fetchBlob(page);
      const file = new File([blob], `inkora-p${page}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title, files: [file] });
        return;
      }
      await downloadOne(page);
    } catch {}
  }

  async function handleCopy() {
    try {
      const blob = await fetchBlob(page);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    } catch {
      await navigator.clipboard.writeText(`${window.location.origin}/api/articles/${articleId}/share-card?variant=${variant}&page=${page}&pages=${pages}${themeParam}`);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
        Share as image
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4" onClick={() => setOpen(false)}>
          <div ref={dialogRef} onClick={(e) => e.stopPropagation()} className="flex max-h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-card shadow-xl sm:max-h-[90dvh]">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Share as image</h3>
              <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm" aria-label="Close">✕</button>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row">
              {/* preview */}
              <div className="flex flex-1 flex-col items-center justify-center overflow-hidden rounded-xl border border-border bg-background p-3">
                <div className="flex w-full items-center justify-between gap-2 pb-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn btn-ghost btn-sm disabled:opacity-40">‹ Prev</button>
                  <span className="text-xs text-muted">{page} / {total} • {VARIANTS[variant].label}</span>
                  <button onClick={() => setPage((p) => Math.min(total, p + 1))} disabled={page >= total} className="btn btn-ghost btn-sm disabled:opacity-40">Next ›</button>
                </div>
                <div className="flex min-h-[300px] flex-1 items-center justify-center overflow-auto rounded-lg bg-muted/20 p-2">
                  {imgLoading && <span className="text-sm text-muted">Loading preview…</span>}
                  {imgError && <span className="text-sm text-danger">{imgError}</span>}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={"Share card page " + page + " preview"}
                    onLoad={() => setImgLoading(false)}
                    onError={() => { setImgLoading(false); setImgError("Failed to load preview. Try again."); }}
                    className={(imgLoading || imgError ? "hidden" : "block") + " max-h-[58dvh] w-auto max-w-full rounded-lg border border-border object-contain shadow-sm lg:max-h-[62dvh]"}
                  />
                </div>
                <div className="mt-2 flex gap-1">
                  {Array.from({ length: total }).map((_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)} aria-label={"Go to page " + (i + 1)} className={"h-1.5 w-6 rounded-full transition-colors " + (i + 1 === page ? "bg-accent" : "bg-border")} />
                  ))}
                </div>
              </div>

              {/* controls */}
              <div className="flex w-full flex-col gap-4 overflow-y-auto lg:w-80">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Sections</p>
                  <p className="mt-1 text-xs text-muted">Break the post into 1–4 images. Post starts on page 1.</p>
                  <div className="mt-2 flex items-center gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <button key={n} onClick={() => { setPages(n); setPage(1); }} className={"flex-1 rounded-xl border px-2 py-2 text-sm font-medium " + (pages === n ? "border-accent bg-accent text-accent-foreground" : "border-border hover:bg-border/40")}>{n}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Format</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(Object.keys(VARIANTS) as VariantKey[]).map((k) => (
                      <button key={k} onClick={() => setVariant(k)} className={"rounded-xl border px-3 py-2.5 text-left text-sm transition-colors " + (variant === k ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-border/40")}>
                        <span className="font-medium">{VARIANTS[k].label}</span>
                        <span className="block text-xs opacity-60">{VARIANTS[k].desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Theme</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(Object.keys(THEMES) as ThemeKey[]).map((k) => (
                      <button key={k} onClick={() => setTheme(k)} className={"rounded-xl border px-3 py-2 text-left text-sm " + (theme === k ? "border-accent bg-accent/10 text-accent" : "border-border hover:bg-border/40")}>
                        <span className="flex items-center gap-2 font-medium"><span className="h-3 w-3 rounded-full border" style={{ background: THEMES[k].bg, borderColor: THEMES[k].border }} />{THEMES[k].label}</span>
                      </button>
                    ))}
                  </div>
                  {theme === "custom" && (
                    <div className="mt-3 flex items-center gap-2 rounded-xl border border-border p-3">
                      <input type="color" value={customColor} onChange={(e) => setCustomColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent p-0" aria-label="Pick custom accent color" />
                      <span className="text-xs text-muted">Custom accent</span>
                      <span className="ml-auto font-mono text-xs">{customColor}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => downloadOne(page)} className="btn btn-outline btn-sm">Download page</button>
                  <button onClick={downloadAll} disabled={downloading} className="btn btn-outline btn-sm disabled:opacity-50">{downloading ? "…" : "Download all (" + total + ")"}</button>
                  <button onClick={handleShare} className="btn btn-primary btn-sm">Share</button>
                  <button onClick={handleCopy} className="btn btn-ghost btn-sm">Copy image</button>
                </div>
                <p className="text-xs leading-relaxed text-muted">Branded with Inkora wordmark, author avatar/name, title & excerpt + paginated body + QR linking to the post.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
