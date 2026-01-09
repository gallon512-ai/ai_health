import { Bubble } from '@ant-design/x';
import type { BubbleItemType } from '@ant-design/x';

const ChatBubbleList = ({ items }: { items: BubbleItemType[] }) => (
  <Bubble.List
    items={items}
    className="chat__list"
    role={{
      system: { variant: 'borderless' },
      ai: { placement: 'start' },
      user: { placement: 'end' },
    }}
  />
);

export default ChatBubbleList;
