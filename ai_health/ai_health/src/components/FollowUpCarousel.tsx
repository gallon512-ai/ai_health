import { useState } from 'react';
import type { FollowUpQuestion } from '../types/chat';

const FollowUpCarousel = ({
  questions,
  answers,
  activeIndex,
  onNavigate,
  onSelect,
  disabled = false,
}: {
  questions: FollowUpQuestion[];
  answers: Array<{ id: number; answer: string }>;
  activeIndex?: number;
  onNavigate?: (nextIndex: number) => void;
  onSelect?: (option: string) => void;
  disabled?: boolean;
}) => {
  const [localIndex, setLocalIndex] = useState(0);
  const index = activeIndex ?? localIndex;
  const clampedIndex = Math.max(0, Math.min(index, questions.length - 1));
  const question = questions[clampedIndex];
  const answerMap = new Map(answers.map((item) => [item.id, item.answer]));

  if (!question) {
    return null;
  }

  const goto = (next: number) => {
    const nextIndex = Math.max(0, Math.min(next, questions.length - 1));
    if (onNavigate) {
      onNavigate(nextIndex);
      return;
    }
    setLocalIndex(nextIndex);
  };

  return (
    <div className="followup-carousel">
      <div className="followup-carousel__header">
        <span>{`(${clampedIndex + 1}/${questions.length}) ${question.question}`}</span>
      </div>
      <div className="followup-carousel__answer">
        {answerMap.get(question.id) ?? '未选择'}
      </div>
      {onSelect && (
        <div className="followup-options">
          {question.options.map((option) => (
            <button
              key={option}
              type="button"
              className="followup-option"
              onClick={() => onSelect(option)}
              disabled={disabled}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      <div className="followup-carousel__nav">
        <button
          type="button"
          className="followup-nav"
          onClick={() => goto(clampedIndex - 1)}
          disabled={disabled || clampedIndex === 0}
        >
          上一题
        </button>
        <button
          type="button"
          className="followup-nav"
          onClick={() => goto(clampedIndex + 1)}
          disabled={disabled || clampedIndex === questions.length - 1}
        >
          下一题
        </button>
      </div>
    </div>
  );
};

export default FollowUpCarousel;
