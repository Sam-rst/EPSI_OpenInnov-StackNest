import { useEffect, useRef, useState } from 'react';

/**
 * Maintient un Set de "lignes flashées" — utilisé par TerraformPreview
 * pour highlighter les lignes du HCL quand un champ change.
 */
export function useFlashLines(deps: Record<string, unknown>) {
  const [flashed, setFlashed] = useState<ReadonlySet<string>>(new Set());
  const previousValuesRef = useRef<Record<string, unknown>>({ ...deps });

  useEffect(() => {
    const changedKeys: string[] = [];
    for (const key of Object.keys(deps)) {
      if (previousValuesRef.current[key] !== deps[key]) {
        changedKeys.push(key);
        previousValuesRef.current[key] = deps[key];
      }
    }
    if (changedKeys.length === 0) return;

    setFlashed((prev) => new Set([...prev, ...changedKeys]));
    const timer = window.setTimeout(() => {
      setFlashed((prev) => {
        const next = new Set(prev);
        changedKeys.forEach((k) => next.delete(k));
        return next;
      });
    }, 800);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, Object.values(deps));

  return flashed;
}
