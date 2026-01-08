type DetailPayload = Record<string, unknown>;

const createId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const buildDetailMessage = (content: string) => ({
  dataId: createId(),
  hideInUI: false,
  role: 'user',
  content,
});

const resolveResponseChatItemId = (
  preferred: string | undefined,
  baseDetailPayload: DetailPayload | null,
  fallback: string | null,
) => {
  if (typeof preferred === 'string') {
    return preferred;
  }
  if (typeof baseDetailPayload?.responseChatItemId === 'string') {
    return baseDetailPayload.responseChatItemId;
  }
  if (typeof fallback === 'string') {
    return fallback;
  }
  return undefined;
};

const resolveChatId = (
  baseDetailPayload: DetailPayload | null,
  fallback: string | null,
  defaultId: string,
) => {
  if (typeof baseDetailPayload?.chatId === 'string') {
    return baseDetailPayload.chatId;
  }
  if (typeof fallback === 'string') {
    return fallback;
  }
  return defaultId;
};

const buildInteractiveDetailPayload = (
  baseDetailPayload: DetailPayload | null,
  content: string,
  responseChatItemId: string | undefined,
  extras?: Partial<DetailPayload>,
) =>
  baseDetailPayload && typeof baseDetailPayload === 'object'
    ? {
        ...baseDetailPayload,
        messages: [buildDetailMessage(content)],
        responseChatItemId,
        detail: true,
        stream: true,
        retainDatasetCite: false,
        ...extras,
      }
    : undefined;

export type { DetailPayload };
export {
  buildDetailMessage,
  buildInteractiveDetailPayload,
  createId,
  resolveChatId,
  resolveResponseChatItemId,
};
