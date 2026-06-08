import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { deploymentErrorMessage } from '../deploymentErrorMessage'

/** Construit une AxiosError porteuse d'une réponse HTTP (status + corps). */
function axiosErrorWith(status: number, data: unknown): AxiosError {
  const error = new AxiosError('Request failed')
  error.response = {
    status,
    statusText: '',
    data,
    headers: {},
    config: { headers: new AxiosHeaders() },
  }
  return error
}

describe('deploymentErrorMessage', () => {
  it('renvoie le message métier de l’API (champ message) tel quel', () => {
    const error = axiosErrorWith(409, {
      error: 'deployment_name_taken',
      message: 'Ce nom est déjà utilisé.',
    })

    expect(deploymentErrorMessage(error)).toBe('Ce nom est déjà utilisé.')
  })

  it('renvoie le detail string d’une 422 FastAPI', () => {
    const error = axiosErrorWith(422, { detail: 'Champ invalide.' })

    expect(deploymentErrorMessage(error)).toBe('Champ invalide.')
  })

  it('agrège les messages d’une 422 de validation FastAPI (detail liste)', () => {
    const error = axiosErrorWith(422, {
      detail: [{ loc: ['body', 'name'], msg: 'String too short', type: 'value_error' }],
    })

    expect(deploymentErrorMessage(error)).toContain('String too short')
  })

  it('retombe sur un message lisible quand le corps n’est pas exploitable', () => {
    const error = axiosErrorWith(500, { unexpected: true })

    expect(deploymentErrorMessage(error)).toMatch(/erreur/i)
  })

  it('renvoie un message réseau quand il n’y a pas de réponse HTTP', () => {
    const error = new AxiosError('Network Error')

    expect(deploymentErrorMessage(error)).toMatch(/réseau|erreur/i)
  })

  it('gère une erreur non-axios sans planter', () => {
    expect(deploymentErrorMessage(new Error('boom'))).toMatch(/erreur/i)
    expect(deploymentErrorMessage('boom')).toMatch(/erreur/i)
  })
})
