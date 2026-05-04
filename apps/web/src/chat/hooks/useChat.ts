import { useEffect, useRef, useState } from 'react';
import type { Message } from '../domain/models/Message';
import { SEED_MESSAGES, SCRIPTED_ANSWERS } from '../data/chat.fixtures';

const findScripted = (text: string) => {
  const head = text.toLowerCase().slice(0, 18);
  return SCRIPTED_ANSWERS.find((s) => s.trigger.startsWith(head)) ?? SCRIPTED_ANSWERS[0];
};

interface UseChatResult {
  messages: ReadonlyArray<Message>;
  typing: boolean;
  scrollRef: React.RefObject<HTMLDivElement>;
  send: (text: string) => void;
}

export function useChat(): UseChatResult {
  const [messages, setMessages] = useState<Message[]>([...SEED_MESSAGES]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  const send = (text: string) => {
    setMessages((prev) => [...prev, { role: 'user', kind: 'text', text }]);
    setTyping(true);
    const script = findScripted(text);
    if (!script) return;
    window.setTimeout(() => {
      setTyping(false);
      script.parts.forEach((part, i) => {
        window.setTimeout(() => {
          setMessages((prev) => [...prev, { role: 'assistant', ...part } as Message]);
        }, 400 + i * 350);
      });
    }, 1200);
  };

  return { messages, typing, scrollRef, send };
}
