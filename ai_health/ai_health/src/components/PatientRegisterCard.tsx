import { Button, Input, Select } from 'antd';
import type { PatientProfile } from '../types/chat';

const PatientRegisterCard = ({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: PatientProfile;
  onChange: (next: PatientProfile) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) => (
  <div className="interactive-card">
    <div className="interactive-card__title">患者注册信息</div>
    <div className="interactive-form">
      <div className="interactive-form__item">
        <div className="interactive-form__label">性别 *</div>
        <Select
          value={value.gender}
          placeholder="请选择性别"
          options={[
            { label: '男', value: '男' },
            { label: '女', value: '女' },
            { label: '其他', value: '其他' },
          ]}
          onChange={(gender) => onChange({ ...value, gender })}
        />
      </div>
      <div className="interactive-form__item">
        <div className="interactive-form__label">年龄 *</div>
        <Input
          value={value.age}
          placeholder="请输入年龄"
          onChange={(event) =>
            onChange({
              ...value,
              age: event.target.value.replace(/\\D/g, ''),
            })
          }
          inputMode="numeric"
        />
      </div>
    </div>
    <Button type="primary" onClick={onSubmit} disabled={disabled}>
      保存并继续
    </Button>
  </div>
);

export default PatientRegisterCard;
