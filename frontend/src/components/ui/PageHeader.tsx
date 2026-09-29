import React from 'react';

interface Props {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

const PageHeader: React.FC<Props> = ({ title, subtitle, actions, badge }) => (
  <div className="page-header flex items-start justify-between gap-4 flex-wrap">
    <div>
      <div className="flex items-center gap-2">
        <h1 className="page-title">{title}</h1>
        {badge}
      </div>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
  </div>
);

export default PageHeader;
