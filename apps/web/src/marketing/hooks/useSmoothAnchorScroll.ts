import { useEffect } from 'react';

/**
 * Intercepte les clics sur les liens d'ancre (#xxx) pour faire un smooth scroll.
 * Utilisé sur la landing pour la nav (Produit, Comment ça marche, Stack).
 */
export function useSmoothAnchorScroll(): void {
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a[href^="#"]');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const id = anchor.getAttribute('href')?.slice(1);
      if (!id) return;
      const element = document.getElementById(id);
      if (element) {
        event.preventDefault();
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);
}
