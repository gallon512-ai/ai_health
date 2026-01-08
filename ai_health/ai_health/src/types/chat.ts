import type { ReactNode } from 'react';

export type ChatRole = 'user' | 'ai' | 'system';

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: ReactNode;
  rawText: string;
  loading?: boolean;
  followUpSnapshot?: {
    questions: FollowUpQuestion[];
    answers: Array<{ id: number; answer: string }>;
  };
};

export type FollowUpQuestion = {
  id: number;
  question: string;
  options: string[];
};

export type InteractiveOption = {
  key: string;
  value: string;
};

export type InteractiveFormField = {
  type: 'select';
  key: string;
  label: string;
  description?: string;
  required?: boolean;
  list: Array<{ label: string; value: string }>;
  value?: string;
  defaultValue?: string;
};

export type InteractivePrompt = {
  type: 'userSelect' | 'userInput';
  description: string;
  options?: InteractiveOption[];
  formFields?: InteractiveFormField[];
  payload: unknown;
  detailPayload?: unknown;
  responseChatItemId?: string;
};

export type PatientProfile = {
  gender: string;
  age: string;
};

export type ChatHistoryItem = {
  id: string;
  createdAt: string;
  lastMessage?: string;
  lastTime?: string;
};
