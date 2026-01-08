import type { ReactNode } from 'react';
import { Typography } from 'antd';

const WelcomePanel = ({
  visible,
  imageSrc,
  title,
  subtitle,
  list,
}: {
  visible: boolean;
  imageSrc: string;
  title: string;
  subtitle: string;
  list: ReactNode;
}) => {
  if (!visible) {
    return null;
  }

  return (
    <div className="welcome-panel">
      <div className="welcome-panel__content">
        <img className="welcome-panel__image" src={imageSrc} alt="导诊助手" />
        <div className="welcome-panel__text">
          <Typography.Title level={4} className="welcome-panel__title">
            {title}
          </Typography.Title>
          <Typography.Text type="secondary" className="welcome-panel__subtitle">
            {subtitle}
          </Typography.Text>
          {list}
        </div>
      </div>
    </div>
  );
};

export default WelcomePanel;
