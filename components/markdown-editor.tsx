"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading,
  Link,
  Code,
  Quote,
  Undo,
  Redo,
  Paperclip,
  Strikethrough,
  Link2,
  ImageIcon,
  Table,
  Info,
  Save,
  Copy,
  Check,
  SplitSquareVertical,
} from "lucide-react"

// Maximum number of history entries to store
const MAX_HISTORY_LENGTH = 100

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState<string>(
    '# Hello, Markdown!\n\nStart typing to see the preview update in real-time.\n\n## Features\n\n- **Bold text** and *italic text*\n- [Links](https://nextjs.org)\n- Images ![alt text](/placeholder.svg?height=50&width=100&query=example)\n- Code blocks\n\n```javascript\nconst greeting = "Hello, world!";\nconsole.log(greeting);\n```\n\n> Blockquotes are supported too\n\n1. Ordered lists\n2. Support automatic numbering\n3. They\'ll be numbered correctly in the preview\n4. Even if you add or remove items',
  )
  const [activeTab, setActiveTab] = useState<string>("write")
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectedText, setSelectedText] = useState({ text: "", start: 0, end: 0 })
  const [showNumberingTip, setShowNumberingTip] = useState(false)
  const [previewContent, setPreviewContent] = useState<string>("")
  const [isSaved, setIsSaved] = useState(true)
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [viewMode, setViewMode] = useState<"tabs" | "split">("tabs")
  const [copied, setCopied] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })
  const scrollPositionRef = useRef<number>(0)

  // Load saved content from localStorage on initial render
  useEffect(() => {
    const savedContent = localStorage.getItem("markdown-editor-content")
    if (savedContent) {
      setMarkdown(savedContent)
      setHistory([savedContent])
      setHistoryIndex(0)
    } else {
      setHistory([markdown])
      setHistoryIndex(0)
    }

    // Set initial preview content
    setPreviewContent(markdown)

    // Check for saved view mode preference
    const savedViewMode = localStorage.getItem("markdown-editor-view-mode")
    if (savedViewMode === "split" || savedViewMode === "tabs") {
      setViewMode(savedViewMode)
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

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem("markdown-editor-view-mode", viewMode)
  }, [viewMode])

  // Clear selection state when switching to preview mode
  useEffect(() => {
    if (activeTab === "preview") {
      setSelectedText({ text: "", start: 0, end: 0 })
    }
  }, [activeTab])

  // Add beforeunload event listener to warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSaved) {
        e.preventDefault()
        e.returnValue = ""
        return ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [isSaved])

  // Update cursor position
  const updateCursorPosition = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursorIndex = textarea.selectionStart
    const text = textarea.value.substring(0, cursorIndex)
    const lines = text.split("\n")
    const lineNumber = lines.length
    const columnNumber = lines[lines.length - 1].length + 1

    setCursorPosition({
      line: lineNumber,
      column: columnNumber,
    })
  }, [])

  // Modify the handleChange function to allow auto-scrolling when typing at the bottom
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setMarkdown(newValue)
      setIsSaved(false)
      updateCursorPosition()

      // Add to history if content changed
      if (newValue !== history[historyIndex]) {
        // Limit history size by removing oldest entries if needed
        const newHistory = history.slice(0, historyIndex + 1)
        newHistory.push(newValue)

        if (newHistory.length > MAX_HISTORY_LENGTH) {
          newHistory.shift() // Remove oldest entry
          setHistoryIndex(newHistory.length - 2)
        } else {
          setHistoryIndex(newHistory.length - 1)
        }

        setHistory(newHistory)
      }
    },
    [history, historyIndex, updateCursorPosition],
  )

  // Update the insertMarkdown function to handle auto-scrolling for inserted content
  const insertMarkdown = useCallback(
    (prefix: string, suffix = "") => {
      const textarea = textareaRef.current
      if (!textarea) return

      // Use the stored selection if available, otherwise get current selection
      const start = selectedText.start || textarea.selectionStart
      const end = selectedText.end || textarea.selectionEnd
      const text = selectedText.text || markdown.substring(start, end)

      const beforeText = markdown.substring(0, start)
      const afterText = markdown.substring(end)

      const newText = beforeText + prefix + text + suffix + afterText
      setMarkdown(newText)
      setIsSaved(false)

      // Add to history
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newText)

      if (newHistory.length > MAX_HISTORY_LENGTH) {
        newHistory.shift() // Remove oldest entry
        setHistoryIndex(newHistory.length - 2)
      } else {
        setHistoryIndex(newHistory.length - 1)
      }

      setHistory(newHistory)

      // Focus and set cursor position after operation
      setTimeout(() => {
        textarea.focus()

        if (text.length > 0) {
          // If text was selected, place cursor after the selection + suffix
          textarea.setSelectionRange(
            start + prefix.length + text.length + suffix.length,
            start + prefix.length + text.length + suffix.length,
          )
        } else {
          // If no text was selected, place cursor between prefix and suffix
          textarea.setSelectionRange(start + prefix.length, start + prefix.length)
        }

        // Clear the stored selection
        setSelectedText({ text: "", start: 0, end: 0 })
        updateCursorPosition()
      }, 0)
    },
    [markdown, selectedText, history, historyIndex, updateCursorPosition],
  )

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setMarkdown(history[historyIndex - 1])
      setIsSaved(false)

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          updateCursorPosition()
        }
      }, 0)
    }
  }, [history, historyIndex, updateCursorPosition])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setMarkdown(history[historyIndex + 1])
      setIsSaved(false)

      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          updateCursorPosition()
        }
      }, 0)
    }
  }, [history, historyIndex, updateCursorPosition])

  const saveContent = useCallback(() => {
    localStorage.setItem("markdown-editor-content", markdown)
    setIsSaved(true)
  }, [markdown])

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [markdown])

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "tabs" ? "split" : "tabs"))
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const cursorPos = textarea.selectionStart
    const currentValue = textarea.value

    // Update cursor position on key events
    updateCursorPosition()

    // Save on Ctrl+S
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault()
      saveContent()
      return
    }

    // Handle Enter key for auto-continuing lists
    if (e.key === "Enter" && !e.shiftKey) {
      // Find the start of the current line
      let lineStart = cursorPos
      while (lineStart > 0 && currentValue[lineStart - 1] !== "\n") {
        lineStart--
      }

      const currentLine = currentValue.substring(lineStart, cursorPos)

      // Check if we're in a numbered list
      const numberedListMatch = currentLine.match(/^(\s*)(\d+)\.(\s+)(.*)/)
      if (numberedListMatch) {
        e.preventDefault()

        const [, indent, num, space, text] = numberedListMatch
        // Calculate the next number for better UX, even though Markdown will auto-number
        const nextNumber = Number.parseInt(num) + 1

        // If the line is empty (except for the list marker), end the list
        if (!text.trim()) {
          // Remove the current list marker and add a newline
          const beforeText = currentValue.substring(0, lineStart)
          const afterText = currentValue.substring(cursorPos)
          const newText = beforeText + "\n" + afterText

          setMarkdown(newText)
          setIsSaved(false)

          // Add to history
          const newHistory = history.slice(0, historyIndex + 1)
          newHistory.push(newText)

          if (newHistory.length > MAX_HISTORY_LENGTH) {
            newHistory.shift()
            setHistoryIndex(newHistory.length - 2)
          } else {
            setHistoryIndex(newHistory.length - 1)
          }

          setHistory(newHistory)

          // Set cursor position
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(lineStart + 1, lineStart + 1)
            updateCursorPosition()
          }, 0)
        } else {
          // Continue the list with the next number for better UX
          const insertion = `\n${indent}${nextNumber}.${space}`

          const beforeText = currentValue.substring(0, cursorPos)
          const afterText = currentValue.substring(cursorPos)
          const newText = beforeText + insertion + afterText

          setMarkdown(newText)
          setIsSaved(false)

          // Add to history
          const newHistory = history.slice(0, historyIndex + 1)
          newHistory.push(newText)

          if (newHistory.length > MAX_HISTORY_LENGTH) {
            newHistory.shift()
            setHistoryIndex(newHistory.length - 2)
          } else {
            setHistoryIndex(newHistory.length - 1)
          }

          setHistory(newHistory)

          // Set cursor position after the inserted list marker
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(cursorPos + insertion.length, cursorPos + insertion.length)
            updateCursorPosition()
          }, 0)
        }
        return
      }

      // Check if we're in a bullet list
      const bulletListMatch = currentLine.match(/^(\s*)(-|\*|\+)(\s+)(.*)/)
      if (bulletListMatch) {
        e.preventDefault()

        const [, indent, bullet, space, text] = bulletListMatch

        // If the line is empty (except for the list marker), end the list
        if (!text.trim()) {
          // Remove the current list marker and add a newline
          const beforeText = currentValue.substring(0, lineStart)
          const afterText = currentValue.substring(cursorPos)
          const newText = beforeText + "\n" + afterText

          setMarkdown(newText)
          setIsSaved(false)

          // Add to history
          const newHistory = history.slice(0, historyIndex + 1)
          newHistory.push(newText)

          if (newHistory.length > MAX_HISTORY_LENGTH) {
            newHistory.shift()
            setHistoryIndex(newHistory.length - 2)
          } else {
            setHistoryIndex(newHistory.length - 1)
          }

          setHistory(newHistory)

          // Set cursor position
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(lineStart + 1, lineStart + 1)
            updateCursorPosition()
          }, 0)
        } else {
          // Continue the list with the same bullet
          const insertion = `\n${indent}${bullet}${space}`

          const beforeText = currentValue.substring(0, cursorPos)
          const afterText = currentValue.substring(cursorPos)
          const newText = beforeText + insertion + afterText

          setMarkdown(newText)
          setIsSaved(false)

          // Add to history
          const newHistory = history.slice(0, historyIndex + 1)
          newHistory.push(newText)

          if (newHistory.length > MAX_HISTORY_LENGTH) {
            newHistory.shift()
            setHistoryIndex(newHistory.length - 2)
          } else {
            setHistoryIndex(newHistory.length - 1)
          }

          setHistory(newHistory)

          // Set cursor position after the inserted list marker
          setTimeout(() => {
            textarea.focus()
            textarea.setSelectionRange(cursorPos + insertion.length, cursorPos + insertion.length)
            updateCursorPosition()
          }, 0)
        }
        return
      }
    }

    // Check if Ctrl/Cmd key is pressed for shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "b":
          e.preventDefault()
          insertMarkdown("**", "**")
          break
        case "i":
          e.preventDefault()
          insertMarkdown("*", "*")
          break
        case "k":
          e.preventDefault()
          insertMarkdown("[", "](url)")
          break
        case "1":
          e.preventDefault()
          insertMarkdown("# ", "\n")
          break
        case "2":
          e.preventDefault()
          insertMarkdown("## ", "\n")
          break
        case "3":
          e.preventDefault()
          insertMarkdown("### ", "\n")
          break
        case "q":
          e.preventDefault()
          insertMarkdown("> ", "\n")
          break
        case "l":
          e.preventDefault()
          insertMarkdown("- ", "\n")
          break
        case "o":
          e.preventDefault()
          insertMarkdown("1. ", "\n")
          // Show the numbering tip when creating a numbered list
          setShowNumberingTip(true)
          // Hide the tip after 5 seconds
          setTimeout(() => setShowNumberingTip(false), 5000)
          break
        case "`":
          e.preventDefault()
          insertMarkdown("```\n", "\n```")
          break
        case "z":
          if (!e.shiftKey) {
            e.preventDefault()
            handleUndo()
          } else {
            e.preventDefault()
            handleRedo()
          }
          break
        case "y":
          e.preventDefault()
          handleRedo()
          break
      }
    }
  }

  const handleMouseUp = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = markdown.substring(start, end)

    if (text && text.length > 0) {
      setSelectedText({ text, start, end })
    }

    updateCursorPosition()
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    // Store the current selection when right-clicking
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = markdown.substring(start, end)

    if (text && text.length > 0) {
      setSelectedText({ text, start, end })
    }
  }

  const formatButtons = [
    { icon: <Heading size={18} />, action: () => insertMarkdown("## ", "\n"), tooltip: "Heading" },
    { icon: <Bold size={18} />, action: () => insertMarkdown("**", "**"), tooltip: "Bold" },
    { icon: <Italic size={18} />, action: () => insertMarkdown("*", "*"), tooltip: "Italic" },
    { icon: <Code size={18} />, action: () => insertMarkdown("`", "`"), tooltip: "Inline Code", divider: true },
    { icon: <Link size={18} />, action: () => insertMarkdown("[", "](url)"), tooltip: "Link" },
    { icon: <List size={18} />, action: () => insertMarkdown("- ", "\n"), tooltip: "Bullet List", divider: true },
    {
      icon: <ListOrdered size={18} />,
      action: () => {
        insertMarkdown("1. ", "\n")
        // Show the numbering tip when creating a numbered list
        setShowNumberingTip(true)
        // Hide the tip after 5 seconds
        setTimeout(() => setShowNumberingTip(false), 5000)
      },
      tooltip: "Numbered List",
    },
    { icon: <Quote size={18} />, action: () => insertMarkdown("> ", "\n"), tooltip: "Quote", divider: true },
    { icon: <Paperclip size={18} />, action: () => {}, tooltip: "Attach File", divider: true },
    {
      icon: <SplitSquareVertical size={18} />,
      action: toggleViewMode,
      tooltip: viewMode === "tabs" ? "Split View" : "Tab View",
    },
    {
      icon: copied ? <Check size={18} /> : <Copy size={18} />,
      action: copyToClipboard,
      tooltip: copied ? "Copied!" : "Copy Content",
    },
    { icon: <Save size={18} />, action: saveContent, tooltip: "Save", disabled: isSaved },
    { icon: <Undo size={18} />, action: handleUndo, tooltip: "Undo", disabled: historyIndex <= 0 },
    { icon: <Redo size={18} />, action: handleRedo, tooltip: "Redo", disabled: historyIndex >= history.length - 1 },
  ]

  const insertTable = () => {
    const tableTemplate = `
| Header 1 | Header 2 | Header 3 |
| -------- | -------- | -------- |
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`
    insertMarkdown(tableTemplate, "")
  }

  const handleOrderedList = () => {
    insertMarkdown("1. ", "\n")
    // Show the numbering tip when creating a numbered list
    setShowNumberingTip(true)
    // Hide the tip after 5 seconds
    setTimeout(() => setShowNumberingTip(false), 5000)
  }

  // Render the editor content
  const renderEditor = () => (
    <div className="w-full h-full relative" onContextMenu={handleContextMenu}>
      <ContextMenu>
        <ContextMenuTrigger className="w-full h-full block">
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onMouseUp={handleMouseUp}
            onSelect={updateCursorPosition}
            className="w-full min-h-[400px] p-4 font-mono text-sm bg-transparent border-0 focus:ring-0 focus:outline-none resize-none text-foreground"
            placeholder="Add your markdown here..."
            aria-label="Markdown editor"
            spellCheck="false"
          />
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64">
          <ContextMenuItem onClick={() => insertMarkdown("**", "**")} className="flex items-center gap-2">
            <Bold size={16} />
            <span>Bold</span>
            <ContextMenuShortcut>⌘B</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => insertMarkdown("*", "*")} className="flex items-center gap-2">
            <Italic size={16} />
            <span>Italic</span>
            <ContextMenuShortcut>⌘I</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => insertMarkdown("~~", "~~")} className="flex items-center gap-2">
            <Strikethrough size={16} />
            <span>Strikethrough</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => insertMarkdown("`", "`")} className="flex items-center gap-2">
            <Code size={16} />
            <span>Inline Code</span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => insertMarkdown("```\n", "\n```")} className="flex items-center gap-2">
            <Code size={16} />
            <span>Code Block</span>
            <ContextMenuShortcut>⌘`</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => insertMarkdown("[", "](url)")} className="flex items-center gap-2">
            <Link2 size={16} />
            <span>Link</span>
            <ContextMenuShortcut>⌘K</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => insertMarkdown("![alt text](", ")")} className="flex items-center gap-2">
            <ImageIcon size={16} />
            <span>Image</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => insertMarkdown("# ", "")} className="flex items-center gap-2">
            <Heading size={16} />
            <span>Heading 1</span>
            <ContextMenuShortcut>⌘1</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => insertMarkdown("## ", "")} className="flex items-center gap-2">
            <Heading size={16} />
            <span>Heading 2</span>
            <ContextMenuShortcut>⌘2</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => insertMarkdown("### ", "")} className="flex items-center gap-2">
            <Heading size={16} />
            <span>Heading 3</span>
            <ContextMenuShortcut>⌘3</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => insertMarkdown("> ", "")} className="flex items-center gap-2">
            <Quote size={16} />
            <span>Quote</span>
            <ContextMenuShortcut>⌘Q</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => insertMarkdown("- ", "")} className="flex items-center gap-2">
            <List size={16} />
            <span>Bullet List</span>
            <ContextMenuShortcut>⌘L</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={handleOrderedList} className="flex items-center gap-2">
            <ListOrdered size={16} />
            <span>Numbered List</span>
            <ContextMenuShortcut>⌘O</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={insertTable} className="flex items-center gap-2">
            <Table size={16} />
            <span>Table</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={saveContent} className="flex items-center gap-2">
            <Save size={16} />
            <span>Save</span>
            <ContextMenuShortcut>⌘S</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={handleUndo} className="flex items-center gap-2">
            <Undo size={16} />
            <span>Undo</span>
            <ContextMenuShortcut>⌘Z</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={handleRedo} className="flex items-center gap-2">
            <Redo size={16} />
            <span>Redo</span>
            <ContextMenuShortcut>⌘Y</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Automatic numbering tip */}
      {showNumberingTip && (
        <div className="absolute bottom-4 right-4 bg-primary/10 border border-primary/20 rounded-lg p-3 max-w-xs shadow-sm">
          <div className="flex items-start gap-2">
            <Info size={18} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-medium text-primary">Automatic Numbering</p>
              <p className="text-xs text-muted-foreground mt-1">
                Markdown supports automatic numbering. You can use "1." for all items and they'll be numbered correctly
                in the preview.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Render the preview content
  const renderPreview = () => (
    <div className="markdown-preview p-4 min-h-[400px] prose dark:prose-invert max-w-none prose-img:rounded prose-img:my-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "")
            return !inline && match ? (
              <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" {...props}>
                {String(children).replace(/\n$/, "")}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            )
          },
        }}
      >
        {previewContent}
      </ReactMarkdown>
    </div>
  )

  return (
    <div className="border rounded-lg shadow-sm bg-card text-card-foreground overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center border-b">
          {viewMode === "tabs" && (
            <TabsList className="bg-transparent border-b-0 h-12 px-4">
              <TabsTrigger
                value="write"
                className={cn(
                  "data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 font-medium",
                  "text-muted-foreground data-[state=active]:text-primary",
                )}
              >
                Write
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className={cn(
                  "data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-4 font-medium",
                  "text-muted-foreground data-[state=active]:text-primary",
                )}
              >
                Preview
              </TabsTrigger>
            </TabsList>
          )}

          {viewMode === "split" && (
            <div className="h-12 px-4 flex items-center">
              <h2 className="text-sm font-medium">Split View</h2>
            </div>
          )}

          <div className="flex-1 flex justify-end px-2 border-l">
            <TooltipProvider>
              <div className="flex items-center space-x-1">
                {formatButtons.map((button, index) => (
                  <div key={index} className="flex items-center">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded text-muted-foreground hover:text-foreground"
                          onClick={button.action}
                          disabled={button.disabled}
                          aria-label={button.tooltip}
                        >
                          {button.icon}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{button.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                    {button.divider && <div className="h-6 w-px bg-border mx-1" aria-hidden="true" />}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </div>

        {viewMode === "tabs" ? (
          <>
            <TabsContent value="write" className="p-0 m-0 relative">
              {renderEditor()}
            </TabsContent>
            <TabsContent value="preview" className="p-0 m-0">
              {renderPreview()}
            </TabsContent>
          </>
        ) : (
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 border-r relative">{renderEditor()}</div>
            <div className="w-full md:w-1/2">{renderPreview()}</div>
          </div>
        )}
      </Tabs>

      <div className="flex items-center px-4 py-2 border-t text-sm text-muted-foreground">
        <div className="flex items-center">
          <Code size={16} className="mr-1.5" />
          <span>Markdown is supported</span>
        </div>
        <div className="ml-auto flex items-center">
          {!isSaved && <span className="text-xs text-muted-foreground mr-2 italic">Unsaved changes</span>}
          <div className="flex items-center">
            <Paperclip size={16} className="mr-1.5" />
            <span>
              Line {cursorPosition.line}, Column {cursorPosition.column}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
