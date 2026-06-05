/** Démo interne « Terraform » : extrait HCL avec diff coloré illustratif. */
export function InnerTerraform() {
  return (
    <pre className="bg-code-bg border-border overflow-hidden rounded-md border p-3 font-mono text-[11.5px] leading-[1.65]">
      <span className="text-text-muted">resource</span>{' '}
      <span className="text-[#9b5805]">&quot;docker_container&quot;</span>{' '}
      <span className="text-[#9b5805]">&quot;pg&quot;</span> {'{'}
      <br />
      {'  '}name = <span className="text-cyan">&quot;pg-prod&quot;</span>
      <br />
      <span style={{ background: 'rgba(34,197,94,0.15)' }}>
        {'+ '}image = <span className="text-cyan">&quot;postgres:16-alpine&quot;</span>
      </span>
      <br />
      <span style={{ background: 'rgba(196,43,28,0.15)' }}>
        {'- '}image = <span className="text-cyan">&quot;postgres:15&quot;</span>
      </span>
      <br />
      {'  '}env = [<span className="text-cyan">&quot;POSTGRES_DB=app&quot;</span>]
      <br />
      {'}'}
    </pre>
  )
}
