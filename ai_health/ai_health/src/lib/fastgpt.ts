export type FastGPTMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type FastGPTConfig = {
  baseUrl: string;
  apiKey?: string;
  appId: string;
  chatId?: string;
};

export type FastGPTRecord = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  blocks?: Array<{
    type?: string;
    text?: { content?: string };
    interactive?: unknown;
  }>;
  time?: string;
};

type FastGPTResponse = {
  answer?: string;
  data?: {
    answer?: string;
  };
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

export const requestFastGPT = async (
  config: FastGPTConfig,
  messages: FastGPTMessage[],
) => {
  const url = `${normalizeBaseUrl(config.baseUrl)}/api/v1/chat/completions?detail=true`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      appId: config.appId,
      ...(config.chatId ? { chatId: config.chatId } : {}),
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `FastGPT request failed: ${response.status}`);
  }

  const data = (await response.json()) as FastGPTResponse;
  const content =
    data?.choices?.[0]?.message?.content ??
    data?.data?.answer ??
    data?.answer;

  if (!content) {
    return JSON.stringify(data, null, 2);
  }

  return content;
};

export const getFastGPTRecords = async (
  config: FastGPTConfig,
  params: {
    initialId?: string;
    pageSize?: number;
    chatId: string;
    appId: string;
  },
) => {
  const url = `${normalizeBaseUrl(config.baseUrl)}/api/core/chat/getRecords_v2`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      initialId: params.initialId ?? '',
      pageSize: params.pageSize ?? 10,
      chatId: params.chatId,
      appId: params.appId,
      retainDatasetCite: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `FastGPT request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    data?: {
      list?: Array<{
        id?: string;
        dataId?: string;
        role?: string;
        obj?: string;
        content?: string;
        value?: string | Array<{ type?: string; text?: { content?: string } }>;
        hideInUI?: boolean;
        time?: string;
      }>;
    };
    list?: Array<{
      id?: string;
      dataId?: string;
      role?: string;
      obj?: string;
      content?: string;
      value?: string | Array<{ type?: string; text?: { content?: string } }>;
      hideInUI?: boolean;
      time?: string;
    }>;
  };
  const list = data?.data?.list ?? data?.list ?? [];

  const readContent = (
    value?:
      | string
      | Array<{ type?: string; text?: { content?: string }; interactive?: unknown }>,
    fallback?: string,
  ) => {
    if (typeof value === 'string') {
      return value;
    }
    if (Array.isArray(value)) {
      return value
        .filter((item) => item?.type === 'text' && item?.text?.content)
        .map((item) => item?.text?.content ?? '')
        .filter(Boolean)
        .join('\n');
    }
    return fallback ?? '';
  };

  return list
    .map((item) => {
      if (item?.hideInUI) {
        return null;
      }
      const rawRole = item?.role ?? item?.obj ?? 'user';
      const role =
        rawRole === 'assistant' || rawRole === 'AI'
          ? 'assistant'
          : rawRole === 'system' || rawRole === 'System'
            ? 'system'
            : 'user';
      const content = readContent(item?.value, item?.content ?? '');
      const id = item?.id ?? item?.dataId ?? '';
      if (!content) {
        return null;
      }
      return {
        id: id || content.slice(0, 24),
        role,
        content,
        blocks: Array.isArray(item?.value) ? item?.value : undefined,
        time: typeof item?.time === 'string' ? item.time : undefined,
      } as FastGPTRecord;
    })
    .filter((item): item is FastGPTRecord => Boolean(item));
};

export const deleteFastGPTChats = async (
  config: FastGPTConfig,
  chatIds: string[],
) => {
  const url = `${normalizeBaseUrl(config.baseUrl)}/api/core/chat/history/batchDelete`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      appId: config.appId,
      chatIds,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `FastGPT request failed: ${response.status}`);
  }

  return response.json();
};

export const streamFastGPT = async (
  config: FastGPTConfig,
  messages: FastGPTMessage[],
  options?: {
    onDelta?: (delta: string, full: string) => void;
    onInteractive?: (payload: unknown) => void;
    onEvent?: (eventName: string, payload: unknown) => void;
    interactive?: unknown;
    detailPayload?: unknown;
    responseChatItemId?: string;
  },
) => {
  const url = `${normalizeBaseUrl(config.baseUrl)}/api/v1/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
    },
    body: JSON.stringify({
      ...(typeof options?.detailPayload === 'object' && options?.detailPayload !== null
        ? options.detailPayload
        : {}),
      appId: config.appId,
      ...(config.chatId ? { chatId: config.chatId } : {}),
      ...(options?.interactive ? { interactive: options.interactive } : {}),
      ...(options?.responseChatItemId
        ? { responseChatItemId: options.responseChatItemId }
        : {}),
      messages,
      stream: true,
      detail: true,
      retainDatasetCite: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `FastGPT request failed: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('FastGPT streaming response is empty.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let full = '';

  let currentEvent = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        currentEvent = '';
        continue;
      }
      if (trimmed.startsWith('event:')) {
        currentEvent = trimmed.replace(/^event:\s*/, '');
        continue;
      }
      if (!trimmed.startsWith('data:')) {
        continue;
      }
      const data = trimmed.replace(/^data:\s*/, '');
      if (data === '[DONE]') {
        return full;
      }
      try {
        const parsed = JSON.parse(data) as FastGPTResponse & {
          choices?: Array<{
            delta?: {
              content?: string;
            };
          }>;
          interactive?: unknown;
        };
        const eventName = currentEvent || 'answer';
        options?.onEvent?.(eventName, parsed);
        if (currentEvent === 'interactive') {
          options?.onInteractive?.(parsed?.interactive ?? parsed);
          continue;
        }
        if (currentEvent && currentEvent !== 'answer') {
          continue;
        }
        const delta =
          parsed?.choices?.[0]?.delta?.content ??
          parsed?.choices?.[0]?.message?.content ??
          parsed?.data?.answer ??
          parsed?.answer ??
          '';
        if (delta) {
          full += delta;
          options?.onDelta?.(delta, full);
        }
      } catch {
        continue;
      }
    }
  }

  return full;
};
