"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
// @ts-ignore - react-syntax-highlighter types are incomplete
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
// @ts-ignore - react-syntax-highlighter types are incomplete
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
// @ts-ignore - react-syntax-highlighter types are incomplete
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism"
import { useTheme } from "next-themes"
import { useEffect, useState, useRef } from "react"
import { ExportToolbar } from "@/components/markdown/export"

interface MarkdownPreviewProps {
  content: string
}

export function MarkdownPreview({ content }: MarkdownPreviewProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark")
  const codeStyle = isDark ? vscDarkPlus : oneLight

  return (
    <div ref={previewRef} className="markdown-preview h-full flex flex-col select-none relative">
      <div className="flex-1 overflow-auto scrollbar-minimal">
        <div className="prose prose-slate dark:prose-invert max-w-none px-8 py-6 prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground prose-p:leading-7 prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-strong:font-semibold prose-em:text-foreground prose-code:text-foreground prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-code:border prose-code:border-border/50 prose-pre:bg-transparent prose-pre:p-0 prose-pre:overflow-hidden prose-img:rounded-xl prose-img:my-6 prose-blockquote:border-l-primary prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground prose-ul:my-4 prose-ol:my-4 prose-li:my-1 prose-hr:border-border">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // @ts-ignore - react-markdown types don't match react-syntax-highlighter
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "")
                return !inline && match ? (
                  <div className="not-prose my-6 group">
                    <div className="relative overflow-hidden rounded-xl border border-border/50 bg-muted/30 backdrop-blur-sm">
                      <div className="flex items-center justify-between border-b border-border/30 bg-muted/40 px-4 py-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {match[1]}
                        </span>
                      </div>
                      <SyntaxHighlighter
                        style={codeStyle}
                        language={match[1]}
                        PreTag="div"
                        customStyle={{
                          margin: 0,
                          padding: "1.25rem",
                          fontSize: "0.875rem",
                          lineHeight: "1.7",
                          background: "transparent",
                        }}
                        codeTagProps={{
                          style: {
                            fontFamily: "var(--font-mono)",
                          },
                        }}
                        {...props}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              },
              img({ node, src, alt, ...props }: any) {
                return (
                  <div className="not-prose my-6 flex justify-center">
                    <img
                      src={src}
                      alt={alt}
                      className="rounded-xl shadow-sm border border-border/30 max-w-full sm:max-w-2xl w-full object-cover transition-all duration-300 hover:shadow-md hover:border-border/50"
                      style={{
                        maxHeight: "400px",
                        width: "100%",
                        height: "auto",
                      }}
                      {...props}
                    />
                  </div>
                )
              },
              table({ children }) {
                return (
                  <div className="not-prose my-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-border border border-border rounded-lg">
                      {children}
                    </table>
                  </div>
                )
              },
              thead({ children }) {
                return <thead className="bg-muted">{children}</thead>
              },
              th({ children }) {
                return (
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground border-b border-border">
                    {children}
                  </th>
                )
              },
              td({ children }) {
                return (
                  <td className="px-4 py-3 text-sm text-foreground border-b border-border">
                    {children}
                  </td>
                )
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
      <div className="relative flex-shrink-0">
        <ExportToolbar markdownContent={content} previewRef={previewRef} />
      </div>
    </div>
  )
}
