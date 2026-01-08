import type { ChatHistoryItem, PatientProfile } from '../types/chat';

export const CHAT_ID_STORAGE_KEY = 'fastgpt_chat_id';
export const CHAT_HISTORY_STORAGE_KEY = 'fastgpt_chat_history';
export const PATIENT_PROFILE_STORAGE_KEY = 'fastgpt_patient_profile';

export const readChatHistory = (): ChatHistoryItem[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ChatHistoryItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const persistChatHistory = (items: ChatHistoryItem[]) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(items));
};

export const readPatientProfile = (): PatientProfile | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(PATIENT_PROFILE_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as PatientProfile;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const persistPatientProfile = (profile: PatientProfile | null) => {
  if (typeof window === 'undefined') {
    return;
  }
  if (!profile) {
    window.localStorage.removeItem(PATIENT_PROFILE_STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(
    PATIENT_PROFILE_STORAGE_KEY,
    JSON.stringify(profile),
  );
};

export const ensureChatHistory = (items: ChatHistoryItem[], chatId: string) => {
  if (!chatId) {
    return items;
  }
  if (items.some((item) => item.id === chatId)) {
    return items;
  }
  const next = [
    ...items,
    {
      id: chatId,
      createdAt: new Date().toISOString(),
    },
  ];
  next.sort((a, b) => {
    const aTime = Date.parse(a.lastTime ?? a.createdAt);
    const bTime = Date.parse(b.lastTime ?? b.createdAt);
    return bTime - aTime;
  });
  return next;
};
