"use client"

import type React from "react"
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuShortcut,
  ContextMenuSeparator,
} from "@/components/ui/context-menu"
import { Toolbar } from "@/components/markdown/toolbar"

import { useEditorKeyboardShortcuts } from "@/hooks/use-editor-keyboard-shortcuts"
import { Bold, Italic, Code, Link2, ImageIcon, Heading, Quote, List, ListOrdered, Table, Save, Undo, Redo, Strikethrough } from "lucide-react"

interface EditorContentProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  markdown: string
  handleChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  updateCursorPosition: () => void
  selectedText: { text: string; start: number; end: number }
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
  selectedText,
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

  const handleSelect = () => {
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
            onSelect={handleSelect}
            className="w-full h-full p-8 pb-20 font-mono text-sm bg-transparent border-0 focus:ring-0 focus:outline-none resize-none text-foreground scrollbar-minimal"
            placeholder="Start writing..."
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
            <span>Num List</span>
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

      <Toolbar
        textareaRef={textareaRef}
        insertMarkdown={insertMarkdown}
        setSelectedText={setSelectedText}
      />
    </div>
  )
}


