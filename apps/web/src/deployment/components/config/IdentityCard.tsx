import { Card } from '../common/Card'
import { Field } from '../common/Field'
import { DEPLOYMENT_ENVS, type DeploymentEnv } from '../../hooks/useDeploymentConfigForm'

interface IdentityCardProps {
  name: string
  env: DeploymentEnv
  onName: (value: string) => void
  onEnv: (value: DeploymentEnv) => void
}

const INPUT_CLASS =
  'border-border bg-surface focus:border-cyan h-10 w-full rounded-md border px-3 font-mono text-[13px] text-text-primary outline-none transition'

/** Carte Identité : nom de la ressource (requis) + environnement. */
export function IdentityCard({ name, env, onName, onEnv }: IdentityCardProps) {
  return (
    <Card className="p-5">
      <h2 className="text-text-muted mb-4 font-mono text-[12px] tracking-[0.14em] uppercase">
        Identité
      </h2>
      <Field
        label="Nom de la ressource"
        hint="Doit être unique dans le workspace"
        htmlFor="dep-name"
      >
        <input
          id="dep-name"
          value={name}
          onChange={(event) => onName(event.target.value)}
          placeholder="ex. ma-base"
          className={INPUT_CLASS}
        />
      </Field>
      <div className="mt-3">
        <Field label="Environnement" htmlFor="dep-env">
          <select
            id="dep-env"
            value={env}
            onChange={(event) => onEnv(event.target.value as DeploymentEnv)}
            className={INPUT_CLASS}
          >
            {DEPLOYMENT_ENVS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Card>
  )
}
