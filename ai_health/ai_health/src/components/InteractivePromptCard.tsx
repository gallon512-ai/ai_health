import { Button, Select } from 'antd';
import type { InteractiveOption, InteractivePrompt } from '../types/chat';
import InteractiveSelectCard from './InteractiveSelectCard';


const InteractivePromptCard = ({
  prompt,
  formValues,
  onFormChange,
  onSelect,
  onSubmit,
  disabled,
}: {
  prompt: InteractivePrompt | null;
  formValues: Record<string, string>;
  onFormChange: (key: string, value: string) => void;
  onSelect: (option: InteractiveOption) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) => {
  if (!prompt) {
    return null;
  }

  if (prompt.type === 'userSelect') {
    return (
      <InteractiveSelectCard
        description={prompt.description}
        options={prompt.options ?? []}
        onSelect={onSelect}
        disabled={disabled}
      />
    );
  }

  return (
    <div className="interactive-card">
      <div className="interactive-card__title">{prompt.description}</div>
      <div className="interactive-form">
        {(prompt.formFields ?? []).map((field) => (
          <div key={field.key} className="interactive-form__item">
            <div className="interactive-form__label">
              {field.label}
              {field.required ? ' *' : ''}
            </div>
            <Select
              value={formValues[field.key]}
              placeholder={field.description}
              options={field.list.map((item) => ({
                label: item.label,
                value: item.value,
              }))}
              onChange={(value) => onFormChange(field.key, value)}
            />
          </div>
        ))}
      </div>
      <Button type="primary" onClick={onSubmit} disabled={disabled}>
        提交
      </Button>
    </div>
  );
};

export default InteractivePromptCard;
