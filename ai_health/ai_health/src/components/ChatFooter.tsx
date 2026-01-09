import { AudioOutlined, KeyOutlined } from '@ant-design/icons';
import { Sender } from '@ant-design/x';
import { Button } from 'antd';

const ChatFooter = ({
  value,
  onChange,
  onSubmit,
  loading,
  className,
  mode,
  onToggleMode,
  onRecordStart,
  onRecordEnd,
  recording,
  asrLoading,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  loading: boolean;
  className: string;
  mode: 'text' | 'voice';
  onToggleMode: () => void;
  onRecordStart: () => void;
  onRecordEnd: () => void;
  recording: boolean;
  asrLoading: boolean;
}) => {
  const shellClassName = loading ? 'chat-input-shell is-sending' : 'chat-input-shell';

  return (
    <div className="chat-screen__footer">
      {mode === 'text' ? (
        <div className="chat-input-row">
          <Button
            type="default"
            icon={<AudioOutlined />}
            onClick={onToggleMode}
            className="chat-input-toggle"
            aria-label="切换语音输入"
          />
          <div className={shellClassName}>
            <Sender
              value={value}
              onChange={onChange}
              onSubmit={onSubmit}
              loading={loading}
              submitType="enter"
              placeholder="请输入问题，点击发送..."
              autoSize={{ minRows: 1, maxRows: 5 }}
              className={`${className} chat-sender--inline`}
            />
          </div>
        </div>
      ) : (
        <div className="chat-input-row">
          <Button
            type="default"
            icon={<KeyOutlined />}
            onClick={onToggleMode}
            className="chat-input-toggle"
            aria-label="切换文字输入"
          />
          <div className="chat-input-shell chat-input-shell--voice">
            <button
              type="button"
              className={
                recording
                  ? 'voice-record-btn voice-record-btn--inline is-recording'
                  : 'voice-record-btn voice-record-btn--inline'
              }
              onMouseDown={onRecordStart}
              onMouseUp={onRecordEnd}
              onMouseLeave={onRecordEnd}
              onTouchStart={onRecordStart}
              onTouchEnd={onRecordEnd}
              disabled={asrLoading}
            >
              <span className="voice-record-btn__text">
                {asrLoading ? '识别中...' : recording ? '松开结束' : '按住说话'}
              </span>
              <span className="voice-record-btn__wave">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatFooter;
