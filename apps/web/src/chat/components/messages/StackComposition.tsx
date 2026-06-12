import { Icon } from '../../../shared/components/ui'
import type { StackLinkRecap, StackServiceRecap } from '../../types/models/ActionProposal'

interface StackCompositionProps {
  services: readonly StackServiceRecap[]
  links: readonly StackLinkRecap[]
}

/** Bloc « Services » : alias + version de chaque service de la stack. */
function ServicesBlock({ services }: { services: readonly StackServiceRecap[] }) {
  if (services.length === 0) {
    return null
  }
  return (
    <div className="mt-3">
      <div className="text-text-muted mb-1.5 font-mono text-[10px] tracking-[0.12em] uppercase">
        Services
      </div>
      <ul className="flex flex-col gap-1">
        {services.map((service) => (
          <li key={service.alias} className="flex items-center justify-between text-[12.5px]">
            <span className="text-text-primary font-mono font-medium">{service.alias}</span>
            <span className="text-text-secondary font-mono">{service.version}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Bloc « Câblage » : liens dirigés `from → to` entre services. */
function LinksBlock({ links }: { links: readonly StackLinkRecap[] }) {
  if (links.length === 0) {
    return null
  }
  return (
    <div className="mt-3">
      <div className="text-text-muted mb-1.5 font-mono text-[10px] tracking-[0.12em] uppercase">
        Câblage
      </div>
      <ul className="flex flex-col gap-1">
        {links.map((link) => (
          <li
            key={`${link.from}-${link.to}`}
            className="text-text-secondary flex items-center gap-1.5 font-mono text-[12.5px]"
          >
            <span className="text-text-primary font-medium">{link.from}</span>
            <Icon name="arrow-right" size={12} />
            <span className="text-text-primary font-medium">{link.to}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * Récap d'une composition de stack proposée par le chat : la liste des services
 * (alias + version, l'alias servant d'hôte réseau interne) et leur câblage
 * (liens dirigés `from → to`). Affiché dans l'`ActionCard` d'une action
 * `compose_stack`, à la place du récap params/quotas d'un déploiement.
 */
export function StackComposition({ services, links }: StackCompositionProps) {
  return (
    <>
      <ServicesBlock services={services} />
      <LinksBlock links={links} />
    </>
  )
}
