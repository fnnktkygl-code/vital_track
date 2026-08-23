'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glass' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-bold select-none cursor-pointer transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";

    const variantStyles = {
      primary: "app-btn-primary",
      secondary: "app-btn-secondary",
      glass: "bg-white/10 dark:bg-slate-900/60 backdrop-blur-md border border-white/20 dark:border-slate-700/50 text-slate-900 dark:text-white hover:border-emerald-500/50 shadow-md",
      danger: "bg-red-500/15 text-red-500 border border-red-500/30 hover:bg-red-500/25 active:scale-[0.97]",
      ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5",
    };

    const sizeStyles = {
      sm: "text-xs px-3 py-1.5 rounded-xl gap-1.5",
      md: "text-sm px-4 py-2.5 rounded-2xl gap-2",
      lg: "text-base px-6 py-3 rounded-2xl gap-2.5",
      icon: "w-10 h-10 min-w-10 min-h-10 p-0 rounded-2xl",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && <i className="ri-loader-4-line animate-spin text-lg" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
