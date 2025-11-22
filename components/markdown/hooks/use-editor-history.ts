"use client"

import { useState, useEffect, useCallback } from "react"

// Maximum number of history entries to store
const MAX_HISTORY_LENGTH = 100

export function useEditorHistory(
  markdown: string,
  setMarkdown: (value: string) => void,
  setIsSaved: (value: boolean) => void,
) {
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)

  // Initialize history with the current markdown
  useEffect(() => {
    if (history.length === 0) {
      setHistory([markdown])
      setHistoryIndex(0)
    }
  }, [markdown, history.length])

  const addToHistory = useCallback(
    (newValue: string) => {
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
    [history, historyIndex],
  )

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setMarkdown(history[historyIndex - 1])
      setIsSaved(false)
    }
  }, [history, historyIndex, setMarkdown, setIsSaved])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setMarkdown(history[historyIndex + 1])
      setIsSaved(false)
    }
  }, [history, historyIndex, setMarkdown, setIsSaved])

  return {
    history,
    historyIndex,
    addToHistory,
    handleUndo,
    handleRedo,
  }
}
