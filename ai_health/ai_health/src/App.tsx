import { DownOutlined, SoundOutlined, StopOutlined } from '@ant-design/icons';
import { Actions } from '@ant-design/x';
import type { BubbleItemType } from '@ant-design/x';
import { XMarkdown } from '@ant-design/x-markdown';
import { Button } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import logoImage from './assets/logo.png';
import doctorImage from './assets/doctor.png';
import { deleteFastGPTChats, getFastGPTRecords, streamFastGPT } from './lib/fastgpt';
import type { FastGPTMessage } from './lib/fastgpt';
import { fetchDashscopeTTS } from './lib/tts';
import FollowUpCarousel from './components/FollowUpCarousel';
import WelcomePanel from './components/WelcomePanel';
import AppHeader from './components/AppHeader';
import ChatBubbleList from './components/ChatBubbleList';
import ChatHeader from './components/ChatHeader';
import ChatFooter from './components/ChatFooter';
import HistoryDrawer from './components/HistoryDrawer';
import InteractivePromptCard from './components/InteractivePromptCard';
import PatientRegisterCard from './components/PatientRegisterCard';
import {
  buildDetailMessage,
  buildInteractiveDetailPayload,
  createId,
  resolveChatId,
  resolveResponseChatItemId,
  type DetailPayload,
} from './lib/fastgptHelpers';
import { buildFollowUpSummary, extractFollowUps } from './lib/chatHelpers';
import { buildHistoryMessages } from './lib/historyMessages';
import {
  CHAT_ID_STORAGE_KEY,
  ensureChatHistory,
  persistChatHistory,
  persistPatientProfile,
  readChatHistory,
  readPatientProfile,
} from './lib/chatStorage';
import type {
  ChatHistoryItem,
  ChatMessage,
  FollowUpQuestion,
  InteractiveFormField,
  InteractiveOption,
  InteractivePrompt,
  PatientProfile,
} from './types/chat';

const envConfig = {
  baseUrl: import.meta.env.VITE_FASTGPT_BASE_URL ?? '',
  apiKey: import.meta.env.VITE_FASTGPT_API_KEY ?? '',
  appId: import.meta.env.VITE_FASTGPT_APP_ID ?? '',
  dashscopeApiKey: import.meta.env.VITE_DASHSCOPE_API_KEY ?? '',
  dashscopeVoice: import.meta.env.VITE_DASHSCOPE_VOICE ?? 'Cherry',
  dashscopeBaseUrl: import.meta.env.VITE_DASHSCOPE_BASE_URL ?? '',
};

