import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({
  className = '',
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}, ref) => {
  const baseStyles = 'inline-block font-mono font-bold uppercase rounded border';

  const variants = {
    success: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-500 border-emerald-200 dark:border-emerald-900/50',
    warning: 'bg-indigo-100 dark:bg-indigo-950/30 text-yellow-700 dark:text-yellow-500 border-indigo-200 dark:border-indigo-900/50',
    error: 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-500 border-rose-200 dark:border-rose-900/50',
    info: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-500 border-blue-200 dark:border-blue-900/50',
    neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    outline: 'bg-transparent text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm',
  };

  return (
    <span
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';
