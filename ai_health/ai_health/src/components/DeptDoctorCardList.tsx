import type { ReactNode } from 'react';

const doctorMap: Record<
  string,
  Array<{ name: string; title: string; desc: string }>
> = {
  感染性疾病科: [
    {
      name: '王思远',
      title: '主任医师',
      desc: '擅长发热评估、感染性疾病筛查与随访。',
    },
    {
      name: '李若彤',
      title: '副主任医师',
      desc: '擅长肝炎、感染性腹泻及防控咨询。',
    },
    {
      name: '周明宇',
      title: '主治医师',
      desc: '擅长呼吸道感染与常见传染病诊疗。',
    },
  ],
};

const buildFallbackDoctors = (deptName: string) => [
  {
    name: `${deptName}·张医生`,
    title: '主任医师',
    desc: '擅长常见病诊疗与分诊建议。',
  },
  {
    name: `${deptName}·刘医生`,
    title: '副主任医师',
    desc: '擅长疾病评估与检查解读。',
  },
  {
    name: `${deptName}·陈医生`,
    title: '主治医师',
    desc: '擅长慢病管理与随访指导。',
  },
];

const DeptDoctorCardList = ({
  deptCode,
  title,
}: {
  deptCode: string;
  title?: ReactNode;
}) => {
  const list = doctorMap[deptCode] ?? buildFallbackDoctors(deptCode);

  return (
    <div className="dept-doctor-list">
      <div className="dept-doctor-list__title">
        {title ?? `${deptCode}医生推荐`}
      </div>
      <div className="dept-doctor-list__grid">
        {list.map((doctor) => (
          <div key={doctor.name} className="dept-doctor-card">
            <div className="dept-doctor-card__name">{doctor.name}</div>
            <div className="dept-doctor-card__title">{doctor.title}</div>
            <div className="dept-doctor-card__desc">{doctor.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeptDoctorCardList;
