import clsx, { type ClassValue } from 'clsx';

/** Helper conditionnel pour composer des classes Tailwind. */
export const cn = (...inputs: ClassValue[]): string => clsx(inputs);
