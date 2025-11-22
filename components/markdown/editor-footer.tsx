interface EditorFooterProps {
  isSaved: boolean
  cursorPosition: { line: number; column: number }
}

export function EditorFooter({ isSaved, cursorPosition }: EditorFooterProps) {
  return (
    <div className="flex items-center px-4 py-2 border-t text-sm text-muted-foreground">
      <div className="flex items-center">
        {!isSaved && <span className="text-xs text-muted-foreground mr-2 italic">Saving changes...</span>}
      </div>
      <div className="ml-auto flex items-center">
        
        <div className="flex items-center">
          <span>
            Line {cursorPosition.line}, Column {cursorPosition.column}
          </span>
        </div>
      </div>
    </div>
  )
}
