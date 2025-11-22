"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

interface ExportToolbarProps {
  markdownContent: string
  previewRef?: React.RefObject<HTMLDivElement | null>
}

export function ExportToolbar({ markdownContent, previewRef }: ExportToolbarProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark")
  const markdownIcon = isDark ? "/md-icon-dark.svg" : "/md-icon.svg"

  const exportToMarkdown = () => {
    const blob = new Blob([markdownContent], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "document.md"
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToWord = async () => {
    try {
      // Use docx library which is fully browser-compatible
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx")

      // Parse markdown into structured content
      const lines = markdownContent.split("\n")
      const children: any[] = []

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        if (!line.trim()) {
          // Empty line
          children.push(new Paragraph({ text: "" }))
          continue
        }

        // Headers
        if (line.startsWith("# ")) {
          children.push(new Paragraph({
            text: line.substring(2),
            heading: HeadingLevel.HEADING_1,
          }))
        } else if (line.startsWith("## ")) {
          children.push(new Paragraph({
            text: line.substring(3),
            heading: HeadingLevel.HEADING_2,
          }))
        } else if (line.startsWith("### ")) {
          children.push(new Paragraph({
            text: line.substring(4),
            heading: HeadingLevel.HEADING_3,
          }))
        } else if (line.startsWith("#### ")) {
          children.push(new Paragraph({
            text: line.substring(5),
            heading: HeadingLevel.HEADING_4,
          }))
        } else if (line.startsWith("##### ")) {
          children.push(new Paragraph({
            text: line.substring(6),
            heading: HeadingLevel.HEADING_5,
          }))
        } else if (line.startsWith("###### ")) {
          children.push(new Paragraph({
            text: line.substring(7),
            heading: HeadingLevel.HEADING_6,
          }))
        }
        // Blockquote
        else if (line.startsWith("> ")) {
          children.push(new Paragraph({
            children: [new TextRun({
              text: line.substring(2),
              italics: true,
            })],
            indent: { left: 720 }, // 0.5 inch
          }))
        }
        // List items
        else if (line.match(/^[-*+]\s/)) {
          children.push(new Paragraph({
            text: line.substring(2),
            bullet: { level: 0 },
          }))
        }
        else if (line.match(/^\d+\.\s/)) {
          const match = line.match(/^(\d+)\.\s(.*)/)
          if (match) {
            children.push(new Paragraph({
              text: match[2],
              numbering: { reference: "default-numbering", level: 0 },
            }))
          }
        }
        // Code blocks
        else if (line.startsWith("```")) {
          const codeLines: string[] = []
          i++ // Skip opening ```
          while (i < lines.length && !lines[i].startsWith("```")) {
            codeLines.push(lines[i])
            i++
          }
          children.push(new Paragraph({
            children: [new TextRun({
              text: codeLines.join("\n"),
              font: "Courier New",
              size: 20,
            })],
            shading: { fill: "F5F5F5" },
          }))
        }
        // Regular paragraph with inline formatting
        else {
          const textRuns = await parseInlineFormatting(line)
          children.push(new Paragraph({ children: textRuns }))
        }
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: children,
        }],
      })

      const blob = await Packer.toBlob(doc)
      downloadBlob(blob, "document.docx")
    } catch (error) {
      console.error("Error exporting to Word:", error)
      alert(`Failed to export to Word: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const parseInlineFormatting = async (text: string): Promise<any[]> => {
    const { TextRun } = await import("docx")
    const textRuns: any[] = []
    let currentText = ""
    let i = 0

    while (i < text.length) {
      // Bold **text**
      if (text.substring(i, i + 2) === "**") {
        if (currentText) {
          textRuns.push(new TextRun({ text: currentText }))
          currentText = ""
        }
        i += 2
        let boldText = ""
        while (i < text.length && text.substring(i, i + 2) !== "**") {
          boldText += text[i]
          i++
        }
        if (boldText) {
          textRuns.push(new TextRun({ text: boldText, bold: true }))
        }
        i += 2
      }
      // Italic *text*
      else if (text[i] === "*" && text[i + 1] !== "*") {
        if (currentText) {
          textRuns.push(new TextRun({ text: currentText }))
          currentText = ""
        }
        i++
        let italicText = ""
        while (i < text.length && text[i] !== "*") {
          italicText += text[i]
          i++
        }
        if (italicText) {
          textRuns.push(new TextRun({ text: italicText, italics: true }))
        }
        i++
      }
      // Inline code `text`
      else if (text[i] === "`") {
        if (currentText) {
          textRuns.push(new TextRun({ text: currentText }))
          currentText = ""
        }
        i++
        let codeText = ""
        while (i < text.length && text[i] !== "`") {
          codeText += text[i]
          i++
        }
        if (codeText) {
          textRuns.push(new TextRun({
            text: codeText,
            font: "Courier New",
            shading: { fill: "F5F5F5" }
          }))
        }
        i++
      }
      else {
        currentText += text[i]
        i++
      }
    }

    if (currentText) {
      textRuns.push(new TextRun({ text: currentText }))
    }

    return textRuns.length > 0 ? textRuns : [new TextRun({ text: text })]
  }

  const exportToPDF = async () => {
    try {
      // Dynamically import libraries to avoid SSR issues
      const html2canvas = (await import("html2canvas")).default
      // @ts-ignore
      const jsPDF = (await import("jspdf")).jsPDF

      const previewElement = previewRef?.current
      if (!previewElement) {
        alert("Preview element not found. Please ensure the preview is visible.")
        return
      }

      // Get the prose content element
      const proseElement = previewElement.querySelector(".prose") as HTMLElement
      if (!proseElement) {
        alert("Content not found. Please try again.")
        return
      }

      // Create a temporary container for better PDF rendering
      const tempContainer = document.createElement("div")
      tempContainer.style.position = "absolute"
      tempContainer.style.left = "-9999px"
      tempContainer.style.top = "0"
      tempContainer.style.width = "816px" // A4 width in pixels at 96 DPI
      tempContainer.style.padding = "40px"
      tempContainer.style.backgroundColor = "#ffffff"
      tempContainer.style.color = "#000000"
      tempContainer.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"

      const clonedProse = proseElement.cloneNode(true) as HTMLElement

      // Apply styles to ensure proper rendering
      clonedProse.style.maxWidth = "100%"
      clonedProse.style.color = "#000000"

      // Remove any problematic styles from cloned element
      clonedProse.querySelectorAll("*").forEach((el) => {
        const element = el as HTMLElement
        if (element.style) {
          // Keep text color dark for PDF
          if (element.style.color && element.style.color !== "inherit") {
            element.style.color = "#000000"
          }
          // Ensure backgrounds are white or transparent
          if (element.style.backgroundColor && element.style.backgroundColor !== "transparent") {
            element.style.backgroundColor = "#f5f5f5"
          }
        }
      })

      tempContainer.appendChild(clonedProse)
      document.body.appendChild(tempContainer)

      // Give browser time to render
      await new Promise(resolve => setTimeout(resolve, 100))

      // Capture the element as canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight,
      })

      // Clean up temporary container
      document.body.removeChild(tempContainer)

      // Create PDF
      const imgData = canvas.toDataURL("image/png")

      // @ts-ignore
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save("document.pdf")
    } catch (error) {
      console.error("Error exporting to PDF:", error)
      alert(`Failed to export to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const buttons = [
    { icon: markdownIcon, label: "Markdown", action: exportToMarkdown },
    { icon: "/docx-icon.svg", label: "Word Document", action: exportToWord },
    { icon: "/pdf-icon.svg", label: "PDF File", action: exportToPDF },
  ]

  return (
    <div className="flex justify-center pb-6">
      <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm">
        {buttons.map(({ icon, label, action }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={action}
                className="h-9 w-9 rounded-full hover:bg-muted/70 active:scale-95 transition-all"
              >
                <Image 
                  src={icon} 
                  alt={label} 
                  width={20} 
                  height={20}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  )
}

