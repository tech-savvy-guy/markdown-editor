"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  Save,
  Copy,
  Check,
} from "lucide-react"

interface EditorToolbarProps {
  insertMarkdown: (prefix: string, suffix?: string) => void
  handleUndo: () => void
  handleRedo: () => void
  saveContent: () => void
  copyToClipboard: () => void
  showTip: () => void
  copied: boolean
  isSaved: boolean
  historyIndex: number
  historyLength: number
}

export function EditorToolbar({
  insertMarkdown,
  handleUndo,
  handleRedo,
  saveContent,
  copyToClipboard,
  showTip,
  copied,
  isSaved,
  historyIndex,
  historyLength,
}: EditorToolbarProps) {
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
        showTip()
      },
      tooltip: "Numbered List",
    },
    { icon: <Quote size={18} />, action: () => insertMarkdown("> ", "\n"), tooltip: "Quote", divider: true },
    { icon: <Paperclip size={18} />, action: () => {}, tooltip: "Attach File", divider: true },
    {
      icon: copied ? <Check size={18} /> : <Copy size={18} />,
      action: copyToClipboard,
      tooltip: copied ? "Copied!" : "Copy Content",
    },
    { icon: <Save size={18} />, action: saveContent, tooltip: "Save", disabled: isSaved },
    { icon: <Undo size={18} />, action: handleUndo, tooltip: "Undo", disabled: historyIndex <= 0 },
    { icon: <Redo size={18} />, action: handleRedo, tooltip: "Redo", disabled: historyIndex >= historyLength - 1 },
  ]

  return (
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
  )
}
