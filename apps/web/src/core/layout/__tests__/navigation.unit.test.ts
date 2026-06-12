import { describe, expect, it } from 'vitest'

import { SIDEBAR_NAV, TOPBAR_TITLES } from '../navigation'

describe('navigation config', () => {
  it('expose les 7 entrées de navigation principale', () => {
    expect(SIDEBAR_NAV).toHaveLength(7)
  })

  it('répartit 5 entrées Plateforme et 2 Administration', () => {
    const main = SIDEBAR_NAV.filter((item) => item.group === 'main')
    const admin = SIDEBAR_NAV.filter((item) => item.group === 'admin')

    expect(main).toHaveLength(5)
    expect(admin).toHaveLength(2)
  })

  it('place le Dashboard en première position de la navigation', () => {
    const main = SIDEBAR_NAV.filter((item) => item.group === 'main')

    expect(SIDEBAR_NAV[0]?.id).toBe('dashboard')
    expect(main[0]?.id).toBe('dashboard')
  })

  it('expose une entrée Stacks vers le composeur', () => {
    const stacks = SIDEBAR_NAV.find((item) => item.id === 'stacks')

    expect(stacks?.to).toBe('/stacks')
    expect(stacks?.group).toBe('main')
  })

  it('marque ChatOps IA comme nouveauté', () => {
    const chat = SIDEBAR_NAV.find((item) => item.id === 'chat')

    expect(chat?.badge).toBe('Nouveau')
    expect(chat?.to).toBe('/chat')
  })

  it('route Équipe et Paramètres vers leurs pages dédiées', () => {
    const team = SIDEBAR_NAV.find((item) => item.id === 'team')
    const settings = SIDEBAR_NAV.find((item) => item.id === 'settings')

    expect(team?.to).toBe('/team')
    expect(settings?.to).toBe('/settings')
  })

  it('fournit un titre + sous-titre pour chaque route du shell', () => {
    expect(TOPBAR_TITLES['/catalog']).toEqual({
      title: 'Catalogue',
      subtitle: 'Choisis une ressource à provisionner',
    })
    expect(TOPBAR_TITLES['/deployments/config']).toEqual({
      title: 'Configurer',
      subtitle: 'Paramètres et aperçu Terraform live',
    })
  })
})
