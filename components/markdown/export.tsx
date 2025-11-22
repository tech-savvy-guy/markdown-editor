"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { FileText, FileDown, FileType } from "lucide-react"
import { useMediaQuery } from "@/hooks/use-media-query"

interface ExportToolbarProps {
  markdownContent: string
  previewRef?: React.RefObject<HTMLDivElement | null>
}

export function ExportToolbar({ markdownContent, previewRef }: ExportToolbarProps) {
  const isLargeScreen = useMediaQuery("(min-width: 768px)")

  const exportToMarkdown = () => {
    const blob = new Blob([markdownContent], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "document.md"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportToWord = async () => {
    try {
      // Dynamically import html-docx-js dist to avoid node dependencies (fs)
      // @ts-ignore - html-docx-js doesn't have proper TypeScript types
      const htmlDocx = (await import("html-docx-js/dist/html-docx.js")).default
      
      // Get the rendered HTML from the preview
      const previewElement = previewRef?.current
      if (!previewElement) {
        // Fallback: convert markdown to HTML using a simple approach
        const htmlContent = await convertMarkdownToHTML(markdownContent)
        // @ts-ignore
        const docx = htmlDocx.asBlob(htmlContent)
        downloadBlob(docx, "document.docx")
        return
      }

      // Clone the preview element to avoid modifying the original
      const clonedElement = previewElement.cloneNode(true) as HTMLElement
      
      // Extract the prose content
      const proseElement = clonedElement.querySelector(".prose")
      if (proseElement) {
        // Create a full HTML document
        const htmlContent = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
                h1, h2, h3, h4, h5, h6 { font-weight: 600; margin-top: 1em; margin-bottom: 0.5em; }
                p { margin-bottom: 1em; line-height: 1.7; }
                code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
                pre { background: #f4f4f4; padding: 12px; border-radius: 6px; overflow-x: auto; }
                blockquote { border-left: 4px solid #ccc; padding-left: 16px; margin-left: 0; font-style: italic; }
                table { border-collapse: collapse; width: 100%; margin: 1em 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; font-weight: 600; }
                img { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>
              ${proseElement.innerHTML}
            </body>
          </html>
        `
        // @ts-ignore
        const docx = htmlDocx.asBlob(htmlContent)
        downloadBlob(docx, "document.docx")
      } else {
        // Fallback to markdown conversion
        const htmlContent = await convertMarkdownToHTML(markdownContent)
        // @ts-ignore
        const docx = htmlDocx.asBlob(htmlContent)
        downloadBlob(docx, "document.docx")
      }
    } catch (error) {
      console.error("Error exporting to Word:", error)
      alert("Failed to export to Word. Please try again.")
    }
  }

  const exportToPDF = async () => {
    try {
      // Dynamically import libraries to avoid SSR issues
      // @ts-ignore - html2canvas types are available but may have issues
      const html2canvas = (await import("html2canvas")).default
      // @ts-ignore - jspdf types are available but may have issues
      const { jsPDF } = await import("jspdf")

      const previewElement = previewRef?.current
      if (!previewElement) {
        alert("Preview element not found. Please ensure the preview is visible.")
        return
      }

      // Get the prose content element
      const proseElement = previewElement.querySelector(".prose")
      if (!proseElement) {
        alert("Content not found. Please try again.")
        return
      }

      // Create a temporary container for better PDF rendering
      const tempContainer = document.createElement("div")
      tempContainer.style.position = "absolute"
      tempContainer.style.left = "-9999px"
      tempContainer.style.width = "816px" // A4 width in pixels at 96 DPI
      tempContainer.style.padding = "40px"
      tempContainer.style.backgroundColor = getComputedStyle(document.documentElement).getPropertyValue("--background") || "#ffffff"
      tempContainer.style.color = getComputedStyle(document.documentElement).getPropertyValue("--foreground") || "#000000"
      
      const clonedProse = proseElement.cloneNode(true) as HTMLElement
      tempContainer.appendChild(clonedProse)
      document.body.appendChild(tempContainer)

      // Capture the element as canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: tempContainer.style.backgroundColor,
      })

      // Clean up temporary container
      document.body.removeChild(tempContainer)

      // Create PDF
      const imgData = canvas.toDataURL("image/png")
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
      alert("Failed to export to PDF. Please try again.")
    }
  }

  const convertMarkdownToHTML = async (markdown: string): Promise<string> => {
    // Simple markdown to HTML conversion for fallback
    // This is a basic implementation - you might want to use a proper markdown parser
    let html = markdown
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^\*\*(.*)\*\*/gim, "<strong>$1</strong>")
      .replace(/^\*(.*)\*/gim, "<em>$1</em>")
      .replace(/^\- (.*$)/gim, "<li>$1</li>")
      .replace(/^> (.*$)/gim, "<blockquote>$1</blockquote>")
      .replace(/\n/g, "<br>")

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 20px; }
            h1, h2, h3 { font-weight: 600; margin-top: 1em; }
            p { margin-bottom: 1em; line-height: 1.7; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `
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
    [FileText, "Export Markdown", exportToMarkdown],
    [FileType, "Export Word", exportToWord],
    [FileDown, "Export PDF", exportToPDF],
  ] as const

  return (
    <div className="flex justify-center pb-8">
      <div className="flex items-center gap-1 bg-card border border-border rounded-lg shadow-lg p-1 z-50">
        {buttons.map(([Icon, tooltip, onClick], i) => (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded hover:bg-muted"
              onClick={(e) => {
                e.preventDefault()
                onClick()
              }}
            >
              <Icon size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <span>{tooltip}</span>
          </TooltipContent>
        </Tooltip>
      ))}
      </div>
    </div>
  )
}

