"use client"

import { FloatingDock } from "@/components/ui/floating-dock"
import { MarkdownIcon, WordIcon, PDFIcon } from "@/components/icons"

import { exportToPDF } from "@/lib/export-to-pdf"
import { exportToWord } from "@/lib/export-to-docx"
import { exportToMarkdown } from "@/lib/export-to-md"

interface ExportToolbarProps {
  markdownContent: string
  previewRef?: React.RefObject<HTMLDivElement | null>
}

export function ExportToolbar({ markdownContent, previewRef }: ExportToolbarProps) {

  const items = [
    { 
      icon: <MarkdownIcon />,
      title: "Markdown", 
      onClick: () => exportToMarkdown(markdownContent),
    },
    { 
      icon: <WordIcon />,
      title: "Word Document", 
      onClick: () => exportToWord(markdownContent),
    },
    { 
      icon: <PDFIcon />,
      title: "PDF File", 
      onClick: () => exportToPDF(previewRef, markdownContent),
    },
  ]

  return (
    <div className="flex justify-center pb-6">
      <FloatingDock 
        items={items} 
        desktopClassName="mx-auto"
        mobileClassName="fixed bottom-6 right-6 z-50"
      />
    </div>
  )
}

