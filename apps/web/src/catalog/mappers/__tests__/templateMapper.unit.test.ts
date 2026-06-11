import { describe, expect, it } from 'vitest'

import type { TemplateCardDTO } from '../../types/dto/TemplateCardDTO'
import type { TemplateDetailDTO } from '../../types/dto/TemplateDetailDTO'
import { mapCardDtoToCatalogItem, mapDetailDtoToTemplateDetail } from '../templateMapper'

const cardDto: TemplateCardDTO = {
  id: 'pg16',
  slug: 'postgresql',
  name: 'PostgreSQL',
  icon: 'database',
  category: 'database',
  provider: 'Docker',
  engine: 'docker',
  tags: ['SQL', 'Persistant'],
  description: 'Base relationnelle managée.',
  popular: true,
}

describe('mapCardDtoToCatalogItem', () => {
  it('mappe les champs plats de la carte', () => {
    const item = mapCardDtoToCatalogItem(cardDto)

    expect(item.id).toBe('pg16')
    expect(item.name).toBe('PostgreSQL')
    expect(item.icon).toBe('database')
    expect(item.provider).toBe('Docker')
    expect(item.description).toBe('Base relationnelle managée.')
    expect(item.tags).toEqual(['SQL', 'Persistant'])
    expect(item.popular).toBe(true)
  })

  it('traduit la catégorie en libellé français affichable', () => {
    const item = mapCardDtoToCatalogItem(cardDto)

    expect(item.category).toBe('Base de données')
  })

  it('retombe sur la valeur brute pour une catégorie inconnue', () => {
    const item = mapCardDtoToCatalogItem({ ...cardDto, category: 'quantum' })

    expect(item.category).toBe('quantum')
  })

  it('expose le moteur docker de la carte', () => {
    const item = mapCardDtoToCatalogItem(cardDto)

    expect(item.engine).toBe('docker')
  })

  it('expose le moteur terraform de la carte', () => {
    const item = mapCardDtoToCatalogItem({ ...cardDto, engine: 'terraform' })

    expect(item.engine).toBe('terraform')
  })
})

const detailDto: TemplateDetailDTO = {
  ...cardDto,
  versions: [
    { version: '16', is_default: true, is_lts: false, eol_date: '2028-11-09' },
    { version: '15', is_default: false, is_lts: true, eol_date: null },
  ],
  params: [
    {
      key: 'db_name',
      label: 'Nom de la base',
      type: 'string',
      required: true,
      default_value: 'app',
      options: null,
      order_index: 1,
    },
    {
      key: 'plan',
      label: 'Offre',
      type: 'select',
      required: false,
      default_value: null,
      options: ['small', 'large'],
      order_index: 0,
    },
  ],
}

describe('mapDetailDtoToTemplateDetail', () => {
  it('conserve les champs de carte et ajoute le libellé de catégorie', () => {
    const detail = mapDetailDtoToTemplateDetail(detailDto)

    expect(detail.id).toBe('pg16')
    expect(detail.slug).toBe('postgresql')
    expect(detail.category).toBe('database')
    expect(detail.categoryLabel).toBe('Base de données')
  })

  it('mappe les versions en camelCase', () => {
    const detail = mapDetailDtoToTemplateDetail(detailDto)

    expect(detail.versions).toHaveLength(2)
    expect(detail.versions[0]).toEqual({
      version: '16',
      isDefault: true,
      isLts: false,
      eolDate: '2028-11-09',
    })
    expect(detail.versions[1]?.eolDate).toBeNull()
  })

  it('trie les paramètres par order_index croissant et mappe en camelCase', () => {
    const detail = mapDetailDtoToTemplateDetail(detailDto)

    expect(detail.params.map((param) => param.key)).toEqual(['plan', 'db_name'])
    expect(detail.params[0]).toEqual({
      key: 'plan',
      label: 'Offre',
      type: 'select',
      required: false,
      defaultValue: null,
      options: ['small', 'large'],
      orderIndex: 0,
    })
  })
})
