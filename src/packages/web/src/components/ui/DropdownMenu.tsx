// =============================================
// PLANAC ERP - Dropdown Menu (3 pontinhos)
// =============================================

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Icons } from './Icons';

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'success' | 'danger';
  type?: 'item' | 'separator';
}

interface DropdownMenuProps {
  items: MenuItem[];
  trigger?: React.ReactNode;
}

export function DropdownMenu({ items, trigger }: DropdownMenuProps) {
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

  const getItemClasses = (variant?: string) => {
    const base = 'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors';
    switch (variant) {
      case 'success': return `${base} text-green-600 hover:bg-green-50`;
      case 'danger': return `${base} text-red-600 hover:bg-red-50`;
      default: return `${base} text-gray-700 hover:bg-gray-50`;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
      >
        {trigger || <Icons.dots className="w-5 h-5" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-48 z-50 animate-fade-in">
          {items.map((item, index) => {
            if (item.type === 'separator') {
              return <div key={index} className="border-t border-gray-100 my-2" />;
            }
            return (
              <button
                key={index}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                className={getItemClasses(item.variant)}
              >
                {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DropdownMenu;
