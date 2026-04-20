import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

type MarkdownProps = {
  content: string;
  className?: string;
};

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn("space-y-4 text-sm leading-7 text-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        h1: ({ children }) => <h1 className="text-3xl font-semibold tracking-tight">{children}</h1>,
        h2: ({ children }) => <h2 className="text-2xl font-semibold tracking-tight">{children}</h2>,
        h3: ({ children }) => <h3 className="text-xl font-semibold tracking-tight">{children}</h3>,
        h4: ({ children }) => <h4 className="text-lg font-semibold tracking-tight">{children}</h4>,
        p: ({ children }) => <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">{children}</p>,
        a: ({ children, href }) => (
          <a href={href} className="text-foreground underline decoration-black/30 underline-offset-4">
            {children}
          </a>
        ),
        ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-black/10 pl-4 text-foreground/75">{children}</blockquote>
        ),
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");

          if (isBlock) {
            return (
              <code className="block overflow-x-auto rounded-md bg-black/5 px-4 py-3 font-mono text-xs leading-6">
                {children}
              </code>
            );
          }

          return (
            <code className="rounded bg-black/5 px-1.5 py-0.5 font-mono text-[0.85em]">
              {children}
            </code>
          );
        },
        pre: ({ children }) => <pre className="overflow-x-auto rounded-md bg-black/5">{children}</pre>,
        table: ({ children }) => (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0 text-sm">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border-b border-black/10 px-3 py-2 text-left font-medium text-foreground/85">
            {children}
          </th>
        ),
        td: ({ children }) => <td className="border-b border-black/5 px-3 py-2 align-top">{children}</td>,
        hr: () => <hr className="border-black/10" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
