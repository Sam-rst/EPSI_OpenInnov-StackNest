import { Field } from '../common/Field'
import { ParamKind } from '../../types/enums/ParamKind'
import type { TemplateConfigParam } from '../../types/models/TemplateConfig'

interface ParamFieldProps {
  param: TemplateConfigParam
  value: string
  onChange: (value: string) => void
}

const CONTROL_CLASS =
  'border-border bg-surface focus:border-cyan h-10 w-full rounded-md border px-3 font-mono text-[13px] text-text-primary outline-none transition'

/** Rend un paramètre de provisioning selon son type (string/int/bool/select/secret). */
export function ParamField({ param, value, onChange }: ParamFieldProps) {
  const fieldId = `param-${param.key}`
  const hint = param.required ? 'Requis' : 'Optionnel'

  if (param.type === ParamKind.BOOL) {
    return (
      <Field label={param.label} hint={hint} htmlFor={fieldId}>
        <select
          id={fieldId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={CONTROL_CLASS}
        >
          <option value="true">Activé</option>
          <option value="false">Désactivé</option>
        </select>
      </Field>
    )
  }

  if (param.type === ParamKind.SELECT && param.options) {
    return (
      <Field label={param.label} hint={hint} htmlFor={fieldId}>
        <select
          id={fieldId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={CONTROL_CLASS}
        >
          {param.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
    )
  }

  return (
    <Field label={param.label} hint={hint} htmlFor={fieldId}>
      <input
        id={fieldId}
        type={
          param.type === ParamKind.SECRET
            ? 'password'
            : param.type === ParamKind.INT
              ? 'number'
              : 'text'
        }
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={CONTROL_CLASS}
      />
    </Field>
  )
}
