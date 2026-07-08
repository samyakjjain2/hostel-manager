import React from 'react';
import clsx from 'clsx';

export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  className,
  disabled,
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border border-transparent',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm border border-transparent',
    outline: 'bg-transparent text-slate-800 border border-slate-300 hover:bg-slate-50',
    gradient: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md border-0'
  };

  return (
    <button
      type={type}
      className={clsx(baseStyles, variants[variant], className)}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
