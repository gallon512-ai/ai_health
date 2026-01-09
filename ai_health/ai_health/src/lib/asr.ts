export type ASRConfig = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  language?: string;
};

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
};

const guessMime = (blob: Blob) => {
  if (blob.type) {
    return blob.type;
  }
  return 'audio/webm';
};

export const fetchDashscopeASR = async (config: ASRConfig, audio: Blob) => {
  const apiPath = '/chat/completions';
  const baseUrl = config.baseUrl ?? '';
  const url = baseUrl
    ? `${normalizeBaseUrl(baseUrl)}${apiPath}`
    : '/api/asr';

  const buffer = await audio.arrayBuffer();
  const audioBase64 = arrayBufferToBase64(buffer);
  const mimeType = guessMime(audio);
  const dataUri = `data:${mimeType};base64,${audioBase64}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model ?? 'qwen3-asr-flash',
      messages: [
        {
          role: 'system',
          content: [{ text: '' }],
        },
        {
          role: 'user',
          content: [
            {
              type: 'input_audio',
              input_audio: {
                data: dataUri,
              },
            },
          ],
        },
      ],
      stream: false,
      extra_body: {
        asr_options: {
          language: config.language ?? 'zh',
          enable_itn: false,
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `ASR request failed: ${response.status}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data?.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error('ASR 响应中未找到识别文本');
  }

  return text.trim();
};
