import type { FollowUpQuestion } from '../types/chat';

export const extractFollowUps = (content: string) => {
  const jsonMatch = content.match(/```json\s*([\s\S]*?)```/i);
  const raw = jsonMatch?.[1] ?? content;

  try {
    const data = JSON.parse(raw) as {
      follow_up_questions?: FollowUpQuestion[];
    };
    if (Array.isArray(data.follow_up_questions)) {
      return data.follow_up_questions;
    }
  } catch {
    return null;
  }

  return null;
};

export const buildFollowUpSummary = (
  answers: Array<{ answer: string }>,
) => answers.map((item, idx) => `${idx + 1}. ${item.answer}`).join('\n');

export const parseFormContent = (content: string) => {
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    const entries = Object.entries(parsed);
    if (!entries.length || entries.some(([, value]) => typeof value !== 'string')) {
      return null;
    }
    return parsed as Record<string, string>;
  } catch {
    return null;
  }
};

export const stripCites = (content: string) =>
  content.replace(/\[[^\]]+\]\(CITE\)/g, '').trim();
