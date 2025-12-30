// =============================================
// PLANAC ERP - Button Component
// =============================================

import React from 'react';
import { Icons } from './Icons';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants = {
  primary: 'bg-planac-500 text-white hover:bg-planac-600 border-transparent',
  secondary: 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200',
  ghost: 'bg-transparent text-gray-600 hover:bg-gray-100 border-transparent',
  danger: 'bg-red-500 text-white hover:bg-red-600 border-transparent',
  success: 'bg-green-500 text-white hover:bg-green-600 border-transparent',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium rounded-xl border
        transition-colors focus:outline-none focus:ring-2 focus:ring-planac-500/20
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Icons.spinner className="w-4 h-4 animate-spin" />
      ) : leftIcon ? (
        <span className="w-5 h-5">{leftIcon}</span>
      ) : null}
      {children}
      {rightIcon && !isLoading && <span className="w-5 h-5">{rightIcon}</span>}
    </button>
  );
}

export default Button;
