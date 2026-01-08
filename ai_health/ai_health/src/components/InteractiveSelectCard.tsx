import type { InteractiveOption } from '../types/chat';

const InteractiveSelectCard = ({
  description,
  options,
  onSelect,
  disabled = false,
}: {
  description: string;
  options: InteractiveOption[];
  onSelect: (option: InteractiveOption) => void;
  disabled?: boolean;
}) => (
  <div className="interactive-card">
    <div className="interactive-card__title">{description}</div>
    <div className="followup-options">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          className="followup-option"
          onClick={() => onSelect(option)}
          disabled={disabled}
        >
          {option.value}
        </button>
      ))}
    </div>
  </div>
);

export default InteractiveSelectCard;
