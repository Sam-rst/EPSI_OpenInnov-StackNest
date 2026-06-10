import type { DependencyList, RefObject } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'

/** Marge (px) sous laquelle on considère que l'utilisateur est « collé » au bas. */
const BOTTOM_THRESHOLD_PX = 80

interface UseAutoScrollResult {
  /** À brancher sur le conteneur scrollable. */
  scrollRef: RefObject<HTMLDivElement | null>
  /** À brancher sur `onScroll` du conteneur : met à jour l'ancrage au bas. */
  onScroll: () => void
  /** Recolle au bas (clic sur le bouton flottant) et réactive le suivi. */
  scrollToBottom: () => void
  /** Vrai quand l'utilisateur a remonté : affiche le bouton « ↓ ». */
  showScrollButton: boolean
}

/** Distance en pixels entre le bas visible et le bas du contenu. */
function distanceFromBottom(node: HTMLDivElement): number {
  return node.scrollHeight - node.scrollTop - node.clientHeight
}

/**
 * Auto-scroll « intelligent » du fil de messages (A4). Tant que l'utilisateur est
 * collé au bas, chaque nouveau contenu (message figé, token de streaming) recolle
 * la vue au bas. S'il remonte pour relire, on cesse de le forcer et on propose un
 * bouton flottant « ↓ » pour redescendre. `onScroll` doit être branché sur le
 * conteneur pour suivre l'intention de l'utilisateur.
 *
 * @param deps  dépendances qui déclenchent un re-scroll (messages, streamingText…)
 */
export function useAutoScroll(deps: DependencyList): UseAutoScrollResult {
  const scrollRef = useRef<HTMLDivElement | null>(null)
  // Hors état React : l'ancrage ne doit pas re-render mais piloter l'effet.
  const pinnedRef = useRef(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

  const scrollToBottom = useCallback(() => {
    const node = scrollRef.current
    if (node) {
      node.scrollTop = node.scrollHeight
    }
    pinnedRef.current = true
    setShowScrollButton(false)
  }, [])

  const onScroll = useCallback(() => {
    const node = scrollRef.current
    if (!node) {
      return
    }
    const pinned = distanceFromBottom(node) <= BOTTOM_THRESHOLD_PX
    pinnedRef.current = pinned
    setShowScrollButton(!pinned)
  }, [])

  useEffect(() => {
    if (pinnedRef.current) {
      const node = scrollRef.current
      if (node) {
        node.scrollTop = node.scrollHeight
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { scrollRef, onScroll, scrollToBottom, showScrollButton }
}
