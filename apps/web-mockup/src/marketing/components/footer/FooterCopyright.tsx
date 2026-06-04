export function FooterCopyright() {
  const buildDate = new Date().toISOString().slice(0, 10);
  return (
    <div className="mt-12 pt-6 border-t border-[#0d3e57] flex items-center justify-between text-[12px] text-[#94aabb]">
      <span>© 2026 StackNest — EPSI OpenInnov</span>
      <span className="font-mono">Build {buildDate} · v1.0.0</span>
    </div>
  );
}
