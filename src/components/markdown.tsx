import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { remarkSubSup, remarkMentions } from "@/lib/remark-plugins";

export function MarkdownRenderer({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={`markdown-body ${className}`}>
      <Markdown remarkPlugins={[remarkGfm, remarkSubSup, remarkMentions]}>
        {children}
      </Markdown>
    </div>
  );
}