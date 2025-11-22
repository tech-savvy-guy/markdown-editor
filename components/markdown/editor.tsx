"use client"

import type React from "react"
import { useRef, useCallback } from "react"
import { EditorContent } from "@/components/markdown/content"
import { useEditorHistory } from "@/hooks/use-editor-history"
import { useCursorPosition } from "@/hooks/use-cursor-position"

interface EditorProps {
  markdown: string
  setMarkdown: (value: string) => void
  setIsSaved: (value: boolean) => void
  selectedText: { text: string; start: number; end: number }
  setSelectedText: (selection: { text: string; start: number; end: number }) => void
}

export function Editor({
  markdown,
  setMarkdown,
  setIsSaved,
  selectedText,
  setSelectedText,
}: EditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { addToHistory, handleUndo, handleRedo } = useEditorHistory(
    markdown,
    setMarkdown,
    setIsSaved,
  )

  const { updateCursorPosition } = useCursorPosition(textareaRef)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setMarkdown(newValue)
      setIsSaved(false)
      updateCursorPosition()
      addToHistory(newValue)
    },
    [setMarkdown, setIsSaved, updateCursorPosition, addToHistory],
  )

  const insertMarkdown = useCallback(
    (prefix: string, suffix = "") => {
      const textarea = textareaRef.current
      if (!textarea) return

      // Save the current scroll position
      const scrollTop = textarea.scrollTop

      // If no suffix is provided and prefix contains a newline, treat it as direct content insertion
      if (!suffix && (prefix === "\n" || prefix.startsWith("\n"))) {
        const cursorPos = textarea.selectionStart
        const newText = markdown.substring(0, cursorPos) + prefix + markdown.substring(cursorPos)
        setMarkdown(newText)
        setIsSaved(false)
        addToHistory(newText)

        // Set cursor position after insertion
        setTimeout(() => {
          textarea.focus()
          const newPos = cursorPos + prefix.length
          textarea.setSelectionRange(newPos, newPos)

          // Restore scroll position
          textarea.scrollTop = scrollTop

          updateCursorPosition()
        }, 0)
        return
      }

      // Use the stored selection if available, otherwise get current selection
      const start = selectedText.start || textarea.selectionStart
      const end = selectedText.end || textarea.selectionEnd
      const text = selectedText.text || markdown.substring(start, end)

      const beforeText = markdown.substring(0, start)
      const afterText = markdown.substring(end)

      const newText = beforeText + prefix + text + suffix + afterText
      setMarkdown(newText)
      setIsSaved(false)
      addToHistory(newText)

      // Focus and set cursor position after operation
      setTimeout(() => {
        textarea.focus()

        if (text.length > 0) {
          // If text was selected, keep only the original text selected (not the prefix/suffix)
          const newStart = start + prefix.length
          const newEnd = start + prefix.length + text.length
          textarea.setSelectionRange(newStart, newEnd)
          
          // Update selectedText to reflect the new selection (original text only)
          setSelectedText({ text: text, start: newStart, end: newEnd })
        } else {
          // If no text was selected, place cursor between prefix and suffix
          textarea.setSelectionRange(start + prefix.length, start + prefix.length)
          setSelectedText({ text: "", start: 0, end: 0 })
        }

        // Restore scroll position
        textarea.scrollTop = scrollTop

        updateCursorPosition()
      }, 0)
    },
    [markdown, selectedText, setMarkdown, setIsSaved, addToHistory, setSelectedText, updateCursorPosition],
  )

  // Function to directly update the markdown content
  const updateMarkdownContent = useCallback(
    (newContent: string, newCursorPos: number) => {
      const textarea = textareaRef.current
      if (!textarea) return

      // Save the current scroll position
      const scrollTop = textarea.scrollTop

      // Update the content
      setMarkdown(newContent)
      setIsSaved(false)
      addToHistory(newContent)

      // Set cursor position
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(newCursorPos, newCursorPos)

        // Restore scroll position
        textarea.scrollTop = scrollTop

        updateCursorPosition()
      }, 0)
    },
    [setMarkdown, setIsSaved, addToHistory, updateCursorPosition],
  )

  const saveContent = useCallback(() => {
    localStorage.setItem("markdown-editor-content", markdown)
    setIsSaved(true)
  }, [markdown, setIsSaved])

  return (
    <EditorContent
      textareaRef={textareaRef}
      markdown={markdown}
      handleChange={handleChange}
      updateCursorPosition={updateCursorPosition}
      selectedText={selectedText}
      setSelectedText={setSelectedText}
      insertMarkdown={insertMarkdown}
      handleUndo={handleUndo}
      handleRedo={handleRedo}
      saveContent={saveContent}
      showTip={() => {}}
      showNumberingTip={false}
      updateMarkdownContent={updateMarkdownContent}
    />
  )
}
