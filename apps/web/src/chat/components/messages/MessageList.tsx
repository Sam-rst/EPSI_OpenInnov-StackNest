import { AnimatePresence } from 'framer-motion';
import type { Message } from '../../domain/models/Message';
import { MessageBubble } from './MessageBubble';
import { TypingBubble } from './TypingBubble';
import { Suggestions } from './Suggestions';

interface MessageListProps {
  messages: ReadonlyArray<Message>;
  typing: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
  onSuggestion: (text: string) => void;
}

export function MessageList({ messages, typing, scrollRef, onSuggestion }: MessageListProps) {
  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-8">
      <div className="max-w-[760px] mx-auto space-y-5">
        <AnimatePresence initial={false}>
          {messages.map((message, i) => (
            <MessageBubble key={i} message={message} />
          ))}
        </AnimatePresence>
        {typing && <TypingBubble />}
        {messages.length === 1 && <Suggestions onSelect={onSuggestion} />}
      </div>
    </div>
  );
}
