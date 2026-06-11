import type { CatalogItem } from '../domain/models/CatalogItem'
import type { TemplateCardDTO } from '../types/dto/TemplateCardDTO'
import type { TemplateDetailDTO } from '../types/dto/TemplateDetailDTO'
import type { TemplateParamDTO } from '../types/dto/TemplateParamDTO'
import type { TemplateVersionDTO } from '../types/dto/TemplateVersionDTO'
import { labelForCategory } from '../types/enums/TemplateCategory'
import { EngineKind } from '../types/enums/EngineKind'
import type { ParamType } from '../types/enums/ParamType'
import type { TemplateDetail } from '../types/models/TemplateDetail'
import type { TemplateParam } from '../types/models/TemplateParam'
import type { TemplateVersion } from '../types/models/TemplateVersion'

/**
 * Normalise la valeur brute du moteur en `EngineKind`. Toute valeur inattendue
 * retombe sur `docker` : une carte n'est jamais bloquée par erreur.
 */
function toEngineKind(raw: string): EngineKind {
  return raw === EngineKind.TERRAFORM ? EngineKind.TERRAFORM : EngineKind.DOCKER
}

/** Mappe une carte API (`TemplateCardDTO`) vers le modèle liste `CatalogItem`. */
export function mapCardDtoToCatalogItem(dto: TemplateCardDTO): CatalogItem {
  return {
    id: dto.id,
    name: dto.name,
    icon: dto.icon,
    category: labelForCategory(dto.category),
    provider: dto.provider,
    engine: toEngineKind(dto.engine),
    tags: dto.tags,
    description: dto.description,
    popular: dto.popular,
  }
}

function mapVersion(dto: TemplateVersionDTO): TemplateVersion {
  return {
    version: dto.version,
    isDefault: dto.is_default,
    isLts: dto.is_lts,
    eolDate: dto.eol_date,
  }
}

function mapParam(dto: TemplateParamDTO): TemplateParam {
  return {
    key: dto.key,
    label: dto.label,
    type: dto.type as ParamType,
    required: dto.required,
    defaultValue: dto.default_value,
    options: dto.options,
    orderIndex: dto.order_index,
  }
}

/** Mappe la fiche API (`TemplateDetailDTO`) vers le modèle riche `TemplateDetail`. */
export function mapDetailDtoToTemplateDetail(dto: TemplateDetailDTO): TemplateDetail {
  return {
    id: dto.id,
    slug: dto.slug,
    name: dto.name,
    icon: dto.icon,
    category: dto.category,
    categoryLabel: labelForCategory(dto.category),
    provider: dto.provider,
    tags: dto.tags,
    description: dto.description,
    popular: dto.popular,
    versions: dto.versions.map(mapVersion),
    params: [...dto.params].sort((a, b) => a.order_index - b.order_index).map(mapParam),
  }
}
