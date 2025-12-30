// =============================================
// TRAILSYSTEM ERP - Admin Assinaturas Page
// Gestão de assinaturas e billing
// =============================================

import { Card, CardTitle } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';

// Assinaturas simuladas
const assinaturas = [
  {
    id: '1',
    cliente: 'Planac Distribuidora',
    plano: 'Enterprise',
    status: 'ativo',
    valor: 'R$ 2.500',
    vencimento: '15/01/2025',
    renovacao: 'Automática',
  },
  {
    id: '2',
    cliente: 'Empresa Demo',
    plano: 'Starter',
    status: 'trial',
    valor: 'R$ 0',
    vencimento: '15/01/2025',
    renovacao: 'Trial (14 dias)',
  },
];

const statusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  atraso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  suspenso: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function AssinaturasPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assinaturas</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie as assinaturas dos clientes</p>
        </div>
        <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
          + Nova Assinatura
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Icons.dollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">MRR</p>
            <p className="font-bold text-gray-900 dark:text-white">R$ 2.500</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Icons.users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ativos</p>
            <p className="font-bold text-gray-900 dark:text-white">1</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Icons.clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Trial</p>
            <p className="font-bold text-gray-900 dark:text-white">1</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Icons.alertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Inadimplentes</p>
            <p className="font-bold text-gray-900 dark:text-white">0</p>
          </div>
        </Card>
      </div>

      {/* Lista de Assinaturas */}
      <Card>
        <CardTitle>Lista de Assinaturas</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Plano</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Valor</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Vencimento</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Renovação</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {assinaturas.map((assinatura) => (
                <tr key={assinatura.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{assinatura.cliente}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{assinatura.plano}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[assinatura.status]}`}>
                      {assinatura.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{assinatura.valor}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{assinatura.vencimento}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{assinatura.renovacao}</td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-red-500 hover:text-red-600 text-sm font-medium">
                      Gerenciar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default AssinaturasPage;
