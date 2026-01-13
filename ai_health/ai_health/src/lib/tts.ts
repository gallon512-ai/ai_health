export type TTSConfig = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  voice?: string;
  language?: string;
};

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, '');

export const fetchDashscopeTTS = async (config: TTSConfig, text: string) => {
  const baseUrl = config.baseUrl ?? '';
  const apiPath = '/api/v1/services/aigc/multimodal-generation/generation';
  const url = baseUrl
    ? `${normalizeBaseUrl(baseUrl)}${apiPath}`
    : `/api/tts${apiPath}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model ?? 'qwen3-tts-flash',
      input: {
        text,
        voice: config.voice ?? 'Cherry',
        language_type: config.language ?? 'Chinese',
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `TTS request failed: ${response.status}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  const output = (data?.output ?? data?.data ?? data) as Record<string, unknown> | undefined;
  const audioNode = output?.audio as Record<string, unknown> | undefined;
  const audioBase64 =
    (typeof audioNode?.data === 'string' ? audioNode.data : undefined) ??
    (output?.audio as string | undefined) ??
    (output?.audio_base64 as string | undefined) ??
    (output?.choices as Array<Record<string, unknown>> | undefined)?.[0]?.audio ??
    (output?.data as Array<Record<string, unknown>> | undefined)?.[0]?.audio;
  const audioUrl =
    (audioNode?.url as string | undefined) ??
    (output?.audio_url as string | undefined) ??
    (output?.audioUrl as string | undefined) ??
    (data?.audio_url as string | undefined);

  if (audioUrl) {
    return { url: audioUrl, revoke: undefined };
  }

  if (typeof audioBase64 === 'string' && audioBase64) {
    const mime =
      (output?.audio_format as string | undefined) === 'mp3'
        ? 'audio/mpeg'
        : 'audio/wav';
    const binary = atob(audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mime });
    const url = URL.createObjectURL(blob);
    return { url, revoke: () => URL.revokeObjectURL(url) };
  }

  throw new Error('TTS 响应中未找到音频数据');
};
