import React from 'react';
import { Inbox } from 'lucide-react';

interface Props {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<Props> = ({
  icon = <Inbox size={40} className="text-gray-300 dark:text-gray-600" />,
  title = 'No data found',
  description = 'There is nothing to show here yet.',
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {icon}
    <h3 className="mt-4 text-base font-medium text-gray-900 dark:text-white">{title}</h3>
    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xs">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
