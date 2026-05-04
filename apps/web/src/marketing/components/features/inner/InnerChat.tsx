export function InnerChat() {
  return (
    <div className="space-y-2 text-[12.5px]">
      <div className="ml-auto max-w-[80%] px-3 py-2 rounded-lg rounded-br-sm bg-cyan text-white">
        Je veux Postgres + Redis isolé
      </div>
      <div className="mr-auto max-w-[88%] px-3 py-2 rounded-lg rounded-bl-sm bg-surface-sunken border border-border text-text-primary">
        Voici la config <span className="font-mono text-cyan">postgres-16</span> +{' '}
        <span className="font-mono text-cyan">redis-7</span>
        <span className="typing-caret" />
      </div>
    </div>
  );
}
