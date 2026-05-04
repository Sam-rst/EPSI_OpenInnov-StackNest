export type MessageRole = 'user' | 'assistant';
export type MessageKind = 'text' | 'plan';

export interface PlanItem {
  icon: string;
  name: string;
  spec: string;
}

interface BaseMessage {
  role: MessageRole;
}

export interface TextMessage extends BaseMessage {
  kind?: 'text';
  text: string;
}

export interface PlanMessage extends BaseMessage {
  kind: 'plan';
  items: ReadonlyArray<PlanItem>;
  cost: number;
  time: string;
}

export type Message = TextMessage | PlanMessage;
