import {
  AntDesignOutlined,
  BarsOutlined,
  FormOutlined,
  ManOutlined,
  SwapOutlined,
  WomanOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Typography } from 'antd';
import type { PatientProfile } from '../types/chat';

const ChatHeader = ({
  patientProfile,
  onSwitchPatient,
  onOpenHistory,
  onNewChat,
}: {
  patientProfile: PatientProfile | null;
  onSwitchPatient: () => void;
  onOpenHistory: () => void;
  onNewChat: () => void;
}) => (
  <div className="chat-body__header">
    <div className="chat-header__left">
      <Avatar style={{ backgroundColor: '#0f4c81' }}>
        {patientProfile?.gender === '男' ? (
          <ManOutlined />
        ) : patientProfile?.gender === '女' ? (
          <WomanOutlined />
        ) : (
          <AntDesignOutlined />
        )}
      </Avatar>
      <div className="chat-header__info">
        <div className="chat-header__row">
          <Typography.Text className="chat-header__title">
            {patientProfile ? patientProfile.gender : '未知'}
          </Typography.Text>
          <Typography.Text className="chat-header__title">
            {patientProfile ? `${patientProfile.age}岁` : '未知'}
          </Typography.Text>
          <Button
            icon={<SwapOutlined />}
            onClick={onSwitchPatient}
            aria-label="切换患者"
            size="small"
          />
        </div>
      </div>
    </div>
    <div className="chat-header__right">
      <Button
        icon={<BarsOutlined />}
        onClick={onOpenHistory}
        size="small"
        type="text"
      />
      <Button
        icon={<FormOutlined />}
        onClick={onNewChat}
        size="small"
        type="text"
      />
    </div>
  </div>
);

export default ChatHeader;
