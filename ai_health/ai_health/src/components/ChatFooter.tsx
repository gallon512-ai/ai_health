import { AudioOutlined, PauseCircleOutlined } from '@ant-design/icons';
import { Sender } from '@ant-design/x';
import { Button, Typography } from 'antd';

const ChatFooter = ({
  value,
  onChange,
  onSubmit,
  loading,
  className,
  voiceCallActive,
  voiceCallStatus,
  voiceTranscript,
  voiceCallError,
  onStartVoiceCall,
  onStopVoiceCall,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  loading: boolean;
  className: string;
  voiceCallActive: boolean;
  voiceCallStatus: 'idle' | 'listening' | 'processing' | 'error';
  voiceTranscript: string;
  voiceCallError: string | null;
  onStartVoiceCall: () => void;
  onStopVoiceCall: () => void;
}) => (
  <div className="chat-screen__footer">
    <div className="voice-call__bar">
      <Button
        type={voiceCallActive ? 'default' : 'primary'}
        icon={voiceCallActive ? <PauseCircleOutlined /> : <AudioOutlined />}
        onClick={voiceCallActive ? onStopVoiceCall : onStartVoiceCall}
      >
        {voiceCallActive ? '结束语音通话' : '开始语音通话'}
      </Button>
      <Typography.Text className="voice-call__status">
        {voiceCallStatus === 'listening'
          ? '正在聆听...'
          : voiceCallStatus === 'processing'
            ? '语音识别中...'
            : voiceCallStatus === 'error'
              ? '语音通话异常'
              : '空闲'}
      </Typography.Text>
      {voiceCallError && (
        <Typography.Text className="voice-call__error">
          {voiceCallError}
        </Typography.Text>
      )}
    </div>
    {voiceCallActive && (
      <div className="voice-call__panel">
        <Typography.Text className="voice-call__hint">实时语音转写</Typography.Text>
        <div className="voice-call__transcript">
          {voiceTranscript || '请开始描述症状，我会实时转写并提交。'}
        </div>
      </div>
    )}
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