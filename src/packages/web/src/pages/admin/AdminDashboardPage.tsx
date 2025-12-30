// =============================================
// TRAILSYSTEM ERP - Admin Dashboard Page
// Painel de administração da Softwarehouse TrailSystem
// Gerenciamento de clientes/tenants, módulos, billing e suporte
// =============================================

import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { useAuth } from '@/stores/auth.store';

// KPIs do Dashboard Admin (Softwarehouse)
const adminStats = [
  { label: 'Clientes Ativos', value: '0', icon: <Icons.users className="w-6 h-6" />, color: 'bg-blue-500', trend: '+0%' },
  { label: 'MRR', value: 'R$ 0', icon: <Icons.dollarSign className="w-6 h-6" />, color: 'bg-green-500', trend: '+0%' },
  { label: 'Tickets Abertos', value: '0', icon: <Icons.messageCircle className="w-6 h-6" />, color: 'bg-orange-500', trend: '0' },
  { label: 'Uptime', value: '99.9%', icon: <Icons.chart className="w-6 h-6" />, color: 'bg-purple-500', trend: 'OK' },
];

// Ações rápidas do Admin
const quickActions = [
  { label: 'Novo Cliente', path: '/admin/clientes/novo', icon: <Icons.plus className="w-6 h-6" />, color: 'text-blue-500' },
  { label: 'Nova Assinatura', path: '/admin/billing/assinaturas', icon: <Icons.dollarSign className="w-6 h-6" />, color: 'text-green-500' },
  { label: 'Ativar Módulo', path: '/admin/licenciamento/ativacoes', icon: <Icons.layers className="w-6 h-6" />, color: 'text-purple-500' },
  { label: 'Abrir Ticket', path: '/admin/suporte/tickets', icon: <Icons.messageCircle className="w-6 h-6" />, color: 'text-orange-500' },
];

// Alertas simulados
const alerts = [
  { type: 'warning', message: 'Nenhum alerta no momento', time: 'Agora' },
];

export function AdminDashboardPage() {
  const { usuario } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Admin</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Bem-vindo, {usuario?.nome}! Gerencie a plataforma TrailSystem.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/admin/clientes/novo"
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
          >
            + Novo Cliente
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`${stat.color} p-3 rounded-xl text-white`}>
              {stat.icon}
            </div>
            <div className="flex-1">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
            <span className="text-xs text-gray-400">{stat.trend}</span>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardTitle>Ações Rápidas</CardTitle>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <span className={action.color}>{action.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas */}
        <Card>
          <CardTitle>Alertas</CardTitle>
          <div className="mt-4 space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  alert.type === 'warning' 
                    ? 'bg-yellow-50 dark:bg-yellow-900/20' 
                    : alert.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20'
                    : 'bg-blue-50 dark:bg-blue-900/20'
                }`}
              >
                <Icons.alertCircle className={`w-5 h-5 ${
                  alert.type === 'warning' 
                    ? 'text-yellow-500' 
                    : alert.type === 'error'
                    ? 'text-red-500'
                    : 'text-blue-500'
                }`} />
                <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">{alert.message}</span>
                <span className="text-xs text-gray-400">{alert.time}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardTitle>Atividade Recente</CardTitle>
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Icons.check className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">Sistema iniciado</p>
                <p className="text-xs text-gray-400">Painel Admin ativo</p>
              </div>
              <span className="text-xs text-gray-400">Agora</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
            <Icons.alertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Painel Admin - Softwarehouse</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Este é o painel de administração da TrailSystem. Aqui você pode gerenciar clientes (tenants), 
              módulos, assinaturas, billing, suporte e configurações globais do sistema.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AdminDashboardPage;
