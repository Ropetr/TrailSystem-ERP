// =============================================
// TRAILSYSTEM ERP - Dashboard Page
// =============================================

import { Card, CardTitle } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';
import { useAuth } from '@/stores/auth.store';

const stats = [
  { label: 'Empresas', value: '3', icon: <Icons.building className="w-6 h-6" />, color: 'bg-blue-500' },
  { label: 'Usuários', value: '12', icon: <Icons.users className="w-6 h-6" />, color: 'bg-green-500' },
  { label: 'Filiais', value: '5', icon: <Icons.building className="w-6 h-6" />, color: 'bg-purple-500' },
  { label: 'Perfis', value: '4', icon: <Icons.lock className="w-6 h-6" />, color: 'bg-orange-500' },
];

export function DashboardPage() {
  const { usuario } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Bem-vindo, {usuario?.nome}!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`${stat.color} p-3 rounded-xl text-white`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardTitle>Acesso Rápido</CardTitle>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a
            href="/empresas"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-trailsystem-500 hover:bg-trailsystem-50 transition-colors"
          >
            <Icons.building className="w-8 h-8 text-trailsystem-500" />
            <span className="text-sm font-medium text-gray-700">Empresas</span>
          </a>
          <a
            href="/usuarios"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-trailsystem-500 hover:bg-trailsystem-50 transition-colors"
          >
            <Icons.users className="w-8 h-8 text-trailsystem-500" />
            <span className="text-sm font-medium text-gray-700">Usuários</span>
          </a>
          <a
            href="/perfis"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-trailsystem-500 hover:bg-trailsystem-50 transition-colors"
          >
            <Icons.lock className="w-8 h-8 text-trailsystem-500" />
            <span className="text-sm font-medium text-gray-700">Perfis</span>
          </a>
          <a
            href="/configuracoes"
            className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-trailsystem-500 hover:bg-trailsystem-50 transition-colors"
          >
            <Icons.settings className="w-8 h-8 text-trailsystem-500" />
            <span className="text-sm font-medium text-gray-700">Configurações</span>
          </a>
        </div>
      </Card>
    </div>
  );
}

export default DashboardPage;
