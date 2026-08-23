'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface AppCloseBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClose?: () => void;
}

export const AppCloseBtn: React.FC<AppCloseBtnProps> = ({ className, onClose, ...props }) => {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Fermer"
      className={cn("app-close-btn", className)}
      {...props}
    >
      <i className="ri-close-line text-lg" />
    </button>
  );
};
