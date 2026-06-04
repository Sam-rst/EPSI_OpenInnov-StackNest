import { Button } from '@core/ui';
import { CONVERSATIONS } from '../../data/chat.fixtures';
import { ConversationItem } from './ConversationItem';

interface ConversationsSidebarProps {
  activeId: string;
  onSelect: (id: string) => void;
}

export function ConversationsSidebar({ activeId, onSelect }: ConversationsSidebarProps) {
  return (
    <aside className="border-r border-border bg-surface-elevated flex flex-col">
      <div className="p-3">
        <Button variant="primary" icon="plus" className="w-full">
          Nouvelle conversation
        </Button>
      </div>
      <div className="px-3 text-[10px] font-mono uppercase tracking-[0.14em] mb-1.5 text-text-muted">
        Récentes
      </div>
      <ul className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {CONVERSATIONS.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            active={activeId === conversation.id}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </aside>
  );
}
