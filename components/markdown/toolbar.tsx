"use client"

import type React from "react"
import { useState, useEffect } from "react"

import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import { useMediaQuery } from "@/hooks/use-media-query"
import { Bold, Italic, Code, Link, List, ListOrdered, Heading } from "lucide-react"

interface ToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  insertMarkdown: (prefix: string, suffix?: string) => void
  setSelectedText: (selection: { text: string; start: number; end: number }) => void
}

export function Toolbar({ textareaRef, insertMarkdown, setSelectedText }: ToolbarProps) {
  const [modKey, setModKey] = useState("⌘")
  const isLargeScreen = useMediaQuery("(min-width: 768px)")

  useEffect(() => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
    setModKey(isMac ? "⌘" : "Ctrl")
  }, [])

  const handleClick = (prefix: string, suffix = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    setSelectedText({ text: textarea.value.substring(start, end), start, end })
    requestAnimationFrame(() => insertMarkdown(prefix, suffix))
  }

  const buttons = [
    [Bold, "**", "**", "Bold", "B"],
    [Italic, "*", "*", "Italic", "I"],
    [Code, "`", "`", "Code", "`"],
    [Link, "[", "](url)", "Link", "K"],
    [Heading, "## ", "", "Heading", "2"],
    [List, "- ", "", "List", "L"],
    [ListOrdered, "1. ", "", "Num List", "O"],
  ] as const

  return (
    <div className={`${isLargeScreen ? "absolute" : "fixed"} bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 bg-card border border-border rounded-lg shadow-lg p-1`}>
      {buttons.map(([Icon, prefix, suffix, tooltip, shortcut], i) => (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded hover:bg-muted"
              onClick={(e) => {
                e.preventDefault()
                handleClick(prefix, suffix)
              }}
            >
              <Icon size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="flex items-center gap-2">
            <span>{tooltip}</span>
            <KbdGroup>
              <Kbd>{modKey} + {shortcut}</Kbd>
            </KbdGroup>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

