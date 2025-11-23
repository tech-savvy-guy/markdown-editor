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

export async function exportToWord(markdownContent: string) {
  try {
    // Use docx library which is fully browser-compatible
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import("docx")

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
