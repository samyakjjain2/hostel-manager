import React from 'react';
import clsx from 'clsx';

export const Badge = ({ children, variant = 'neutral', className }) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border transition-colors';
  
  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200/60',
    primary: 'bg-blue-50 text-blue-650 border-blue-100/60',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100/60',
    warning: 'bg-amber-50 text-amber-700 border-amber-100/60',
    danger: 'bg-rose-50 text-rose-600 border-rose-100/60'
  };

  return (
    <span className={clsx(baseStyles, variants[variant], className)}>
      {children}
    </span>
  );
};
