import type { InteractiveOption } from '../types/chat';

export const HistoryFormLog = ({
  title = '问诊表单',
  values,
}: {
  title?: string;
  values: Record<string, string>;
}) => (
  <div className="interactive-log-bubble">
    <div className="interactive-log-title">{title}</div>
    <div className="interactive-log-fields">
      {Object.entries(values).map(([key, value]) => (
        <div key={key} className="interactive-log-field">
          <span className="interactive-log-label">{key}</span>
          <span className="interactive-log-value">{value}</span>
        </div>
      ))}
    </div>
  </div>
);

export const HistorySelectLog = ({
  description,
  options,
  selected,
}: {
  description: string;
  options: InteractiveOption[];
  selected?: string;
}) => (
  <div className="interactive-log-bubble">
    <div className="interactive-log-title">{description}</div>
    <div className="interactive-log-options">
      {options.map((option) => (
        <span
          key={option.key}
          className={
            option.value === selected
              ? 'interactive-log-option is-selected'
              : 'interactive-log-option'
          }
        >
          {option.value}
        </span>
      ))}
    </div>
  </div>
);
