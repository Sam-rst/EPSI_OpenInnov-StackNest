import { Select } from '../../../shared/components/ui'
import { Card } from '../common/Card'
import { Field } from '../common/Field'
import { DEPLOYMENT_ENVS, type DeploymentEnv } from '../../hooks/useDeploymentConfigForm'

interface IdentityCardProps {
  name: string
  env: DeploymentEnv
  /** Message d'erreur de validation du nom (label DNS / requis), si présent (#3 #5). */
  nameError?: string
  onName: (value: string) => void
  onEnv: (value: DeploymentEnv) => void
}

const INPUT_CLASS =
  'border-border bg-surface focus:border-cyan h-10 w-full rounded-md border px-3 font-mono text-[13px] text-text-primary outline-none transition'

/** Variante d'input en erreur : bordure rouge, pour signaler visuellement (#5). */
const INPUT_ERROR_CLASS =
  'border-error bg-surface focus:border-error h-10 w-full rounded-md border px-3 font-mono text-[13px] text-text-primary outline-none transition'

/** Carte Identité : nom de la ressource (requis, label DNS) + environnement. */
export function IdentityCard({ name, env, nameError, onName, onEnv }: IdentityCardProps) {
  return (
    <Card className="p-5">
      <h2 className="text-text-muted mb-4 font-mono text-[12px] tracking-[0.14em] uppercase">
        Identité
      </h2>
      <Field
        label="Nom de la ressource"
        hint="Minuscules, chiffres et tirets. Unique dans le workspace."
        error={nameError}
        htmlFor="dep-name"
      >
        <input
          id="dep-name"
          value={name}
          onChange={(event) => onName(event.target.value)}
          placeholder="ex. ma-base"
          aria-invalid={nameError !== undefined}
          className={nameError ? INPUT_ERROR_CLASS : INPUT_CLASS}
        />
      </Field>
      <div className="mt-3">
        <Field label="Environnement" htmlFor="dep-env">
          <Select id="dep-env" value={env} onChange={(value) => onEnv(value as DeploymentEnv)}>
            {DEPLOYMENT_ENVS.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Card>
  )
}
