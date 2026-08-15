import React from 'react';
import { TransactionStatus } from '../../types/index.js';

interface Props {
  status: TransactionStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const getBadgeStyle = () => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PENDING':
        return 'bg-indigo-100 text-yellow-700 border-indigo-200 dark:border-indigo-900/50 animate-pulse';
      case 'FAILED':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'EXPIRED':
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200 dark:border-rose-900/50';
      case 'REFUNDED':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800';
    }
  };

  const sizeClass =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px]'
      : size === 'lg'
      ? 'px-3 py-1 text-xs'
      : 'px-2 py-0.5 text-[10px]';

  return (
    <span
      className={`inline-block font-mono font-bold uppercase rounded border ${sizeClass} ${getBadgeStyle()}`}
    >
      {status}
    </span>
  );
};

