import Link from "next/link";

export function Logo({
  href = "/",
  compact = false,
  className = "",
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 rounded-lg ${className}`}
      aria-label="Inkora home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark.svg"
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 shrink-0"
      />
      {!compact && (
        <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
          Inkora
        </span>
      )}
    </Link>
  );
}