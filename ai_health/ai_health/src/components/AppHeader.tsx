import { Typography } from 'antd';

const AppHeader = ({
  logoSrc,
  title,
  subtitle,
}: {
  logoSrc: string;
  title: string;
  subtitle: string;
}) => (
  <div className="app-header">
    <img className="app-header__logo" src={logoSrc} alt={title} />
    <div className="app-header__info">
      <Typography.Title level={4} className="app-header__title">
        {title}
      </Typography.Title>
      <Typography.Text type="secondary" className="app-header__subtitle">
        {subtitle}
      </Typography.Text>
    </div>
  </div>
);

export default AppHeader;
