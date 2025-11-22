"use client"

import type React from "react"

import { useCallback } from "react"

interface KeyboardShortcutsProps {
  markdown: string
  textareaRef: React.RefObject<HTMLTextAreaElement>
  insertMarkdown: (prefix: string, suffix?: string) => void
  handleUndo: () => void
  handleRedo: () => void
  saveContent: () => void
  showTip: () => void
  updateCursorPosition: () => void
  setSelectedText: (selection: { text: string; start: number; end: number }) => void
}

export function useEditorKeyboardShortcuts({
  markdown,
  textareaRef,
  insertMarkdown,
  handleUndo,
  handleRedo,
  saveContent,
  showTip,
  updateCursorPosition,
  setSelectedText,
}: KeyboardShortcutsProps) {
  return useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

          // Save the current scroll position
          const scrollTop = textarea.scrollTop

          const [, indent, num, space, text] = numberedListMatch

          // If the line is empty (except for the list marker), end the list
          if (!text.trim()) {
            // Remove the list marker and add a newline
            const beforeText = currentValue.substring(0, lineStart)
            const afterText = currentValue.substring(cursorPos)

            // Create new text without the list marker
            const newText = beforeText + "\n" + afterText

            // Update the markdown content directly
            const selectionStart = textarea.selectionStart
            const selectionEnd = textarea.selectionEnd

            // We need to replace the entire content and then restore cursor position
            textarea.setSelectionRange(0, currentValue.length)
            document.execCommand("insertText", false, newText)

            // Set cursor position after the inserted newline
            setTimeout(() => {
              textarea.focus()
              textarea.setSelectionRange(lineStart + 1, lineStart + 1)

              // Restore scroll position
              textarea.scrollTop = scrollTop

              updateCursorPosition()
            }, 0)
          } else {
            // Calculate the next number for better UX, even though Markdown will auto-number
            const nextNumber = Number.parseInt(num) + 1

            // Continue the list with the next number for better UX
            const insertion = `\n${indent}${nextNumber}.${space}`

            // Insert the list continuation at the cursor position
            insertMarkdown(insertion)

            // Set cursor position after the inserted list marker
            setTimeout(() => {
              textarea.focus()
              const newPos = cursorPos + insertion.length
              textarea.setSelectionRange(newPos, newPos)

              // Restore scroll position
              textarea.scrollTop = scrollTop

              updateCursorPosition()
            }, 0)
          }
          return
        }

        // Check if we're in a bullet list
        const bulletListMatch = currentLine.match(/^(\s*)(-|\*|\+)(\s+)(.*)/)
        if (bulletListMatch) {
          e.preventDefault()

          // Save the current scroll position
          const scrollTop = textarea.scrollTop

          const [, indent, bullet, space, text] = bulletListMatch

          // If the line is empty (except for the list marker), end the list
          if (!text.trim()) {
            // Remove the list marker and add a newline
            const beforeText = currentValue.substring(0, lineStart)
            const afterText = currentValue.substring(cursorPos)

            // Create new text without the list marker
            const newText = beforeText + "\n" + afterText

            // Update the markdown content directly
            const selectionStart = textarea.selectionStart
            const selectionEnd = textarea.selectionEnd

            // We need to replace the entire content and then restore cursor position
            textarea.setSelectionRange(0, currentValue.length)
            document.execCommand("insertText", false, newText)

            // Set cursor position after the inserted newline
            setTimeout(() => {
              textarea.focus()
              textarea.setSelectionRange(lineStart + 1, lineStart + 1)

              // Restore scroll position
              textarea.scrollTop = scrollTop

              updateCursorPosition()
            }, 0)
          } else {
            // Continue the list with the same bullet
            const insertion = `\n${indent}${bullet}${space}`

            // Insert the list continuation at the cursor position
            insertMarkdown(insertion)

            // Set cursor position after the inserted list marker
            setTimeout(() => {
              textarea.focus()
              const newPos = cursorPos + insertion.length
              textarea.setSelectionRange(newPos, newPos)

              // Restore scroll position
              textarea.scrollTop = scrollTop

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
            showTip()
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
    },
    [markdown, insertMarkdown, handleUndo, handleRedo, saveContent, showTip, updateCursorPosition, setSelectedText],
  )
}
