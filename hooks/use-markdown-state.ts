"use client"

import { useState, useEffect, useRef } from "react"

const DEFAULT_MARKDOWN = `# Hello World!

Start typing to see the preview update in real-time.

## Features

- **Bold text** and *italic text*
- [Links](https://nextjs.org)
- Code blocks

\`\`\`javascript
const greeting = "Hello, world!";
console.log(greeting);
\`\`\`

1. Ordered lists
2. Support automatic numbering
3. They'll be numbered correctly in the preview
4. Even if you add or remove items`

export function useMarkdownState() {
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN)
  const [previewContent, setPreviewContent] = useState<string>(DEFAULT_MARKDOWN)
  const [isSaved, setIsSaved] = useState(true)
  const [selectedText, setSelectedText] = useState({ text: "", start: 0, end: 0 })
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Load saved content from localStorage on initial render
  useEffect(() => {
    const savedContent = localStorage.getItem("markdown-editor-content")
    if (savedContent) {
      setMarkdown(savedContent)
      setPreviewContent(savedContent)
    }
  }, [])

  // Debounced preview update
  useEffect(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }

    previewTimeoutRef.current = setTimeout(() => {
      setPreviewContent(markdown)
    }, 300) // 300ms debounce

    return () => {
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
    }
  }, [markdown])

  // Autosave content to localStorage
  useEffect(() => {
    const autosaveTimeout = setTimeout(() => {
      localStorage.setItem("markdown-editor-content", markdown)
      setIsSaved(true)
    }, 1000)

    return () => clearTimeout(autosaveTimeout)
  }, [markdown])

  return {
    markdown,
    setMarkdown,
    previewContent,
    isSaved,
    setIsSaved,
    selectedText,
    setSelectedText,
  }
}
