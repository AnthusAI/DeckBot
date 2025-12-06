export function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-3 p-4 text-muted-foreground text-sm">
      <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
      <span>Thinking...</span>
    </div>
  )
}

