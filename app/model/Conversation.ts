export interface Conversation {
  id: string;
  title: string;
  messages: import('./Chat').Message[];
  createdAt: string;
}
