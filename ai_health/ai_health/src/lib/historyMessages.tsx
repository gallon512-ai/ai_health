import type { FastGPTRecord } from './fastgpt';
import type { ChatMessage, ChatRole, InteractiveOption } from '../types/chat';
import { HistoryFormLog, HistorySelectLog } from '../components/HistoryLogs';
import { extractFollowUps, parseFormContent, stripCites } from './chatHelpers';

type HistoryBlock = NonNullable<FastGPTRecord['blocks']>[number];

const toInteractivePayload = (block: HistoryBlock) =>
  (block?.interactive ?? {}) as {
    type?: string;
    params?: {
      description?: string;
      userSelectOptions?: Array<{ key: string; value: string }>;
      userSelectedVal?: string;
      inputForm?: Array<{
        key: string;
        label: string;
        value?: string;
        defaultValue?: string;
      }>;
    };
  };

export const buildHistoryMessages = (
  records: FastGPTRecord[],
  createId: () => string,
) =>
  records.flatMap((record) => {
    const messages: ChatMessage[] = [];
    const baseRole: ChatRole = record.role === 'assistant' ? 'ai' : record.role;
    const textBuffer: string[] = [];
    const flushTextBuffer = (suffix: string) => {
      if (!textBuffer.length) {
        return;
      }
      const content = textBuffer.join('\n');
      textBuffer.length = 0;
      messages.push({
        id: `${record.id || createId()}-text-${suffix}`,
        role: baseRole,
        content,
        rawText: content,
      });
    };

    const handleTextContent = (content: string, suffix: string) => {
      const trimmed = stripCites(content.trim());
      if (!trimmed) {
        return;
      }
      const followUps = extractFollowUps(trimmed);
      if (followUps?.length) {
        flushTextBuffer(`${suffix}-before`);
        messages.push({
          id: `${record.id || createId()}-followup-${suffix}`,
          role: 'ai',
          content: '',
          rawText: '',
          followUpSnapshot: {
            questions: followUps,
            answers: [],
          },
        });
        return;
      }
      const formValues = parseFormContent(trimmed);
      if (formValues) {
        flushTextBuffer(`${suffix}-before`);
        messages.push({
          id: `${record.id || createId()}-form-${suffix}`,
          role: baseRole,
          content: <HistoryFormLog values={formValues} />,
          rawText: Object.entries(formValues)
            .map(([key, value]) => `${key}：${value}`)
            .join('，'),
        });
        return;
      }
      textBuffer.push(trimmed);
    };

    if (record.blocks?.length) {
      record.blocks.forEach((block, index) => {
        if (block?.type === 'text' && block?.text?.content) {
          handleTextContent(String(block.text.content), `${index}`);
          return;
        }
        if (block?.type !== 'interactive' || !block?.interactive) {
          return;
        }
        flushTextBuffer(`${index}-interactive`);
        const interactivePayload = toInteractivePayload(block);
        if (
          interactivePayload?.type === 'userSelect' &&
          interactivePayload?.params?.userSelectOptions?.length
        ) {
          const options = interactivePayload.params.userSelectOptions as InteractiveOption[];
          messages.push({
            id: `${record.id || createId()}-select-${index}`,
            role: 'ai',
            content: (
              <HistorySelectLog
                description={interactivePayload.params.description ?? '请选择'}
                options={options}
                selected={interactivePayload.params.userSelectedVal}
              />
            ),
            rawText: interactivePayload.params.description ?? '',
          });
          return;
        }
        if (
          interactivePayload?.type === 'userInput' &&
          interactivePayload?.params?.inputForm?.length
        ) {
          const formValues = interactivePayload.params.inputForm.reduce(
            (acc, field) => ({
              ...acc,
              [field.label || field.key]: field.value ?? field.defaultValue ?? '',
            }),
            {} as Record<string, string>,
          );
          messages.push({
            id: `${record.id || createId()}-form-${index}`,
            role: 'ai',
            content: (
              <HistoryFormLog
                values={formValues}
                title={interactivePayload.params.description ?? '既往病史'}
              />
            ),
            rawText: Object.entries(formValues)
              .map(([key, value]) => `${key}：${value}`)
              .join('，'),
          });
        }
      });
    } else {
      handleTextContent(String(record.content ?? ''), '0');
    }

    flushTextBuffer('tail');

    return messages;
  });
