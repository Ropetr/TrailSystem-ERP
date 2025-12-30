// =============================================
// TRAILSYSTEM ERP - Admin Dashboard Page
// Painel de administração para gerenciar clientes e módulos
// =============================================

import { Card, CardTitle } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { useAuth } from '@/stores/auth.store';

const adminStats = [
  { label: 'Clientes Ativos', value: '0', icon: <Icons.users className="w-6 h-6" />, color: 'bg-blue-500' },
  { label: 'Módulos Disponíveis', value: '16', icon: <Icons.layers className="w-6 h-6" />, color: 'bg-green-500' },
  { label: 'Assinaturas', value: '0', icon: <Icons.dollarSign className="w-6 h-6" />, color: 'bg-purple-500' },
  { label: 'Tickets Abertos', value: '0', icon: <Icons.messageCircle className="w-6 h-6" />, color: 'bg-orange-500' },
];

export function AdminDashboardPage() {
  const { usuario } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Painel Administrativo</h1>
        <p className="text-gray-500 dark:text-gray-400">Bem-vindo, {usuario?.nome}! Gerencie clientes, módulos e assinaturas.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`${stat.color} p-3 rounded-xl text-white`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardTitle>Gerenciamento</CardTitle>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-trailsystem-500 hover:bg-trailsystem-50 dark:hover:bg-trailsystem-900/20 transition-colors cursor-pointer">
            <Icons.users className="w-8 h-8 text-trailsystem-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Clientes</span>
            <span className="text-xs text-gray-400">Em breve</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-trailsystem-500 hover:bg-trailsystem-50 dark:hover:bg-trailsystem-900/20 transition-colors cursor-pointer">
            <Icons.layers className="w-8 h-8 text-trailsystem-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Módulos</span>
            <span className="text-xs text-gray-400">Em breve</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-trailsystem-500 hover:bg-trailsystem-50 dark:hover:bg-trailsystem-900/20 transition-colors cursor-pointer">
            <Icons.dollarSign className="w-8 h-8 text-trailsystem-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Assinaturas</span>
            <span className="text-xs text-gray-400">Em breve</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-trailsystem-500 hover:bg-trailsystem-50 dark:hover:bg-trailsystem-900/20 transition-colors cursor-pointer">
            <Icons.messageCircle className="w-8 h-8 text-trailsystem-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Suporte</span>
            <span className="text-xs text-gray-400">Em breve</span>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <Icons.alertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Painel em Desenvolvimento</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Este painel administrativo está sendo desenvolvido para gerenciar clientes, módulos contratados, 
              assinaturas e suporte técnico. Em breve você terá acesso completo a todas as funcionalidades.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AdminDashboardPage;
