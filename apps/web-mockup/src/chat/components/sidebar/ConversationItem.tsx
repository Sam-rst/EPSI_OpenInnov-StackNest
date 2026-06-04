import type { Conversation } from '../../data/chat.fixtures';

interface ConversationItemProps {
  conversation: Conversation;
  active: boolean;
  onSelect: (id: string) => void;
}

const baseBtn = 'w-full text-left p-2.5 rounded-md transition';
const activeBtn = 'bg-[color-mix(in_oklch,var(--brand-cyan)_10%,transparent)]';

export function ConversationItem({ conversation, active, onSelect }: ConversationItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(conversation.id)}
        className={`${baseBtn} ${active ? activeBtn : 'hover:bg-surface-sunken'}`}
      >
        <div className={`text-[12.5px] font-medium truncate ${active ? 'text-cyan' : 'text-text-primary'}`}>
          {conversation.title}
        </div>
        <div className="text-[10.5px] mt-0.5 text-text-muted">{conversation.when}</div>
      </button>
    </li>
  );
}
