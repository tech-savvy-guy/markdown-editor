"use client"

import type React from "react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  ContextMenuShortcut,
} from "@/components/ui/context-menu"
import {
  Info,
  Bold,
  Italic,
  Code,
  Link2,
  ImageIcon,
  Heading,
  Quote,
  List,
  ListOrdered,
  Table,
  Save,
  Undo,
  Redo,
  Strikethrough,
} from "lucide-react"
import { useEditorKeyboardShortcuts } from "./hooks/use-editor-keyboard-shortcuts"

interface EditorContentProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  markdown: string
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  updateCursorPosition: () => void
  setSelectedText: (selection: { text: string; start: number; end: number }) => void
  insertMarkdown: (prefix: string, suffix?: string) => void
  handleUndo: () => void
  handleRedo: () => void
  saveContent: () => void
  showTip: () => void
  showNumberingTip: boolean
  updateMarkdownContent?: (newContent: string, newCursorPos: number) => void
}

export function EditorContent({
  textareaRef,
  markdown,
  handleChange,
  updateCursorPosition,
  setSelectedText,
  insertMarkdown,
  handleUndo,
  handleRedo,
  saveContent,
  showTip,
  showNumberingTip,
  updateMarkdownContent,
}: EditorContentProps) {
  const handleKeyDown = useEditorKeyboardShortcuts({
    markdown,
    textareaRef,
    insertMarkdown,
    handleUndo,
    handleRedo,
    saveContent,
    showTip,
    updateCursorPosition,
    setSelectedText,
  })

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
    showTip()
  }

  // Wrapper function to preserve scroll position for context menu actions
  const handleContextMenuAction = (action: () => void) => {
    // Save scroll position before action
    const textarea = textareaRef.current
    if (textarea) {
      const scrollTop = textarea.scrollTop

      // Execute the action
      action()

      // Restore scroll position after a short delay to ensure DOM updates
      setTimeout(() => {
        if (textarea) {
          textarea.scrollTop = scrollTop
        }
      }, 10)
    } else {
      action()
    }
  }

  return (
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
          <ContextMenuItem
            onClick={() => handleContextMenuAction(() => insertMarkdown("**", "**"))}
            className="flex items-center gap-2"
          >
            <Bold size={16} />
            <span>Bold</span>
            <ContextMenuShortcut>⌘B</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleContextMenuAction(() => insertMarkdown("*", "*"))}
            className="flex items-center gap-2"
          >
            <Italic size={16} />
            <span>Italic</span>
            <ContextMenuShortcut>⌘I</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleContextMenuAction(() => insertMarkdown("~~", "~~"))}
            className="flex items-center gap-2"
          >
            <Strikethrough size={16} />
            <span>Strikethrough</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => handleContextMenuAction(() => insertMarkdown("`", "`"))}
            className="flex items-center gap-2"
          >
            <Code size={16} />
            <span>Inline Code</span>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleContextMenuAction(() => insertMarkdown("```\n", "\n```"))}
            className="flex items-center gap-2"
          >
            <Code size={16} />
            <span>Code Block</span>
            <ContextMenuShortcut>⌘`</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => handleContextMenuAction(() => insertMarkdown("[", "](url)"))}
            className="flex items-center gap-2"
          >
            <Link2 size={16} />
            <span>Link</span>
            <ContextMenuShortcut>⌘K</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleContextMenuAction(() => insertMarkdown("![alt text](", ")"))}
            className="flex items-center gap-2"
          >
            <ImageIcon size={16} />
            <span>Image</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => handleContextMenuAction(() => insertMarkdown("# ", ""))}
            className="flex items-center gap-2"
          >
            <Heading size={16} />
            <span>Heading 1</span>
            <ContextMenuShortcut>⌘1</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleContextMenuAction(() => insertMarkdown("## ", ""))}
            className="flex items-center gap-2"
          >
            <Heading size={16} />
            <span>Heading 2</span>
            <ContextMenuShortcut>⌘2</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleContextMenuAction(() => insertMarkdown("### ", ""))}
            className="flex items-center gap-2"
          >
            <Heading size={16} />
            <span>Heading 3</span>
            <ContextMenuShortcut>⌘3</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => handleContextMenuAction(() => insertMarkdown("> ", ""))}
            className="flex items-center gap-2"
          >
            <Quote size={16} />
            <span>Quote</span>
            <ContextMenuShortcut>⌘Q</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleContextMenuAction(() => insertMarkdown("- ", ""))}
            className="flex items-center gap-2"
          >
            <List size={16} />
            <span>Bullet List</span>
            <ContextMenuShortcut>⌘L</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => handleContextMenuAction(handleOrderedList)}
            className="flex items-center gap-2"
          >
            <ListOrdered size={16} />
            <span>Numbered List</span>
            <ContextMenuShortcut>⌘O</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleContextMenuAction(insertTable)} className="flex items-center gap-2">
            <Table size={16} />
            <span>Table</span>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => handleContextMenuAction(saveContent)} className="flex items-center gap-2">
            <Save size={16} />
            <span>Save</span>
            <ContextMenuShortcut>⌘S</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => handleContextMenuAction(handleUndo)} className="flex items-center gap-2">
            <Undo size={16} />
            <span>Undo</span>
            <ContextMenuShortcut>⌘Z</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => handleContextMenuAction(handleRedo)} className="flex items-center gap-2">
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
}
