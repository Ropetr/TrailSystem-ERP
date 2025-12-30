// =============================================
// TRAILSYSTEM ERP - Admin Tickets Page
// Central de suporte e tickets
// =============================================

import { Card, CardTitle } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';

// Tickets simulados
const tickets = [
  {
    id: 'TK-001',
    titulo: 'Erro ao emitir NF-e',
    cliente: 'Planac Distribuidora',
    prioridade: 'alta',
    status: 'aberto',
    criado: '30/12/2024 10:30',
    atualizado: '30/12/2024 14:00',
  },
  {
    id: 'TK-002',
    titulo: 'Dúvida sobre relatório financeiro',
    cliente: 'Empresa Demo',
    prioridade: 'baixa',
    status: 'pendente',
    criado: '29/12/2024 15:00',
    atualizado: '29/12/2024 16:30',
  },
];

const statusColors: Record<string, string> = {
  aberto: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pendente: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  resolvido: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  fechado: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

const prioridadeColors: Record<string, string> = {
  alta: 'text-red-500',
  media: 'text-yellow-500',
  baixa: 'text-green-500',
};

export function TicketsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tickets de Suporte</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie os tickets de suporte dos clientes</p>
        </div>
        <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
          + Novo Ticket
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
            <Icons.alertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Abertos</p>
            <p className="font-bold text-gray-900 dark:text-white">1</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
            <Icons.clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pendentes</p>
            <p className="font-bold text-gray-900 dark:text-white">1</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Icons.check className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Resolvidos (mês)</p>
            <p className="font-bold text-gray-900 dark:text-white">0</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Icons.chart className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tempo médio</p>
            <p className="font-bold text-gray-900 dark:text-white">-</p>
          </div>
        </Card>
      </div>

      {/* Lista de Tickets */}
      <Card>
        <CardTitle>Lista de Tickets</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">ID</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Título</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Cliente</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Prioridade</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Atualizado</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Ações</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 px-4 font-mono text-sm text-gray-600 dark:text-gray-400">{ticket.id}</td>
                  <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{ticket.titulo}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{ticket.cliente}</td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-medium capitalize ${prioridadeColors[ticket.prioridade]}`}>
                      {ticket.prioridade}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status]}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{ticket.atualizado}</td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-red-500 hover:text-red-600 text-sm font-medium">
                      Ver detalhes
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

export default TicketsPage;
