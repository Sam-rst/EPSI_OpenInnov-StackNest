import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StreamedLogs } from '../StreamedLogs'

describe('StreamedLogs', () => {
  it('en provisioning sans logs : attend les premiers logs + pastille « live »', () => {
    render(<StreamedLogs logs={[]} isDone={false} provisioning={true} />)

    expect(screen.getByText(/En attente des premiers logs/)).toBeInTheDocument()
    expect(screen.getByText('live')).toBeInTheDocument()
  })

  it('déploiement déjà terminé sans logs : message honnête, pas de « live » trompeur', () => {
    // Pub/sub éphémère : un déploiement ouvert après son provisioning n'a aucun log
    // à rejouer. On l'affiche honnêtement au lieu d'« en attente » + « live » sans fin.
    render(<StreamedLogs logs={[]} isDone={false} provisioning={false} />)

    expect(screen.queryByText(/En attente des premiers logs/)).toBeNull()
    expect(screen.getByText(/uniquement pendant le provisioning/i)).toBeInTheDocument()
    expect(screen.queryByText('live')).toBeNull()
  })
})
