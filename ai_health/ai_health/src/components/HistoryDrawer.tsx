import { DeleteOutlined } from '@ant-design/icons';
import { Button, Drawer, List } from 'antd';
import type { ChatHistoryItem } from '../types/chat';

const HistoryDrawer = ({
  open,
  onClose,
  items,
  currentChatId,
  nowTimestamp,
  onSelect,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  items: ChatHistoryItem[];
  currentChatId: string;
  nowTimestamp: number;
  onSelect: (chatId: string) => void;
  onDelete: (chatId: string) => void;
}) => (
  <Drawer
    placement="right"
    open={open}
    onClose={onClose}
    title="历史会话"
    width="50%"
  >
    {items.map((item, index) => {
      const itemTime = Date.parse(item.lastTime ?? item.createdAt);
      const now = nowTimestamp || itemTime;
      const ageDays = Math.floor((now - itemTime) / (24 * 60 * 60 * 1000));
      const currentGroup =
        ageDays <= 3
          ? new Date(itemTime).toLocaleDateString('zh-CN')
          : ageDays <= 30
            ? '7天前到1个月前'
            : '30天前';
      const prevTime =
        index > 0
          ? Date.parse(items[index - 1].lastTime ?? items[index - 1].createdAt)
          : null;
      const prevAgeDays =
        prevTime !== null
          ? Math.floor((now - prevTime) / (24 * 60 * 60 * 1000))
          : null;
      const prevGroup =
        prevAgeDays === null
          ? null
          : prevAgeDays <= 3
            ? new Date(prevTime as number).toLocaleDateString('zh-CN')
            : prevAgeDays <= 30
              ? '7天前到1个月前'
              : '30天前';
      const showDivider = currentGroup !== prevGroup;
      return (
        <div key={item.id}>
          {showDivider && (
            <div className="chat-history__date">{currentGroup}</div>
          )}
          <List.Item
            onClick={() => onSelect(item.id)}
            className={
              item.id === currentChatId
                ? 'chat-history__item is-active'
                : 'chat-history__item'
            }
          >
            <div className="chat-history__meta">
              <div className="chat-history__title">
                {item.lastMessage ?? `会话 ${items.length - index}`}
              </div>
              <div className="chat-history__time">
                {new Date(item.lastTime ?? item.createdAt).toLocaleTimeString('zh-CN')}
              </div>
            </div>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={(event) => {
                event.stopPropagation();
                onDelete(item.id);
              }}
            />
          </List.Item>
          <div className="chat-history__divider" />
        </div>
      );
    })}
  </Drawer>
);

export default HistoryDrawer;
