import type {
  TemplateConfigDTO,
  TemplateConfigParamDTO,
  TemplateConfigVersionDTO,
} from '../types/dto/TemplateConfigDTO'
import { toEngineKind } from '../types/guards/deploymentGuards'
import { toParamKind } from '../types/enums/ParamKind'
import type {
  TemplateConfig,
  TemplateConfigParam,
  TemplateConfigVersion,
} from '../types/models/TemplateConfig'

function mapVersion(dto: TemplateConfigVersionDTO): TemplateConfigVersion {
  return {
    version: dto.version,
    isDefault: dto.is_default,
    isLts: dto.is_lts,
    eolDate: dto.eol_date,
  }
}

function mapParam(dto: TemplateConfigParamDTO): TemplateConfigParam {
  return {
    key: dto.key,
    label: dto.label,
    type: toParamKind(dto.type),
    required: dto.required,
    defaultValue: dto.default_value,
    options: dto.options,
    orderIndex: dto.order_index,
  }
}

/** Mappe la fiche catalogue (`TemplateConfigDTO`) vers le modèle `TemplateConfig`. */
export function mapTemplateConfigDto(dto: TemplateConfigDTO): TemplateConfig {
  return {
    id: dto.id,
    name: dto.name,
    icon: dto.icon,
    description: dto.description,
    engine: toEngineKind(dto.engine),
    imageRepository: dto.image_repository,
    internalPort: dto.internal_port,
    secretEnv: dto.secret_env,
    versions: dto.versions.map(mapVersion),
    params: [...dto.params].sort((a, b) => a.order_index - b.order_index).map(mapParam),
  }
}
