import React from 'react';
import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; label: string };
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

const StatCard: React.FC<Props> = ({
  label, value, icon, iconColor = 'text-primary-600',
  iconBg = 'bg-primary-50 dark:bg-primary-900/30',
  trend, subtitle, className, onClick,
}) => (
  <div
    className={clsx('stat-card', onClick && 'cursor-pointer hover:shadow-card-hover transition-shadow', className)}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
  >
    <div className={clsx('stat-icon', iconBg, iconColor)}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtitle}</p>}
      {trend && (
        <div className={clsx(
          'flex items-center gap-1 text-xs font-medium mt-1',
          trend.value > 0 ? 'text-green-600' : trend.value < 0 ? 'text-red-500' : 'text-gray-400'
        )}>
          {trend.value > 0 ? <TrendingUp size={12} /> : trend.value < 0 ? <TrendingDown size={12} /> : <Minus size={12} />}
          <span>{trend.value > 0 ? '+' : ''}{trend.value}% {trend.label}</span>
        </div>
      )}
    </div>
  </div>
);

export default StatCard;
