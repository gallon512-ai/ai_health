import { Sender } from '@ant-design/x';

const ChatFooter = ({
  value,
  onChange,
  onSubmit,
  loading,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  loading: boolean;
  className: string;
}) => (
  <div className="chat-screen__footer">
    <Sender
      value={value}
      onChange={onChange}
      onSubmit={onSubmit}
      loading={loading}
      submitType="enter"
      placeholder="请输入问题，点击发送..."
      autoSize={{ minRows: 2, maxRows: 5 }}
      className={className}
    />
  </div>
);

export default ChatFooter;
