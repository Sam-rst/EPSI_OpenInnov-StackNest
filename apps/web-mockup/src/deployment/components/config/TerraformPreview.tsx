import { Badge, Card, Icon } from '@core/ui';
import { TerraformLine } from './TerraformLine';
import type { ConfigState } from '../../hooks/useConfigState';
import type { InstanceSize } from '../../data/sizes';

interface TerraformPreviewProps {
  state: ConfigState;
  sizeObj: InstanceSize;
  flashedKeys: ReadonlySet<string>;
}

const HEADER = `terraform {
  required_providers {
    docker = { source = "kreuzwerker/docker" }
  }
}

`;

const FOOTER = (name: string) => `  ports { internal = 5432; external = 5432 }
  restart = "unless-stopped"
}

resource "docker_volume" "${name}_data" {
  name = "${name}-data"
}`;

export function TerraformPreview({ state, sizeObj, flashedKeys }: TerraformPreviewProps) {
  const { name, version, size, storage, env, region, backups } = state;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between px-4 h-10 border-b border-border bg-surface-sunken">
        <div className="flex items-center gap-2">
          <Icon name="file-code-2" size={13} className="text-cyan" />
          <span className="font-mono text-[12px] text-text-primary">main.tf</span>
          <Badge tone="cyan">live</Badge>
        </div>
        <button type="button" className="text-[11.5px] flex items-center gap-1 text-text-muted">
          <Icon name="copy" size={12} /> Copier
        </button>
      </div>
      <pre className="font-mono text-[12px] leading-[1.7] p-4 overflow-x-auto bg-code-bg text-text-primary">
        {HEADER}
        <TerraformLine flashKey="name" flashedKeys={flashedKeys}>{`resource "docker_container" "${name}" {`}</TerraformLine>
        <TerraformLine flashKey="name" flashedKeys={flashedKeys}>{`  name  = "${name}"`}</TerraformLine>
        <TerraformLine flashKey="version" flashedKeys={flashedKeys}>{`  image = "postgres:${version}-alpine"`}</TerraformLine>
        <TerraformLine flashKey="size" flashedKeys={flashedKeys}>{`  # taille: ${size} (${sizeObj.cpu}, ${sizeObj.ram})`}</TerraformLine>
        <TerraformLine flashKey="env" flashedKeys={flashedKeys}>{`  env   = ["POSTGRES_DB=app", "STACKNEST_ENV=${env}"]`}</TerraformLine>
        <TerraformLine flashKey="region" flashedKeys={flashedKeys}>{`  # région: ${region}`}</TerraformLine>
        <TerraformLine flashKey="storage" flashedKeys={flashedKeys}>{`  volumes { host_path = "/data/${name}"; container_path = "/var/lib/postgresql/data" }`}</TerraformLine>
        <TerraformLine flashKey="storage" flashedKeys={flashedKeys}>{`  # stockage: ${storage} GB`}</TerraformLine>
        <TerraformLine flashKey="backups" flashedKeys={flashedKeys}>{`  # backups: ${backups ? 'enabled (daily, 30d retention)' : 'disabled'}`}</TerraformLine>
        {FOOTER(name)}
      </pre>
    </Card>
  );
}
