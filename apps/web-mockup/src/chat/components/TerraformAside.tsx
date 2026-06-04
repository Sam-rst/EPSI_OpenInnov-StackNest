const TF_CONTENT = `resource "docker_network" "sandbox_yassine" {
  name = "sandbox-yassine"
}

resource "docker_container" "pg" {
  name    = "pg-sandbox-yassine"
  image   = "postgres:16-alpine"
  network = "sandbox-yassine"
}

resource "docker_container" "redis" {
  name    = "redis-sandbox-yassine"
  image   = "redis:7-alpine"
  network = "sandbox-yassine"
}`;

export function TerraformAside() {
  return (
    <aside className="border-l border-border bg-surface-elevated overflow-y-auto">
      <div className="p-4 border-b border-border">
        <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-text-muted">
          Aperçu Terraform
        </div>
        <div className="text-[12px] mt-1 text-text-secondary">Mis à jour à chaque message</div>
      </div>
      <pre className="font-mono text-[11px] leading-[1.65] p-4 bg-code-bg text-text-primary">
        {TF_CONTENT}
      </pre>
    </aside>
  );
}
