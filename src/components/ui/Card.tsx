import React from 'react';

export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50 ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <h3 className={`font-semibold leading-none tracking-tight ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <p className={`text-sm text-slate-500 dark:text-slate-400 ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`flex items-center p-6 pt-0 ${className}`}>
    {children}
  </div>
);
