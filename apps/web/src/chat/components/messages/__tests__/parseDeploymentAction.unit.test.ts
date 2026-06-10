import { describe, expect, it } from 'vitest'

import { parseDeploymentAction } from '../parseDeploymentAction'

describe('parseDeploymentAction', () => {
  it('extrait le template_id d’un bloc json de déploiement', () => {
    const content = [
      'Voici la configuration proposée :',
      '```json',
      '{ "template_id": "pg16", "name": "ma-db" }',
      '```',
    ].join('\n')

    const result = parseDeploymentAction(content)

    expect(result).not.toBeNull()
    expect(result?.templateId).toBe('pg16')
    // Le texte hors bloc est conservé pour l'afficher au-dessus du CTA.
    expect(result?.precedingText).toContain('configuration proposée')
  })

  it('accepte la clé camelCase templateId', () => {
    const content = '```json\n{ "templateId": "redis7" }\n```'

    expect(parseDeploymentAction(content)?.templateId).toBe('redis7')
  })

  it('renvoie null sans bloc json', () => {
    expect(parseDeploymentAction('Juste du texte, pas de JSON.')).toBeNull()
  })

  it('renvoie null si le bloc json n’a pas de template_id', () => {
    const content = '```json\n{ "name": "x", "cpu": 2 }\n```'

    expect(parseDeploymentAction(content)).toBeNull()
  })

  it('renvoie null si le json est invalide (best-effort, pas de crash)', () => {
    const content = '```json\n{ template_id: pas-du-json }\n```'

    expect(parseDeploymentAction(content)).toBeNull()
  })

  it('ignore un template_id non-chaîne', () => {
    const content = '```json\n{ "template_id": 42 }\n```'

    expect(parseDeploymentAction(content)).toBeNull()
  })
})
