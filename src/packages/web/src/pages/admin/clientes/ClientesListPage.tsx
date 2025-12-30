// =============================================
// TRAILSYSTEM ERP - Admin Clientes List Page
// Lista de clientes/tenants da plataforma
// =============================================

import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';

// Dados simulados de clientes
const mockClientes = [
  { id: '1', nome: 'Planac Distribuidora', cnpj: '12.345.678/0001-90', plano: 'Enterprise', status: 'ativo', mrr: 'R$ 2.500', usuarios: 15 },
  { id: '2', nome: 'Empresa Demo', cnpj: '98.765.432/0001-10', plano: 'Starter', status: 'trial', mrr: 'R$ 0', usuarios: 3 },
];

const statusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  suspenso: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  cancelado: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function ClientesListPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Clientes</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie os clientes/tenants da plataforma</p>
        </div>
        <Link
          to="/admin/clientes/novo"
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium inline-flex items-center gap-2"
        >
          <Icons.plus className="w-4 h-4" />
          Novo Cliente
        </Link>
      </div>

      {/* Filtros */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="Buscar por nome ou CNPJ..."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="trial">Trial</option>
            <option value="suspenso">Suspenso</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
            <option value="">Todos os Planos</option>
            <option value="starter">Starter</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </Card>

      {/* Lista de Clientes */}
      <Card>
        <CardTitle>Lista de Clientes</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">CNPJ</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Plano</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">MRR</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Usuários</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {mockClientes.map((cliente) => (
                <tr key={cliente.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                        <Icons.building className="w-5 h-5 text-gray-500" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">{cliente.nome}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{cliente.cnpj}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{cliente.plano}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[cliente.status]}`}>
                      {cliente.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{cliente.mrr}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{cliente.usuarios}</td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/admin/clientes/${cliente.id}`}
                      className="text-red-500 hover:text-red-600 text-sm font-medium"
                    >
                      Ver detalhes
                    </Link>
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

export default ClientesListPage;
