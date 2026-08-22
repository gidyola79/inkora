"use client";

import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown";
import { EmojiPicker } from "@/components/emoji-picker";

type ToolButton = {
  label: string;
  title: string;
  icon: React.ReactNode;
  onSelect: () => void;
};

function ToolbarButton({ title, icon, onSelect }: { title: string; icon: React.ReactNode; onSelect: () => void }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-border/50 hover:text-foreground"
    >
      {icon}
    </button>
  );
}

export function MarkdownEditor({
  name,
  initialValue = "",
  placeholder = "Write your story…\n\nMarkdown is supported: # headings, **bold**, > quotes, - lists",
  minRows = 18,
}: {
  name: string;
  initialValue?: string;
  placeholder?: string;
  minRows?: number;
}) {
  const [value, setValue] = useState(initialValue);
  const [preview, setPreview] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [textarea, setTextarea] = useState<HTMLTextAreaElement | null>(null);

  function applyInline(prefix: string, suffix: string, placeholderText: string) {
    const start = selection.start;
    const end = selection.end;
    const selected = value.slice(start, end) || placeholderText;
    const next =
      value.slice(0, start) + prefix + selected + suffix + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    });
  }

  function insertText(text: string) {
    const start = selection.start;
    const end = selection.end;
    const next = value.slice(0, start) + text + value.slice(end);
    setValue(next);
    setSelection({ start: start + text.length, end: start + text.length });
    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    });
  }

  function applyLine(marker: string, removeIfPresent: boolean) {
    const start = value.lastIndexOf("\n", selection.start - 1) + 1;
    const endLine = value.indexOf("\n", selection.end);
    const end = endLine === -1 ? value.length : endLine;
    const block = value.slice(start, end);
    const lines = block.split("\n");

    const nextLines = lines.map((line) => {
      if (removeIfPresent && line.startsWith(marker)) {
        return line.slice(marker.length);
      }
      if (line.trim()) {
        return marker + line;
      }
      return line;
    });

    const next = value.slice(0, start) + nextLines.join("\n") + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(start, start + nextLines.join("\n").length);
    });
  }

  const buttons: ToolButton[] = [
    {
      label: "Bold",
      title: "Bold",
      icon: <span className="text-sm font-bold">B</span>,
      onSelect: () => applyInline("**", "**", "bold text"),
    },
    {
      label: "Italic",
      title: "Italic",
      icon: <span className="text-sm italic">I</span>,
      onSelect: () => applyInline("*", "*", "italic text"),
    },
    {
      label: "Strikethrough",
      title: "Strikethrough",
      icon: <span className="text-sm line-through">S</span>,
      onSelect: () => applyInline("~~", "~~", "struck through"),
    },
    {
      label: "Subscript",
      title: "Subscript (~x~)",
      icon: <span className="text-xs align-baseline">x₂</span>,
      onSelect: () => applyInline("~", "~", "subscript"),
    },
    {
      label: "Superscript",
      title: "Superscript (^x^)",
      icon: <span className="text-xs align-baseline">x²</span>,
      onSelect: () => applyInline("^", "^", "superscript"),
    },
    {
      label: "Link",
      title: "Link",
      icon: <span className="text-sm">🔗</span>,
      onSelect: () => applyInline("[", "](https://)", "link text"),
    },
    {
      label: "Inline code",
      title: "Inline code",
      icon: <span className="font-mono text-sm">&lt;/&gt;</span>,
      onSelect: () => applyInline("`", "`", "code"),
    },
    {
      label: "Heading 2",
      title: "Heading 2",
      icon: <span className="text-sm font-semibold">H2</span>,
      onSelect: () => applyLine("## ", true),
    },
    {
      label: "Heading 3",
      title: "Heading 3",
      icon: <span className="text-sm font-semibold">H3</span>,
      onSelect: () => applyLine("### ", true),
    },
    {
      label: "Quote",
      title: "Quote",
      icon: <span className="text-sm">❝</span>,
      onSelect: () => applyLine("> ", true),
    },
    {
      label: "Bullet list",
      title: "Bullet list",
      icon: <span className="text-sm">•</span>,
      onSelect: () => applyLine("- ", true),
    },
    {
      label: "Numbered list",
      title: "Numbered list",
      icon: <span className="text-sm">1.</span>,
      onSelect: () => applyLine("1. ", true),
    },
    {
      label: "Horizontal rule",
      title: "Horizontal rule",
      icon: <span className="text-xs">———</span>,
      onSelect: () => applyLine("\n---", false),
    },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-background/60 px-2 py-1.5">
        {buttons.map((button) => (
          <ToolbarButton key={button.label} title={button.title} icon={button.icon} onSelect={button.onSelect} />
        ))}
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <EmojiPicker title="Insert emoji" onPick={insertText} />
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className={`ml-auto flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
            preview
              ? "bg-accent/10 text-accent"
              : "text-muted hover:bg-border/50 hover:text-foreground"
          }`}
        >
          {preview ? "Edit" : "Preview"}
        </button>
      </div>

      {preview ? (
        <div className="max-h-[36rem] min-h-[18rem] overflow-y-auto px-5 py-4">
          {value.trim() ? (
            <MarkdownRenderer>{value}</MarkdownRenderer>
          ) : (
            <p className="py-10 text-center text-sm text-muted">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          ref={setTextarea}
          name={name}
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setSelection({
              start: event.currentTarget.selectionStart,
              end: event.currentTarget.selectionEnd,
            });
          }}
          onSelect={(event) =>
            setSelection({
              start: event.currentTarget.selectionStart,
              end: event.currentTarget.selectionEnd,
            })
          }
          onKeyUp={(event) =>
            setSelection({
              start: event.currentTarget.selectionStart,
              end: event.currentTarget.selectionEnd,
            })
          }
          onBlur={(event) =>
            setSelection({
              start: event.currentTarget.selectionStart,
              end: event.currentTarget.selectionEnd,
            })
          }
          placeholder={placeholder}
          rows={minRows}
          className="input min-h-[18rem] w-full resize-y rounded-none border-0 bg-transparent font-mono text-sm focus:ring-0"
        />
      )}
    </div>
  );
}