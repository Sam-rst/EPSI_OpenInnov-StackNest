import { SUGGESTIONS } from '../../data/chat.fixtures';

interface SuggestionsProps {
  onSelect: (text: string) => void;
}

export function Suggestions({ onSelect }: SuggestionsProps) {
  return (
    <div className="pt-4">
      <div className="text-[11px] font-mono uppercase tracking-[0.14em] mb-2.5 text-text-muted">
        Suggestions
      </div>
      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSelect(suggestion)}
            className="px-3 h-8 rounded-md border border-border text-[12.5px] text-text-secondary hover:border-cyan hover:text-cyan transition"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
