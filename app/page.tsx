import MarkdownEditor from "@/components/markdown/editor"

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Markdown Editor</h1>
        <MarkdownEditor />
      </div>
    </main>
  )
}
