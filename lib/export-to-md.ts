export function exportToMarkdown(markdownContent: string) {
  const blob = new Blob([markdownContent], { type: "text/markdown" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "document.md"
  a.click()
  URL.revokeObjectURL(url)
}
