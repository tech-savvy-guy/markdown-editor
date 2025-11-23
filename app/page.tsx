"use client"

import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable"

import { Editor } from "@/components/markdown/editor"
import { MarkdownPreview } from "@/components/markdown/preview"

import { useMarkdownState } from "@/hooks/use-markdown-state"
import { useMediaQuery } from "@/hooks/use-media-query"

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("write")
  const isLargeScreen = useMediaQuery("(min-width: 768px)")

  // State management
  const { markdown, setMarkdown, previewContent, isSaved, setIsSaved, selectedText, setSelectedText } =
    useMarkdownState()

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

  return (
    <div className="bg-background w-full h-screen flex flex-col">
      {isLargeScreen === null ? (
        // Render empty div until we know the screen size to prevent flash
        <div className="w-full h-full" />
      ) : isLargeScreen ? (
        // Large screens: Side-by-side with resizable panes
        <>
          {/* Header with theme toggle */}
          <div className="flex items-center justify-center border-b border-border/40 relative flex-shrink-0 select-none">
            <div className="h-10 flex items-center w-full">
              <div className="flex-1 flex items-center justify-center border-r border-border/40">
                <span className="text-sm text-muted-foreground">Write</span>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Preview</span>
              </div>
            </div>
            <ThemeToggle />
          </div>
          {/* Content area */}
          <div className="relative flex-1 min-h-0">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full w-full relative">
                  <Editor
                    markdown={markdown}
                    setMarkdown={setMarkdown}
                    setIsSaved={setIsSaved}
                    selectedText={selectedText}
                    setSelectedText={setSelectedText}
                  />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full w-full overflow-auto scrollbar-minimal">
                  <MarkdownPreview content={previewContent} />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </>
      ) : (
        // Small screens: Tabs
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          {/* Header with theme toggle */}
          <div className="flex items-center justify-center border-b border-border/40 relative flex-shrink-0">
            <TabsList className="bg-transparent border-0 h-10 px-2">
              <TabsTrigger
                value="write"
                className={cn(
                  "data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-foreground px-6 text-sm",
                  "text-muted-foreground data-[state=active]:text-foreground",
                )}
              >
                Write
              </TabsTrigger>
              <TabsTrigger
                value="preview"
                className={cn(
                  "data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-foreground px-6 text-sm",
                  "text-muted-foreground data-[state=active]:text-foreground",
                )}
              >
                Preview
              </TabsTrigger>
            </TabsList>
            <ThemeToggle />
          </div>
          {/* Content area */}
          <div className="relative flex-1 min-h-0">
            <TabsContent value="write" className="p-0 m-0 absolute inset-0">
              <Editor
                markdown={markdown}
                setMarkdown={setMarkdown}
                setIsSaved={setIsSaved}
                selectedText={selectedText}
                setSelectedText={setSelectedText}
              />
            </TabsContent>
            <TabsContent value="preview" className="p-0 m-0 absolute inset-0 overflow-auto scrollbar-minimal">
              <MarkdownPreview content={previewContent} />
            </TabsContent>
          </div>
        </Tabs>
      )}
    </div>
  )
}
