// =============================================
// PLANAC ERP - Select Dropdown
// =============================================

import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Selecione...',
  label,
  error,
  disabled = false,
  className = '',
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`
            w-full px-3 py-2 bg-white border rounded-lg text-sm text-left
            flex items-center justify-between transition-colors
            ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'hover:border-gray-300 cursor-pointer border-gray-200'}
            ${isOpen ? 'border-planac-500 ring-2 ring-planac-500/20' : ''}
            ${error ? 'border-red-500' : ''}
          `}
        >
          <span className={selectedOption ? 'text-gray-800' : 'text-gray-400'}>
            {selectedOption?.label || placeholder}
          </span>
          <Icons.chevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 max-h-60 overflow-auto animate-slide-down">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full px-4 py-2 text-sm text-left flex items-center justify-between transition-colors
                  ${option.value === value
                    ? 'bg-planac-50 text-planac-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <span>{option.label}</span>
                {option.value === value && <Icons.check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default Select;
