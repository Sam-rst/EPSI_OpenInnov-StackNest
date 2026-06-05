/** Bas de footer : mention légale et information de build. */
export function FooterCopyright() {
  const buildDate = new Date().toISOString().slice(0, 10)
  return (
    <div className="mt-12 flex items-center justify-between border-t border-[#0d3e57] pt-6 text-[12px] text-[#94aabb]">
      <span>&copy; 2026 StackNest — EPSI OpenInnov</span>
      <span className="font-mono">Build {buildDate} · v1.0.0</span>
    </div>
  )
}
