"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div
      className={`prose prose-sm dark:prose-invert w-full max-w-full overflow-hidden break-words [&_*]:max-w-full [&_*]:break-words prose-headings:font-heading prose-headings:tracking-tight prose-headings:my-2 prose-headings:text-sm prose-h1:text-base prose-p:my-1.5 prose-p:text-foreground prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-code:rounded-sm prose-code:bg-surface-container-high prose-code:px-1.5 prose-code:py-0.5 prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-pre:my-2 prose-pre:bg-surface-container-high prose-pre:text-foreground prose-pre:overflow-x-auto prose-blockquote:my-2 prose-blockquote:border-primary/30 prose-blockquote:text-muted-foreground prose-hr:my-2 prose-hr:border-ghost-border prose-th:text-foreground prose-td:text-foreground prose-table:my-2 prose-table:overflow-x-auto prose-img:my-2 ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
