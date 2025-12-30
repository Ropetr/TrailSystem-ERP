// =============================================
// TRAILSYSTEM ERP - Admin Placeholder Component
// Componente reutilizável para páginas em desenvolvimento
// =============================================

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';

interface AdminPlaceholderProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  features?: string[];
}

export function AdminPlaceholder({ title, description, icon, features }: AdminPlaceholderProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
        <p className="text-gray-500 dark:text-gray-400">{description}</p>
      </div>

      {/* Em Desenvolvimento Card */}
      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
            {icon || <Icons.alertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Em Desenvolvimento</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
            </p>
          </div>
        </div>
      </Card>

      {/* Features Preview */}
      {features && features.length > 0 && (
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Funcionalidades Planejadas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <Icons.check className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default AdminPlaceholder;
