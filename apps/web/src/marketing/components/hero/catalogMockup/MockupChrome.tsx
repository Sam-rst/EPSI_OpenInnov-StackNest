/** Barre de fenêtre stylisée (feux tricolores + URL) du mockup catalogue. */
export function MockupChrome() {
  return (
    <div className="flex h-9 items-center gap-2 border-b border-[#0d3e57] bg-[#021824] px-4">
      <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
      <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
      <span className="h-3 w-3 rounded-full bg-[#28c840]" />
      <div className="ml-3 rounded-md border border-[#0d3e57] bg-[#073047] px-3 py-1 font-mono text-[11px] text-[#94aabb]">
        app.stacknest.dev/catalog
      </div>
    </div>
  )
}
