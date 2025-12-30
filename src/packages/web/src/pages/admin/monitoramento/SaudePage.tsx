// =============================================
// TRAILSYSTEM ERP - Admin Saúde do Sistema Page
// Monitoramento e health check
// =============================================

import { Card, CardTitle } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';

// Status dos serviços
const servicos = [
  { nome: 'API Principal', status: 'online', latencia: '45ms', uptime: '99.9%' },
  { nome: 'Banco de Dados', status: 'online', latencia: '12ms', uptime: '99.9%' },
  { nome: 'Serviço de NF-e', status: 'online', latencia: '120ms', uptime: '99.5%' },
  { nome: 'Serviço de E-mail', status: 'online', latencia: '200ms', uptime: '99.8%' },
  { nome: 'CDN/Storage', status: 'online', latencia: '30ms', uptime: '99.9%' },
];

const statusColors: Record<string, string> = {
  online: 'bg-green-500',
  degraded: 'bg-yellow-500',
  offline: 'bg-red-500',
};

export function SaudePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Saúde do Sistema</h1>
        <p className="text-gray-500 dark:text-gray-400">Monitoramento em tempo real dos serviços</p>
      </div>

      {/* Status Geral */}
      <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-full">
            <Icons.check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-green-900 dark:text-green-100">Todos os sistemas operacionais</h2>
            <p className="text-green-700 dark:text-green-300">Uptime geral: 99.9% nos últimos 30 dias</p>
          </div>
        </div>
      </Card>

      {/* Lista de Serviços */}
      <Card>
        <CardTitle>Status dos Serviços</CardTitle>
        <div className="mt-4 space-y-3">
          {servicos.map((servico) => (
            <div
              key={servico.nome}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${statusColors[servico.status]}`} />
                <span className="font-medium text-gray-900 dark:text-white">{servico.nome}</span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Latência: </span>
                  <span className="text-gray-900 dark:text-white">{servico.latencia}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Uptime: </span>
                  <span className="text-gray-900 dark:text-white">{servico.uptime}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                  servico.status === 'online' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : servico.status === 'degraded'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {servico.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">99.9%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Uptime (30 dias)</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">45ms</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Latência média</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Incidentes (30 dias)</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default SaudePage;
