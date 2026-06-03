export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  model: string;
  created_at: string;
  message: Message;
  done: boolean;
  error?: string;
}

export type ChatSessionType = {
  promise: Promise<void>;
  abort: () => void;
};
