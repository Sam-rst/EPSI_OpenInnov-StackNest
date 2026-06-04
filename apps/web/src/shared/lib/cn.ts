import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Compose des classes Tailwind de façon conditionnelle (via `clsx`) puis fusionne
 * les conflits de même famille utilitaire (via `tailwind-merge`) — la dernière gagne.
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs))