const App = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const config = envConfig;
  const [followUps, setFollowUps] = useState<FollowUpQuestion[]>([]);
  const [followUpIndex, setFollowUpIndex] = useState(0);
  const [followUpAnswers, setFollowUpAnswers] = useState<
    Array<{ id: number; question: string; answer: string }>
  >([]);
  const [speakingText, setSpeakingText] = useState<string | null>(null);
  const [interactivePrompt, setInteractivePrompt] = useState<InteractivePrompt | null>(
    null,
  );
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(
    readPatientProfile,
  );
  const [showWelcome, setShowWelcome] = useState(true);
  const [patientForm, setPatientForm] = useState<PatientProfile>({
    gender: '',
    age: '',
  });
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>(
    readChatHistory,
  );
  const [historyOpen, setHistoryOpen] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const patientProfileRef = useRef<PatientProfile | null>(null);
  const detailPayloadRef = useRef<unknown>(null);
  const responseChatItemIdRef = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsCacheRef = useRef<Map<string, string>>(new Map());
  const ttsRevokeRef = useRef<Map<string, () => void>>(new Map());
  const handleBodyScroll = useCallback(() => {
    const bodyEl = bodyRef.current;
    if (!bodyEl) {
      return;
    }
    const threshold = 80;
    const distanceToBottom =
      bodyEl.scrollHeight - bodyEl.scrollTop - bodyEl.clientHeight;
    setIsAtBottom(distanceToBottom <= threshold);
  }, []);
  const deviceChatId = useMemo(() => {
    if (typeof window === 'undefined') {
      return createId();
    }
    const stored = window.localStorage.getItem(CHAT_ID_STORAGE_KEY);
    if (stored) {
      return stored;
    }
    const nextId = createId();
    window.localStorage.setItem(CHAT_ID_STORAGE_KEY, nextId);
    return nextId;
  }, []);
  const [currentChatId, setCurrentChatId] = useState(deviceChatId);
  const chatIdRef = useRef<string | null>(deviceChatId);
  const conversationId = currentChatId;
  useEffect(() => {
    patientProfileRef.current = patientProfile;
    persistPatientProfile(patientProfile);
  }, [patientProfile]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
      const bodyEl = bodyRef.current;
      if (bodyEl) {
        bodyEl.scrollTop = bodyEl.scrollHeight;
      }
      setIsAtBottom(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, [messages, sending, showPatientForm, followUps.length, interactivePrompt]);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      handleBodyScroll();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [handleBodyScroll, messages.length, showPatientForm, followUps.length, interactivePrompt]);

  const configReady = Boolean(config.baseUrl && config.appId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(CHAT_ID_STORAGE_KEY, currentChatId);
    }
  }, [currentChatId]);

  useEffect(() => {
    chatIdRef.current = currentChatId;
  }, [currentChatId]);

  useEffect(() => {
    if (!configReady || !currentChatId) {
      return;
    }
    let cancelled = false;
    getFastGPTRecords(
      {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        appId: config.appId,
        chatId: currentChatId,
      },
      {
        initialId: '',
        pageSize: 10,
        chatId: currentChatId,
        appId: config.appId,
      },
    )
      .then((records) => {
        if (cancelled || records.length === 0) {
          return;
        }
        const lastUser = [...records]
          .reverse()
          .find((record) => record.role === 'user' && record.content);
        const lastTime = [...records]
          .reverse()
          .find((record) => record.time)?.time;
        setChatHistory((prev) => {
          const next = prev.map((item) =>
            item.id === currentChatId
              ? {
                  ...item,
                  lastMessage: lastUser?.content ?? item.lastMessage,
                  lastTime: lastTime ?? item.lastTime,
                }
              : item,
          );
          next.sort((a, b) => {
            const aTime = Date.parse(a.lastTime ?? a.createdAt);
            const bTime = Date.parse(b.lastTime ?? b.createdAt);
            return bTime - aTime;
          });
          persistChatHistory(next);
          return next;
        });
        setShowWelcome(false);
        const sorted = [...records].sort((a, b) => {
          const aTime = a.time ? Date.parse(a.time) : 0;
          const bTime = b.time ? Date.parse(b.time) : 0;
          return aTime - bTime;
        });
        setMessages(buildHistoryMessages(sorted, createId));
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
      });
    return () => {
      cancelled = true;
    };
  }, [
    configReady,
    config.baseUrl,
    config.apiKey,
    config.appId,
    currentChatId,
  ]);

  const sendToFastGPT = useCallback(
    async (
      value?: string,
      options?: {
        resetFollowUps?: boolean;
        interactive?: unknown;
        detailPayload?: unknown;
        responseChatItemId?: string;
        skipUserMessage?: boolean;
        showPlaceholder?: boolean;
        skipHistory?: boolean;
      },
    ) => {
      const content = (value ?? input).trim();
      if (!content || sending) {
        return;
      }

      if (showWelcome) {
        setShowWelcome(false);
      }

      if (!options?.interactive && !patientProfileRef.current) {
        setPendingQuestion(content);
        setShowPatientForm(true);
        if (!options?.skipUserMessage) {
          const userMessage: ChatMessage = {
            id: createId(),
            role: 'user',
            content,
            rawText: content,
          };
          setMessages((prev) => [...prev, userMessage]);
        }
        setInput('');
        return;
      }

      if (!configReady) {
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: 'system',
            content: '请先配置 FastGPT 环境变量后再发送。',
            rawText: '请先配置 FastGPT 环境变量后再发送。',
          },
        ]);
        return;
      }

      setChatHistory((prev) => {
        const next = ensureChatHistory(prev, currentChatId);
        if (next !== prev) {
          persistChatHistory(next);
        }
        return next;
      });

      if (options?.resetFollowUps ?? true) {
        setFollowUps([]);
        setFollowUpIndex(0);
        setFollowUpAnswers([]);
        setInteractivePrompt(null);
        setFormValues({});
      }

      const userMessage: ChatMessage | null = options?.skipUserMessage
        ? null
        : {
            id: createId(),
            role: 'user',
            content,
            rawText: content,
          };
      const interactiveOnly = Boolean(options?.interactive);
      const shouldShowPlaceholder =
        options?.showPlaceholder ?? !interactiveOnly;
      const placeholder: ChatMessage | null = shouldShowPlaceholder
        ? {
            id: createId(),
            role: 'ai',
            content: '正在思考中...',
            rawText: '',
            loading: true,
          }
        : null;

      setMessages((prev) => {
        const next = [...prev];
        if (userMessage) {
          next.push(userMessage);
        }
        if (placeholder) {
          next.push(placeholder);
        }
        return next;
      });
      setInput('');
      setSending(true);

      try {
        let suppressStreamRender = false;
        let decidedStreamRender = false;
        const baseHistory = options?.skipHistory
          ? userMessage
            ? [userMessage]
            : []
          : userMessage
            ? [...messages, userMessage]
            : messages;
        const history: FastGPTMessage[] = baseHistory
          .filter((msg) => msg.role !== 'system')
          .map((msg) => ({
            role: msg.role === 'ai' ? 'assistant' : msg.role,
            content: msg.rawText,
          }));
        const detailMessage = buildDetailMessage(content);
        const requestMessages: FastGPTMessage[] = interactiveOnly
          ? ([detailMessage] as FastGPTMessage[])
          : history;
        const baseDetailPayload =
          (options?.detailPayload as DetailPayload | undefined) ?? undefined;
        const mergedDetailPayload =
          baseDetailPayload && interactiveOnly
            ? {
                ...baseDetailPayload,
                messages: [detailMessage],
                responseChatItemId:
                  typeof options?.responseChatItemId === 'string'
                    ? options.responseChatItemId
                    : baseDetailPayload.responseChatItemId,
              }
            : baseDetailPayload;
        const answer = await streamFastGPT(
          {
            baseUrl: config.baseUrl,
            apiKey: config.apiKey,
            appId: config.appId,
            chatId: chatIdRef.current ?? conversationId,
          },
          requestMessages,
          {
            onDelta: (_delta, full) => {
              if (!placeholder) {
                return;
              }
              if (!decidedStreamRender) {
                const preview = full.trimStart();
                if (preview.startsWith('{') || preview.startsWith('```json')) {
                  suppressStreamRender = true;
                }
                if (preview.length > 12 || preview.includes('\n')) {
                  decidedStreamRender = true;
                }
              }
              if (suppressStreamRender) {
                return;
              }
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === placeholder.id
                    ? { ...msg, content: full, rawText: full, loading: false }
                    : msg,
                ),
              );
            },
            onInteractive: (payload) => {
              const data = payload as {
                type?: string;
                params?: {
                  description?: string;
                  userSelectOptions?: InteractiveOption[];
                  inputForm?: InteractiveFormField[];
                };
              };
              if (data?.type === 'userSelect' && data?.params?.userSelectOptions) {
                setInteractivePrompt({
                  type: 'userSelect',
                  description: data.params.description ?? '请选择一个选项',
                  options: data.params.userSelectOptions,
                  payload,
                  detailPayload: detailPayloadRef.current ?? undefined,
                  responseChatItemId: responseChatItemIdRef.current ?? undefined,
                });
                return;
              }
              if (data?.type === 'userInput' && data?.params?.inputForm) {
                const defaults: Record<string, string> = {};
                data.params.inputForm.forEach((field) => {
                  if (field.defaultValue) {
                    defaults[field.key] = field.defaultValue;
                  } else if (field.value) {
                    defaults[field.key] = field.value;
                  }
                });
                setFormValues(defaults);
                setInteractivePrompt({
                  type: 'userInput',
                  description: data.params.description ?? '请填写信息',
                  formFields: data.params.inputForm,
                  payload,
                  detailPayload: detailPayloadRef.current ?? undefined,
                  responseChatItemId: responseChatItemIdRef.current ?? undefined,
                });
              }
            },
            onEvent: (_eventName, payload) => {
              const candidate = payload as Record<string, unknown>;
              if (typeof candidate?.responseChatItemId === 'string') {
                responseChatItemIdRef.current = candidate.responseChatItemId;
              }
              if (typeof candidate?.chatId === 'string') {
                chatIdRef.current = candidate.chatId;
              }
              if (
                candidate &&
                typeof candidate === 'object' &&
                'nodes' in candidate &&
                'edges' in candidate &&
                'chatId' in candidate
              ) {
                detailPayloadRef.current = {
                  ...candidate,
                  chatId: typeof candidate.chatId === 'string'
                    ? candidate.chatId
                    : chatIdRef.current ?? undefined,
                  responseChatItemId:
                    typeof candidate.responseChatItemId === 'string'
                      ? candidate.responseChatItemId
                      : responseChatItemIdRef.current ?? undefined,
                };
              }
            },
            interactive: options?.interactive,
            detailPayload: mergedDetailPayload,
            responseChatItemId:
              typeof options?.responseChatItemId === 'string'
                ? options.responseChatItemId
                  : typeof (
              (options?.detailPayload as Record<string, unknown> | undefined)
                ?.responseChatItemId
                  ) === 'string'
                  ? String(
                      (options?.detailPayload as Record<string, unknown>)
                        .responseChatItemId,
                    )
                  : responseChatItemIdRef.current ?? undefined,
          },
        );

        const nextFollowUps = extractFollowUps(answer);
        if (nextFollowUps?.length) {
          if (placeholder) {
            setMessages((prev) => prev.filter((msg) => msg.id !== placeholder.id));
          }
          setFollowUps(nextFollowUps);
          setFollowUpIndex(0);
          setFollowUpAnswers([]);
        } else {
          if (placeholder) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === placeholder.id
                  ? { ...msg, content: answer, rawText: answer, loading: false }
                  : msg,
              ),
            );
          }
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'FastGPT 请求失败。';

        if (placeholder) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === placeholder.id
                ? { ...msg, content: errorMessage, rawText: errorMessage, loading: false }
                : msg,
            ),
          );
        }
      } finally {
        setSending(false);
      }
    },
    [
      config.baseUrl,
      config.apiKey,
      config.appId,
      configReady,
      conversationId,
      currentChatId,
      input,
      messages,
      sending,
      showWelcome,
    ],
  );

  const handlePatientSubmit = useCallback(() => {
    if (
      !patientForm.gender ||
      !patientForm.age
    ) {
      return;
    }
    patientProfileRef.current = patientForm;
    setPatientProfile(patientForm);
    setShowPatientForm(false);
    const pending = pendingQuestion;
    setPendingQuestion(null);
    if (pending) {
      sendToFastGPT(pending, { resetFollowUps: true, skipUserMessage: true });
    }
  }, [patientForm, pendingQuestion, sendToFastGPT]);

  const handleSwitchPatient = useCallback(() => {
    patientProfileRef.current = null;
    setPatientProfile(null);
    setPatientForm({
      gender: '',
      age: '',
    });
    setPendingQuestion(null);
    setShowPatientForm(true);
  }, []);

  const handleNewChat = useCallback(() => {
    const nextId = createId();
    setCurrentChatId(nextId);
    responseChatItemIdRef.current = null;
    detailPayloadRef.current = null;
    setMessages([]);
    setFollowUps([]);
    setFollowUpIndex(0);
    setFollowUpAnswers([]);
    setInteractivePrompt(null);
    setFormValues({});
    setShowWelcome(true);
    setPendingQuestion(null);
  }, []);

  const handleSelectHistory = useCallback(
    (chatId: string) => {
      if (!chatId || chatId === currentChatId) {
        setHistoryOpen(false);
        return;
      }
      setCurrentChatId(chatId);
      responseChatItemIdRef.current = null;
      detailPayloadRef.current = null;
      setMessages([]);
      setFollowUps([]);
      setFollowUpIndex(0);
      setFollowUpAnswers([]);
      setInteractivePrompt(null);
      setFormValues({});
      setShowWelcome(true);
      setPendingQuestion(null);
      setHistoryOpen(false);
    },
    [currentChatId],
  );

  const handleOptionClick = useCallback(
    (option: string) => {
      if (sending) {
        return;
      }
      const current = followUps[followUpIndex];
      if (!current) {
        return;
      }

      const updatedAnswers = [
        ...followUpAnswers,
        { id: current.id, question: current.question, answer: option },
      ];
      setFollowUpAnswers(updatedAnswers);

      const nextIndex = followUpIndex + 1;
      if (nextIndex >= followUps.length) {
        const snapshot = {
          questions: followUps,
          answers: updatedAnswers.map((item) => ({
            id: item.id,
            answer: item.answer,
          })),
        };
        setMessages((prev) => [
          ...prev,
          {
            id: createId(),
            role: 'ai',
            content: '',
            rawText: updatedAnswers
              .map((item, idx) => `${idx + 1}. ${item.answer}`)
              .join('\n'),
            followUpSnapshot: snapshot,
          },
        ]);
        const summary = buildFollowUpSummary(updatedAnswers);
        setFollowUps([]);
        setFollowUpIndex(0);
        setFollowUpAnswers([]);
        sendToFastGPT(`追问回答：\n${summary}`, {
          resetFollowUps: true,
          skipHistory: true,
        });
      } else {
        setFollowUpIndex(nextIndex);
      }
    },
    [
      followUps,
      followUpAnswers,
      followUpIndex,
      sending,
      sendToFastGPT,
    ],
  );

  const renderUserSelectLog = useCallback(
    (prompt: InteractivePrompt, selected: InteractiveOption) => (
      <div className="interactive-log-bubble">
        <div className="interactive-log-title">{prompt.description}</div>
        <div className="interactive-log-options">
          {(prompt.options ?? []).map((option) => (
            <span
              key={option.key}
              className={
                option.key === selected.key
                  ? 'interactive-log-option is-selected'
                  : 'interactive-log-option'
              }
            >
              {option.value}
            </span>
          ))}
        </div>
      </div>
    ),
    [],
  );

  const renderUserInputLog = useCallback(
    (prompt: InteractivePrompt, values: Record<string, string>) => (
      <div className="interactive-log-bubble">
        <div className="interactive-log-title">{prompt.description}</div>
        <div className="interactive-log-fields">
          {(prompt.formFields ?? []).map((field) => (
            <div key={field.key} className="interactive-log-field">
              <span className="interactive-log-label">{field.label}</span>
              <span className="interactive-log-value">
                {values[field.key] ?? '未填'}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    [],
  );

  const handleInteractiveSelect = useCallback(
    (option: InteractiveOption) => {
      if (!interactivePrompt || interactivePrompt.type !== 'userSelect') {
        return;
      }
      setInteractivePrompt(null);
      const baseDetailPayload =
        (interactivePrompt.detailPayload as DetailPayload) ??
        (detailPayloadRef.current as DetailPayload) ??
        null;
      const responseChatItemId = resolveResponseChatItemId(
        interactivePrompt.responseChatItemId,
        baseDetailPayload,
        responseChatItemIdRef.current,
      );
      const resolvedChatId = resolveChatId(
        baseDetailPayload,
        chatIdRef.current,
        conversationId,
      );
      const detailPayload = buildInteractiveDetailPayload(
        baseDetailPayload,
        option.value,
        responseChatItemId,
        { chatId: resolvedChatId },
      );
      const interactivePayload = {
        ...(interactivePrompt.payload as Record<string, unknown>),
        userSelect: {
          key: option.key,
          value: option.value,
        },
      };
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: 'ai',
          content: renderUserSelectLog(interactivePrompt, option),
          rawText: `${interactivePrompt.description}：${option.value}`,
        },
      ]);
      sendToFastGPT(option.value, {
        resetFollowUps: true,
        interactive: interactivePayload,
        detailPayload,
        responseChatItemId,
        skipUserMessage: true,
        showPlaceholder: false,
      });
    },
    [conversationId, interactivePrompt, renderUserSelectLog, sendToFastGPT],
  );

  const handleInteractiveFormSubmit = useCallback(() => {
    if (!interactivePrompt || interactivePrompt.type !== 'userInput') {
      return;
    }
    const fields = interactivePrompt.formFields ?? [];
    const missing = fields.some(
      (field) => field.required && !formValues[field.key],
    );
    if (missing) {
      return;
    }

    const summary = JSON.stringify(formValues);
    setInteractivePrompt(null);

    const baseDetailPayload =
      (interactivePrompt.detailPayload as DetailPayload) ??
      (detailPayloadRef.current as DetailPayload) ??
      null;
    const responseChatItemId = resolveResponseChatItemId(
      interactivePrompt.responseChatItemId,
      baseDetailPayload,
      responseChatItemIdRef.current,
    );
    const detailPayload = buildInteractiveDetailPayload(
      baseDetailPayload,
      summary,
      responseChatItemId,
    );

    const interactivePayload = {
      ...(interactivePrompt.payload as Record<string, unknown>),
      userInputForm: formValues,
    };

    setMessages((prev) => [
      ...prev,
      {
        id: createId(),
        role: 'ai',
        content: renderUserInputLog(interactivePrompt, formValues),
        rawText: Object.entries(formValues)
          .map(([key, value]) => `${key}：${value}`)
          .join('，'),
      },
    ]);

    sendToFastGPT(summary, {
      resetFollowUps: true,
      interactive: interactivePayload,
      detailPayload,
      responseChatItemId,
      skipUserMessage: true,
      showPlaceholder: true,
    });
  }, [formValues, interactivePrompt, renderUserInputLog, sendToFastGPT]);

  const handleDeleteHistory = useCallback(
    (chatId: string) => {
      deleteFastGPTChats(
        {
          baseUrl: config.baseUrl,
          apiKey: config.apiKey,
          appId: config.appId,
        },
        [chatId],
      )
        .then(() => {
          setChatHistory((prev) => {
            const next = prev.filter((entry) => entry.id !== chatId);
            persistChatHistory(next);
            return next;
          });
          if (chatId === currentChatId) {
            handleNewChat();
          }
        })
        .catch(() => {});
    },
    [config.baseUrl, config.apiKey, config.appId, currentChatId, handleNewChat],
  );

  const handleSpeak = useCallback(async (content: string) => {
    if (!content) {
      return;
    }
    if (speakingText === content) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setSpeakingText(null);
      return;
    }

    const speakWithBrowser = () => {
      const synth = window.speechSynthesis;
      if (!synth) {
        return;
      }
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(content);
      utterance.lang = 'zh-CN';
      utterance.onend = () => setSpeakingText(null);
      utterance.onerror = () => setSpeakingText(null);
      setSpeakingText(content);
      synth.speak(utterance);
    };

    console.log('TTS key length:', envConfig.dashscopeApiKey.length);
    if (!envConfig.dashscopeApiKey) {
      speakWithBrowser();
      return;
    }

    try {
      setSpeakingText(content);
      let url = ttsCacheRef.current.get(content);
      if (!url) {
      const result = await fetchDashscopeTTS(
        {
          apiKey: envConfig.dashscopeApiKey,
          voice: envConfig.dashscopeVoice,
          baseUrl: envConfig.dashscopeBaseUrl,
        },
        content,
      );
        url = result.url;
        ttsCacheRef.current.set(content, url);
        if (result.revoke) {
          ttsRevokeRef.current.set(content, result.revoke);
        }
      }

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.crossOrigin = 'anonymous';
      }
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = url;
      audioRef.current.onended = () => setSpeakingText(null);
      audioRef.current.onerror = () => {
        setSpeakingText(null);
        speakWithBrowser();
      };
      await audioRef.current.play();
    } catch (error) {
      console.warn('TTS 播放失败，切换浏览器朗读', error);
      setSpeakingText(null);
      speakWithBrowser();
    }
  }, [speakingText]);

  const actionItems = useCallback(
    (content: string) => [
      {
        key: 'copy',
        label: '复制',
        actionRender: () => <Actions.Copy text={content} />,
      },
    ],
    [],
  );

  const bubbleItems = useMemo<BubbleItemType[]>(
    () =>
      messages.map((message): BubbleItemType => {
        const copyText =
          typeof message.content === 'string' ? message.content : message.rawText;
        const followupQuestions =
          message.followUpSnapshot?.questions ?? null;
        const followupAnswers =
          message.followUpSnapshot?.answers ?? null;
        const followupContent =
          followupQuestions && followupAnswers ? (
            <FollowUpCarousel
              questions={followupQuestions}
              answers={followupAnswers}
            />
          ) : null;
        const renderedContent =
          message.role === 'ai' && typeof message.content === 'string' && message.content
            ? (
                <XMarkdown content={message.content} className="ai-markdown" />
              )
            : message.content;

        return {
          key: message.id,
          role: message.role === 'ai' ? 'ai' : message.role,
          placement: message.role === 'user' ? 'end' : 'start',
          content: followupContent ?? renderedContent,
          loading: message.loading,
          classNames: {
            content: message.role === 'user' ? 'bubble-user' : 'bubble-ai',
          },
          avatar: null,
          footer:
            message.role === 'ai' && copyText
              ? () => (
                  <div className="ai-footer">
                    <div className="ai-disclaimer">
                      以上内容由 AI 生成，仅供参考，具体请以线下咨询为准。
                    </div>
                    <div className="ai-actions">
                      <Actions items={actionItems(copyText)} />
                      <Button
                        type="text"
                        size="small"
                        icon={
                          speakingText === copyText ? (
                            <StopOutlined />
                          ) : (
                            <SoundOutlined />
                          )
                        }
                        onClick={() => handleSpeak(copyText)}
                        aria-label={speakingText === copyText ? '停止朗读' : '朗读'}
                      />
                    </div>
                  </div>
                )
              : undefined,
          typing:
            message.role === 'ai'
              ? ({ effect: 'typing' } as const)
              : false,
        };
      }),
    [messages, actionItems, handleSpeak, speakingText],
  );

  return (
    <div className="chat-screen">
      <AppHeader
        logoSrc={logoImage}
        title="智能导诊助手"
        subtitle="基于 AI 的院内导诊与问诊助手"
      />
      <div className="chat-screen__toolbar">
        <ChatHeader
          patientProfile={patientProfile}
          onSwitchPatient={handleSwitchPatient}
          onOpenHistory={() => setHistoryOpen(true)}
          onNewChat={handleNewChat}
        />
      </div>
      <div className="chat-screen__body" ref={bodyRef} onScroll={handleBodyScroll}>
        <WelcomePanel
          visible={
            showWelcome &&
            !showPatientForm &&
            followUps.length === 0 &&
            !interactivePrompt
          }
          imageSrc={doctorImage}
          title="欢迎使用智能导诊助手"
          subtitle="描述您的症状、持续时间与不适程度，我会为您提供导诊建议与预问诊辅助。"
          list={
            <ul className="welcome-panel__list">
              <li>症状初筛与就医方向建议</li>
              <li>结构化追问与问诊记录整理</li>
              <li>院内流程、科室与挂号指引</li>
            </ul>
          }
        />
        <ChatBubbleList items={bubbleItems} />
        {followUps.length > 0 && (
          <div className="followup-floating">
            <FollowUpCarousel
              questions={followUps}
              answers={followUpAnswers.map((item) => ({
                id: item.id,
                answer: item.answer,
              }))}
              activeIndex={followUpIndex}
              onNavigate={setFollowUpIndex}
              onSelect={handleOptionClick}
              disabled={sending}
            />
          </div>
        )}
        {interactivePrompt && (
          <div className="followup-floating">
            <InteractivePromptCard
              prompt={interactivePrompt}
              formValues={formValues}
              onFormChange={(key, value) =>
                setFormValues((prev) => ({ ...prev, [key]: value }))
              }
              onSelect={handleInteractiveSelect}
              onSubmit={handleInteractiveFormSubmit}
              disabled={sending}
            />
          </div>
        )}
        {showPatientForm && (
          <div className="followup-floating">
            <PatientRegisterCard
              value={patientForm}
              onChange={setPatientForm}
              onSubmit={handlePatientSubmit}
              disabled={sending}
            />
          </div>
        )}
        {!isAtBottom && (
          <Button
            className="scroll-to-bottom"
            shape="circle"
            type="primary"
            icon={<DownOutlined />}
            onClick={() =>
              bottomRef.current?.scrollIntoView({
                block: 'end',
                behavior: 'smooth',
              })
            }
            aria-label="回到底部"
          />
        )}
        <div ref={bottomRef} />
      </div>
      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        items={chatHistory}
        currentChatId={currentChatId}
        onSelect={handleSelectHistory}
        onDelete={handleDeleteHistory}
      />
      <ChatFooter
        value={input}
        onChange={(value) => setInput(value)}
        onSubmit={(value) => sendToFastGPT(value, { resetFollowUps: true })}
        loading={sending}
        className={`chat-sender${sending ? ' is-sending' : ''}`}
      />
    </div>
  );
};

export default App;
