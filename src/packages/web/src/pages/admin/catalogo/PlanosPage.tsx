// =============================================
// TRAILSYSTEM ERP - Admin Planos Page
// Catálogo de planos comerciais
// =============================================

import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';

// Planos disponíveis
const planos = [
  {
    id: 'starter',
    nome: 'Starter',
    preco: 'R$ 299',
    periodo: '/mês',
    descricao: 'Ideal para pequenas empresas',
    recursos: ['5 usuários', '1 empresa', '500 NF-e/mês', 'Módulos básicos', 'Suporte por e-mail'],
    clientes: 0,
    cor: 'blue',
  },
  {
    id: 'professional',
    nome: 'Professional',
    preco: 'R$ 799',
    periodo: '/mês',
    descricao: 'Para empresas em crescimento',
    recursos: ['15 usuários', '3 empresas', '2.000 NF-e/mês', 'Todos os módulos', 'Suporte prioritário'],
    clientes: 1,
    cor: 'purple',
    popular: true,
  },
  {
    id: 'enterprise',
    nome: 'Enterprise',
    preco: 'Sob consulta',
    periodo: '',
    descricao: 'Solução completa e personalizada',
    recursos: ['Usuários ilimitados', 'Empresas ilimitadas', 'NF-e ilimitadas', 'Customizações', 'Suporte dedicado'],
    clientes: 1,
    cor: 'red',
  },
];

export function PlanosPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planos</h1>
          <p className="text-gray-500 dark:text-gray-400">Gerencie os planos comerciais da plataforma</p>
        </div>
        <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
          + Novo Plano
        </button>
      </div>

      {/* Grid de Planos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planos.map((plano) => (
          <Card
            key={plano.id}
            className={`relative ${plano.popular ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
          >
            {plano.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                  Mais Popular
                </span>
              </div>
            )}
            <div className="text-center pt-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plano.nome}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{plano.descricao}</p>
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{plano.preco}</span>
                <span className="text-gray-500 dark:text-gray-400">{plano.periodo}</span>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {plano.recursos.map((recurso, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Icons.check className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{recurso}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {plano.clientes} cliente(s)
                </span>
                <button className="text-red-500 hover:text-red-600 text-sm font-medium">
                  Editar
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default PlanosPage;
