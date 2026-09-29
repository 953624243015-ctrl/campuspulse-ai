import React from 'react';
import { clsx } from 'clsx';

type Variant = 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray';

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

const variantMap: Record<Variant, string> = {
  green:  'badge-green',
  red:    'badge-red',
  yellow: 'badge-yellow',
  blue:   'badge-blue',
  purple: 'badge-purple',
  gray:   'badge-gray',
};

const Badge: React.FC<Props> = ({ children, variant = 'gray', className }) => (
  <span className={clsx(variantMap[variant], className)}>{children}</span>
);

export default Badge;

// Utility: map common statuses to badge variants
export const statusVariant = (status: string): Variant => {
  const map: Record<string, Variant> = {
    submitted: 'blue',
    assigned: 'yellow',
    in_progress: 'yellow',
    resolved: 'green',
    verified: 'green',
    closed: 'gray',
    low: 'green',
    medium: 'yellow',
    high: 'red',
    critical: 'red',
    upcoming: 'blue',
    ongoing: 'green',
    completed: 'gray',
    cancelled: 'red',
    present: 'green',
    absent: 'red',
    late: 'yellow',
    moderate: 'yellow',
    operational: 'green',
    needs_maintenance: 'yellow',
    under_maintenance: 'blue',
    decommissioned: 'gray',
    published: 'green',
    draft: 'gray',
    active: 'green',
    inactive: 'gray',
  };
  return map[status?.toLowerCase()] || 'gray';
};
