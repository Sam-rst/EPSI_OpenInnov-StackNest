import { useState } from 'react';
import { useChat } from '../hooks/useChat';
import { ConversationsSidebar } from '../components/sidebar/ConversationsSidebar';
import { MessageList } from '../components/messages/MessageList';
import { ChatComposer } from '../components/composer/ChatComposer';
import { TerraformAside } from '../components/TerraformAside';

export function ChatPage() {
  const [activeConversation, setActiveConversation] = useState('c1');
  const { messages, typing, scrollRef, send } = useChat();

  return (
    <div className="h-[calc(100vh-56px)] grid grid-cols-[260px_1fr_280px]">
      <ConversationsSidebar activeId={activeConversation} onSelect={setActiveConversation} />
      <div className="flex flex-col">
        <MessageList messages={messages} typing={typing} scrollRef={scrollRef} onSuggestion={send} />
        <ChatComposer onSend={send} />
      </div>
      <TerraformAside />
    </div>
  );
}
