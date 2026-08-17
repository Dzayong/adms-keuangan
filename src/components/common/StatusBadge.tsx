import React from 'react';
import { TransactionStatus } from '../../types/index.js';
import { Badge } from '../ui/Badge.js';

interface Props {
  status: TransactionStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const getBadgeVariant = () => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
      case 'CANCELLED':
        return 'error';
      case 'EXPIRED':
        return 'neutral';
      case 'REFUNDED':
        // Our Badge component doesn't have a specific purple 'refunded' variant, 
        // we can use info or add a custom class. Let's add it to the className instead or just use neutral.
        // Actually, let's just use a neutral or info variant and apply custom classes if needed.
        return 'info'; 
      default:
        return 'neutral';
    }
  };

  const getExtraClasses = () => {
    if (status === 'PENDING') return 'animate-pulse';
    if (status === 'REFUNDED') return 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-500 border-purple-200 dark:border-purple-900/50';
    return '';
  };

  return (
    <Badge variant={getBadgeVariant()} size={size} className={getExtraClasses()}>
      {status}
    </Badge>
  );
};

