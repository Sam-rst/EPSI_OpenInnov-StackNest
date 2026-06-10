import type { Components } from 'react-markdown'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownContentProps {
  /** Contenu Markdown brut de l'assistant (jamais d'HTML interprété). */
  content: string
}

/**
 * Surcharges de rendu : on stylise chaque élément Markdown aux tons de la charte
 * via Tailwind scoped, plutôt qu'un plugin typographique global. Blocs de code en
 * `JetBrains Mono` sur fond `code-bg`, listes et liens lisibles dans la bulle.
 */
const COMPONENTS: Components = {
  p: ({ children }) => <p className="mb-2 leading-relaxed last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="text-cyan underline underline-offset-2"
    >
      {children}
    </a>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return <code className={className}>{children}</code>
    }
    return <code className="bg-code-bg rounded px-1 py-0.5 font-mono text-[0.9em]">{children}</code>
  },
  pre: ({ children }) => (
    <pre className="bg-code-bg border-border my-2 overflow-x-auto rounded-lg border p-3 font-mono text-[12.5px] leading-relaxed last:mb-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="border-border w-full border-collapse text-[12.5px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-border bg-surface-sunken border px-2 py-1 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => <td className="border-border border px-2 py-1">{children}</td>,
  blockquote: ({ children }) => (
    <blockquote className="border-cyan text-text-secondary my-2 border-l-2 pl-3 italic">
      {children}
    </blockquote>
  ),
}

/**
 * Rendu Markdown sûr des réponses de l'assistant (C1) : gras, listes, blocs de
 * code et tableaux GFM, stylés aux tons de la charte. Le HTML brut n'est **jamais**
 * interprété — `react-markdown` l'échappe par défaut (aucun `rehype-raw`), donc une
 * balise injectée s'affiche en texte au lieu d'exécuter du script (sécurité).
 */
export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="text-[13.5px]">
      <Markdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {content}
      </Markdown>
    </div>
  )
}
