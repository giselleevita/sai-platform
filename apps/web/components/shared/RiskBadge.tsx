import { getRiskColor } from '@/lib/utils';
import { RiskLevel } from '@/constants';

interface RiskBadgeProps {
  level: RiskLevel | string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function RiskBadge({ level, showLabel = true, size = 'md' }: RiskBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${getRiskColor(level)} ${sizeClasses[size]}`}
    >
      {showLabel && level}
    </span>
  );
}
