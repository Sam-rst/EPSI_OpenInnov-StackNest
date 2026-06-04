import { describe, expect, it } from 'vitest'
import { cn } from '../cn'

describe('cn', () => {
  it('concatène plusieurs classes', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1')
  })

  it('ignore les valeurs falsy (composition conditionnelle)', () => {
    expect(cn('px-2', false, null, undefined, '', 'py-1')).toBe('px-2 py-1')
  })

  it('résout les classes conditionnelles fournies via un objet', () => {
    expect(cn('px-2', { 'text-error': true, 'text-success': false })).toBe('px-2 text-error')
  })

  it('aplatit les tableaux de classes', () => {
    expect(cn(['px-2', 'py-1'], 'gap-2')).toBe('px-2 py-1 gap-2')
  })

  it('dédoublonne les classes Tailwind conflictuelles (la dernière gagne)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('ne fusionne que les conflits de même famille', () => {
    expect(cn('p-2 text-text-primary', 'p-4')).toBe('text-text-primary p-4')
  })
})
