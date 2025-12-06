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

export async function exportToPDF(
  previewRef?: React.RefObject<HTMLDivElement | null>,
  markdownContent?: string
) {
  try {
    // If markdown content is provided, use the microservice (preferred method)
    if (markdownContent) {
      const serviceUrl = getConverterServiceUrl()
      const response = await fetch(`${serviceUrl}/convert`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markdown: markdownContent,
          format: "pdf",
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
      let filename = "document.pdf"
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      const blob = await response.blob()
      downloadBlob(blob, filename)
      return
    }

    // Fallback to client-side rendering if markdown content is not available
    // This maintains backward compatibility
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
    if (error instanceof TypeError && error.message.includes("fetch")) {
      alert(
        `Failed to connect to converter service. Make sure the service is running at ${getConverterServiceUrl()}`
      )
    } else {
      alert(`Failed to export to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
