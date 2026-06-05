/** Démo interne « ChatOps » : échange utilisateur ↔ IA illustratif. */
export function InnerChat() {
  return (
    <div className="space-y-2 text-[12.5px]">
      <div className="bg-cyan ml-auto max-w-[80%] rounded-lg rounded-br-sm px-3 py-2 text-white">
        Je veux Postgres + Redis isolé
      </div>
      <div className="bg-surface-sunken border-border text-text-primary mr-auto max-w-[88%] rounded-lg rounded-bl-sm border px-3 py-2">
        Voici la config <span className="text-cyan font-mono">postgres-16</span> +{' '}
        <span className="text-cyan font-mono">redis-7</span>
        <span className="marketing-typing-caret" />
      </div>
    </div>
  )
}
