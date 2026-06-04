import { useState, type FormEvent } from 'react';
import { Icon } from '@core/ui';

interface ChatComposerProps {
  onSend: (text: string) => void;
}

export function ChatComposer({ onSend }: ChatComposerProps) {
  const [draft, setDraft] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setDraft('');
  };

  return (
    <div className="border-t border-border bg-surface-elevated p-4">
      <div className="max-w-[760px] mx-auto">
        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 p-2 rounded-lg border border-border bg-surface focus-within:border-cyan"
        >
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Décris ton besoin… (ex : « Postgres 16 + Redis isolé pour Yassine »)"
            className="flex-1 bg-transparent outline-none resize-none text-[13.5px] py-2 px-2 text-text-primary"
            rows={1}
            style={{ minHeight: 40, maxHeight: 120 }}
          />
          <button type="button" className="w-9 h-9 rounded-md inline-flex items-center justify-center hover:bg-surface-sunken text-text-muted">
            <Icon name="paperclip" size={14} />
          </button>
          <button
            type="submit"
            disabled={!draft.trim()}
            className="w-9 h-9 rounded-md inline-flex items-center justify-center bg-sun text-[#3a2a00] disabled:opacity-50 hover:brightness-105 transition"
          >
            <Icon name="arrow-up" size={14} />
          </button>
        </form>
        <div className="flex items-center justify-between mt-2 text-[10.5px] font-mono text-text-muted">
          <span>StackNest IA peut produire des erreurs. Toujours valider le plan avant l'apply.</span>
          <span>⌘ ↵ pour envoyer</span>
        </div>
      </div>
    </div>
  );
}
