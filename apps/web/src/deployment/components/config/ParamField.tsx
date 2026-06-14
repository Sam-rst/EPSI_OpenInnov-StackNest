import { Select } from '../../../shared/components/ui'
import { Field } from '../common/Field'
import { ParamKind } from '../../types/enums/ParamKind'
import type { TemplateConfigParam } from '../../types/models/TemplateConfig'

interface ParamFieldProps {
  param: TemplateConfigParam
  value: string
  /** Message d'erreur de validation (paramètre requis vide), si présent (#2 #5). */
  error?: string
  onChange: (value: string) => void
}

const CONTROL_CLASS =
  'border-border bg-surface focus:border-cyan h-10 w-full rounded-md border px-3 font-mono text-[13px] text-text-primary outline-none transition'

const CONTROL_ERROR_CLASS =
  'border-error bg-surface focus:border-error h-10 w-full rounded-md border px-3 font-mono text-[13px] text-text-primary outline-none transition'

/** Type d'input HTML selon le type métier du paramètre (secret masqué, int numérique). */
function inputType(kind: ParamKind): string {
  if (kind === ParamKind.SECRET) return 'password'
  if (kind === ParamKind.INT) return 'number'
  return 'text'
}

/** Rend un paramètre de provisioning selon son type (string/int/bool/select/secret). */
export function ParamField({ param, value, error, onChange }: ParamFieldProps) {
  const fieldId = `param-${param.key}`
  const hint = param.required ? 'Requis' : 'Optionnel'
  const invalid = error !== undefined
  const controlClass = invalid ? CONTROL_ERROR_CLASS : CONTROL_CLASS

  if (param.type === ParamKind.BOOL) {
    return (
      <Field label={param.label} hint={hint} error={error} htmlFor={fieldId}>
        <Select id={fieldId} value={value} onChange={onChange} invalid={invalid}>
          <option value="true">Activé</option>
          <option value="false">Désactivé</option>
        </Select>
      </Field>
    )
  }

  if (param.type === ParamKind.SELECT && param.options) {
    return (
      <Field label={param.label} hint={hint} error={error} htmlFor={fieldId}>
        <Select id={fieldId} value={value} onChange={onChange} invalid={invalid}>
          {param.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </Field>
    )
  }

  const isInt = param.type === ParamKind.INT

  return (
    <Field label={param.label} hint={hint} error={error} htmlFor={fieldId}>
      <input
        id={fieldId}
        type={inputType(param.type)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        // Bornes appliquées uniquement aux INT, et seulement quand le descripteur
        // les fournit (sinon `undefined` => attribut absent, champ non borné).
        min={isInt ? param.min : undefined}
        max={isInt ? param.max : undefined}
        step={isInt ? param.step : undefined}
        className={controlClass}
      />
    </Field>
  )
}
