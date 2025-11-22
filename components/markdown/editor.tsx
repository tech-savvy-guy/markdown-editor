"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { EditorToolbar } from "./editor-toolbar"
import { EditorContent } from "./editor-content"
import { MarkdownPreview } from "./markdown-preview"
import { EditorFooter } from "./editor-footer"
import { useMarkdownState } from "./hooks/use-markdown-state"
import { useEditorHistory } from "./hooks/use-editor-history"
import { useCursorPosition } from "./hooks/use-cursor-position"

export default function MarkdownEditor() {
  const [activeTab, setActiveTab] = useState<string>("write")
  const [showNumberingTip, setShowNumberingTip] = useState(false)
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Custom hooks for state management
  const { markdown, setMarkdown, previewContent, isSaved, setIsSaved, selectedText, setSelectedText } =
    useMarkdownState()

  const { history, historyIndex, addToHistory, handleUndo, handleRedo } = useEditorHistory(
    markdown,
    setMarkdown,
    setIsSaved,
  )

  const { cursorPosition, updateCursorPosition } = useCursorPosition(textareaRef)

  // Load saved view mode preference

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
          // If text was selected, place cursor after the selection + suffix
          textarea.setSelectionRange(
            start + prefix.length + text.length + suffix.length,
            start + prefix.length + text.length + suffix.length,
          )
        } else {
          // If no text was selected, place cursor between prefix and suffix
          textarea.setSelectionRange(start + prefix.length, start + prefix.length)
        }

        // Restore scroll position
        textarea.scrollTop = scrollTop

        // Clear the stored selection
        setSelectedText({ text: "", start: 0, end: 0 })
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

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(markdown).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [markdown])

  const showTip = useCallback(() => {
    setShowNumberingTip(true)
    setTimeout(() => setShowNumberingTip(false), 5000)
  }, [])

  return (
    <div className="border rounded-lg shadow-sm bg-card text-card-foreground overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Make the toolbar sticky */}
        <div className="sticky top-0 z-10 bg-card border-b shadow-sm">
          <div className="flex items-center">
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

            <EditorToolbar
              insertMarkdown={insertMarkdown}
              handleUndo={handleUndo}
              handleRedo={handleRedo}
              saveContent={saveContent}
              copyToClipboard={copyToClipboard}
              showTip={showTip}
              copied={copied}
              isSaved={isSaved}
              historyIndex={historyIndex}
              historyLength={history.length}
            />
          </div>
        </div>

        <div className="relative">
          <TabsContent value="write" className="p-0 m-0 relative">
            <EditorContent
              textareaRef={textareaRef}
              markdown={markdown}
              handleChange={handleChange}
              updateCursorPosition={updateCursorPosition}
              setSelectedText={setSelectedText}
              insertMarkdown={insertMarkdown}
              handleUndo={handleUndo}
              handleRedo={handleRedo}
              saveContent={saveContent}
              showTip={showTip}
              showNumberingTip={showNumberingTip}
              updateMarkdownContent={updateMarkdownContent}
            />
          </TabsContent>
          <TabsContent value="preview" className="p-0 m-0">
            <MarkdownPreview content={previewContent} />
          </TabsContent>
        </div>
      </Tabs>

      <EditorFooter isSaved={isSaved} cursorPosition={cursorPosition} />
    </div>
  )
}
