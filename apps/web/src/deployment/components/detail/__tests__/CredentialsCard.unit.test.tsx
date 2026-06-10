import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { DeploymentAccess } from '../../../types/models/DeploymentEvent'
import { CredentialsCard } from '../CredentialsCard'

const access: DeploymentAccess = { url: 'host:5432', password: 'p4ss-genere' }

describe('CredentialsCard', () => {
  it('affiche le nom d’utilisateur de connexion quand il est fourni', () => {
    render(<CredentialsCard access={access} username="postgres" />)

    expect(screen.getByText('utilisateur')).toBeInTheDocument()
    expect(screen.getByText('postgres')).toBeInTheDocument()
  })

  it('n’affiche pas la ligne utilisateur quand le template n’a pas de compte par défaut', () => {
    render(<CredentialsCard access={access} username={null} />)

    expect(screen.queryByText('utilisateur')).not.toBeInTheDocument()
  })

  it('affiche toujours l’adresse et le mot de passe (masqué par défaut)', () => {
    render(<CredentialsCard access={access} username="postgres" />)

    expect(screen.getByText('host:5432')).toBeInTheDocument()
    expect(screen.getByText('adresse')).toBeInTheDocument()
    expect(screen.getByText('mot de passe')).toBeInTheDocument()
  })
})
