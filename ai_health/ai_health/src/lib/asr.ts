export type ASRConfig = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  language?: string;
  format?: string;
  sampleRate?: number;
};

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('无法读取音频数据'));
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('无法解析音频数据'));
        return;
      }
      const [, base64] = result.split(',');
      resolve(base64 ?? '');
    };
    reader.readAsDataURL(blob);
  });

const resolveFormat = (blob: Blob, format?: string) => {
  if (format) {
    return format;
  }
  if (blob.type.includes('webm')) {
    return 'webm';
  }
  if (blob.type.includes('ogg')) {
    return 'ogg';
  }
  if (blob.type.includes('wav')) {
    return 'wav';
  }
  return 'audio';
};

export const fetchDashscopeASR = async (config: ASRConfig, audio: Blob) => {
  const baseUrl = config.baseUrl ?? '';
  const apiPath = '/api/v1/services/audio/asr';
  const url = baseUrl
    ? `${normalizeBaseUrl(baseUrl)}${apiPath}`
    : `/api/asr${apiPath}`;
  const audioBase64 = await blobToBase64(audio);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model ?? 'paraformer-realtime-v2',
      input: {
        audio: audioBase64,
      },
      parameters: {
        sample_rate: config.sampleRate ?? 16000,
        format: resolveFormat(audio, config.format),
        language: config.language ?? 'zh',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `ASR request failed: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const output = (data?.output ?? data?.data ?? data) as Record<string, unknown> | undefined;
  const text =
    (output?.text as string | undefined) ??
    (output?.result as string | undefined) ??
    (output?.sentence as string | undefined) ??
    (output?.transcription as string | undefined);

  if (!text) {
    throw new Error('ASR 响应中未找到识别文本');
  }

  return text;
};