"use client"

import type React from "react"

import { useState, useCallback } from "react"

export function useCursorPosition(textareaRef: React.RefObject<HTMLTextAreaElement | null>) {
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 })

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
  }, [textareaRef])

  return {
    cursorPosition,
    updateCursorPosition,
  }
}
