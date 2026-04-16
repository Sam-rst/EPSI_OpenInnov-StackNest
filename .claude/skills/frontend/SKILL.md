---
name: frontend
description: Guide frontend feature implementation for StackNest (React + Vite + TypeScript). Use when implementing any frontend feature, page, component, or hook. Triggers on "implement frontend", "create page", "add component", "new hook", "frontend for STN-XX", or when working in apps/ui/. This skill ensures DTO/Model/Mapper separation, compound components, Error Boundaries, and Tailwind charte graphique.
---

# Frontend — Feature Implementation Guide

Guide the implementation of a frontend feature following the project's Clean Architecture + Vertical Slicing + Craft conventions. Read the DOR from the ticket before starting.

## When to use

- Implementing a new frontend feature
- Adding a page, component, hook, or service
- Working in `apps/ui/`
- Called after `/tdd` sets up the test structure

## Process

1. **Read the DOR** — get the ticket from Jira (CA, parcours utilisateur, maquettes)
2. **Plan the files** — list every file to create
3. **Implement with TDD** — use `/tdd` for each behavior
4. **Validate architecture** — DTO/Model/Mapper separation, component structure
5. **Validate quality** — use `/craft` to check naming, types, etc.

## File creation order

```
1. Types (data contracts)
   ├── types/dto/          (mirror API, snake_case)
   ├── types/models/       (UI enriched, camelCase, computed)
   ├── types/enums/        (as const + type)
   └── types/guards/       (runtime DTO validation)

2. Data layer
   ├── mappers/            (fromDTO / toDTO)
   └── services/           (axios calls, returns DTOs)

3. Logic layer
   └── hooks/              (React Query + mapper, returns Models)

4. UI layer
   ├── components/         (receive Models as props)
   │   ├── feature-name/   (compound component if > 100 lines)
   │   │   ├── Component.tsx
   │   │   ├── ComponentHeader.tsx
   │   │   ├── ComponentSkeleton.tsx
   │   │   ├── ComponentEmpty.tsx
   │   │   ├── ComponentError.tsx
   │   │   └── index.ts
   └── pages/              (containers: hooks + components)
```

## Templates

### DTO (mirror API)

```typescript
// types/dto/template.dto.ts
export interface TemplateDTO {
    id: string
    name: string
    description: string
    category: string          // snake_case from API
    default_ports: string
    is_active: boolean
    created_at: string        // ISO string from API
}
```

### Model (UI enriched)

```typescript
// types/models/template.model.ts
import { TemplateCategory } from "../enums/template-category.enum"
import { TemplateVersion } from "./template-version.model"

export interface Template {
    id: string
    name: string
    description: string
    category: TemplateCategory
    defaultPorts: number[]           // parsed
    isActive: boolean
    createdAt: Date                  // parsed
    versions: TemplateVersion[]
    recommendedVersion: TemplateVersion | null  // computed
    hasEolVersions: boolean                     // computed
}
```

### Enum (as const)

```typescript
// types/enums/template-category.enum.ts
export const TemplateCategory = {
    DATABASE: "database",
    CACHE: "cache",
    RUNTIME: "runtime",
    MESSAGING: "messaging",
} as const

export type TemplateCategory = typeof TemplateCategory[keyof typeof TemplateCategory]
```

### Mapper

```typescript
// mappers/template.mapper.ts
import type { TemplateDTO } from "../types/dto/template.dto"
import type { Template } from "../types/models/template.model"

export const templateMapper = {
    fromDTO(dto: TemplateDTO): Template {
        const versions = dto.versions?.map(versionMapper.fromDTO) ?? []
        return {
            id: dto.id,
            name: dto.name,
            description: dto.description,
            category: dto.category as TemplateCategory,
            defaultPorts: dto.default_ports.split(",").map(Number),
            isActive: dto.is_active,
            createdAt: new Date(dto.created_at),
            versions,
            recommendedVersion: versions.find(v => v.isDefault) ?? null,
            hasEolVersions: versions.some(v => v.eolDate !== null && v.eolDate < new Date()),
        }
    },

    toDTO(model: CreateTemplateData): CreateTemplateDTO {
        return {
            name: model.name,
            description: model.description,
            category: model.category,
        }
    },
}
```

### Hook (React Query + mapping)

```typescript
// hooks/use-templates.ts
import { useQuery } from "@tanstack/react-query"
import { catalogApi } from "../services/catalog.api"
import { templateMapper } from "../mappers/template.mapper"

export function useTemplates(filters?: TemplateFilters) {
    return useQuery({
        queryKey: ["templates", filters],
        queryFn: () => catalogApi.list(filters),
        select: (dtos) => dtos.map(templateMapper.fromDTO),
    })
}
```

### Component (receive Models, not DTOs)

```typescript
// components/template-card/TemplateCard.tsx
import type { Template } from "../../types/models/template.model"

interface TemplateCardProps {
    template: Template
    onDeploy?: (templateId: string) => void
}

export function TemplateCard({ template, onDeploy }: TemplateCardProps) {
    return (
        <article className="rounded-lg border border-night/10 p-4">
            <TemplateCardHeader name={template.name} category={template.category} />
            <TemplateCardBody description={template.description} versions={template.versions} />
            <TemplateCardFooter templateId={template.id} onDeploy={onDeploy} />
        </article>
    )
}
```

### Page (container)

```typescript
// pages/CatalogPage.tsx
export function CatalogPage() {
    const [filters, setFilters] = useState<TemplateFilters>({})
    const { data, isLoading, isError, error, refetch } = useTemplates(filters)

    if (isLoading) return <TemplateListSkeleton />
    if (isError) return <TemplateListError error={error} onRetry={refetch} />
    if (!data?.length) return <TemplateListEmpty />
    return <TemplateList templates={data} />
}
```

## Component rules

### When to create a compound component (sub-folder)

- Component > 100 lines → split
- Component has > 3 visual sections → split
- A part is reused elsewhere → extract
- Component has multiple states (loading/error/empty/data) → extract each

### When NOT to split

- Component is < 50 lines → keep inline
- Sub-component would be < 10 lines → keep inline
- Sub-component would never be reused → keep inline

### Props rules

- Props are typed explicitly (interface, not inline)
- Pass specific props, not the whole entity (TemplateCardHeader gets `name` and `category`, not `template`)
- Callbacks are typed with specific params (`(category: TemplateCategory) => void`, not `(value: any) => void`)
- No `any` — ever

### State rules

| Type | Tool | Example |
|---|---|---|
| Server data | React Query | Templates from API |
| Global UI | Zustand | Sidebar open, theme |
| Local UI | useState | Input value, modal |
| Forms | react-hook-form + zod | Login, deploy config |

## Checklist before marking as done

- [ ] DTOs are in types/dto/ (mirror API, snake_case)
- [ ] Models are in types/models/ (UI enriched, camelCase)
- [ ] Mapper converts DTO ↔ Model
- [ ] Components receive Models, NEVER DTOs
- [ ] Hook uses React Query + select with mapper
- [ ] Compound components for complex UI (sub-folder)
- [ ] State components: Skeleton, Empty, Error for each query
- [ ] Error Boundary wraps the feature
- [ ] Tailwind uses charte graphique (night, cyan, yellow, error, success)
- [ ] No `any` in types
- [ ] Tests: .unit. for components/hooks/mappers, .integ. for pages
