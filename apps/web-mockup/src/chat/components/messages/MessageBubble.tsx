import { motion } from 'framer-motion';
import { Avatar } from '@core/ui';
import type { Message } from '../../domain/models/Message';
import { AssistantBubbleIcon } from './AssistantBubbleIcon';
import { PlanBubble } from './PlanBubble';

interface MessageBubbleProps {
  message: Message;
}

const userBubble = 'bg-cyan text-white rounded-br-sm';
const assistantBubble = 'bg-surface-elevated border border-border rounded-bl-sm text-text-primary';

const renderInner = (message: Message) => {
  if (message.kind === 'plan') return <PlanBubble message={message} />;
  return <div className="text-[13.5px] leading-relaxed" dangerouslySetInnerHTML={{ __html: message.text }} />;
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? 'justify-end' : ''}`}
    >
      {!isUser && <AssistantBubbleIcon />}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${isUser ? userBubble : assistantBubble}`}>
        {renderInner(message)}
      </div>
      {isUser && <Avatar name="Yassine Zouitni" color="#fea21f" size={32} />}
    </motion.div>
  );
}
