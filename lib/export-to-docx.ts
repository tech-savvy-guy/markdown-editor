const getConverterServiceUrl = (): string => {
  return process.env.NEXT_PUBLIC_CONVERTER_SERVICE_URL || "http://localhost:8000"
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
    const serviceUrl = getConverterServiceUrl()
    const response = await fetch(`${serviceUrl}/convert`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        markdown: markdownContent,
        format: "docx",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `Conversion failed: ${response.status} ${response.statusText}. ${errorText}`
      )
    }

    // Get the filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get("Content-Disposition")
    let filename = "document.docx"
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }

    const blob = await response.blob()
    downloadBlob(blob, filename)
  } catch (error) {
    console.error("Error exporting to Word:", error)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      alert(
        `Failed to connect to converter service. Make sure the service is running at ${getConverterServiceUrl()}`
      )
    } else {
      alert(`Failed to export to Word: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
