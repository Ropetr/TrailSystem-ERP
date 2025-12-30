// =============================================
// TRAILSYSTEM ERP - Admin Módulos Page
// Catálogo de módulos disponíveis
// =============================================

import { Card } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';

// Módulos do ERP
const modulos = [
  { id: 'comercial', nome: 'Comercial', descricao: 'Orçamentos, vendas e gestão comercial', status: 'ativo', clientes: 2 },
  { id: 'estoque', nome: 'Estoque', descricao: 'Controle de estoque e movimentações', status: 'ativo', clientes: 2 },
  { id: 'fiscal', nome: 'Fiscal', descricao: 'NF-e, NFC-e, NFS-e, CT-e, SPED', status: 'ativo', clientes: 2 },
  { id: 'financeiro', nome: 'Financeiro', descricao: 'Contas a pagar/receber, fluxo de caixa', status: 'ativo', clientes: 2 },
  { id: 'compras', nome: 'Compras', descricao: 'Cotações e pedidos de compra', status: 'ativo', clientes: 1 },
  { id: 'logistica', nome: 'Logística', descricao: 'Entregas, rotas e rastreamento', status: 'ativo', clientes: 1 },
  { id: 'crm', nome: 'CRM', descricao: 'Pipeline, leads e oportunidades', status: 'ativo', clientes: 1 },
  { id: 'ecommerce', nome: 'E-commerce', descricao: 'Loja virtual integrada', status: 'beta', clientes: 0 },
  { id: 'contabil', nome: 'Contábil', descricao: 'Lançamentos, DRE, balanço', status: 'ativo', clientes: 1 },
  { id: 'rh', nome: 'RH', descricao: 'Folha, ponto, férias', status: 'beta', clientes: 0 },
  { id: 'patrimonio', nome: 'Patrimônio', descricao: 'Depreciação e manutenção', status: 'beta', clientes: 0 },
  { id: 'bi', nome: 'BI & Relatórios', descricao: 'Dashboards e indicadores', status: 'ativo', clientes: 2 },
];

const statusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  beta: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  inativo: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
};

export function ModulosPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Módulos</h1>
          <p className="text-gray-500 dark:text-gray-400">Catálogo de módulos disponíveis na plataforma</p>
        </div>
        <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
          + Novo Módulo
        </button>
      </div>

      {/* Grid de Módulos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modulos.map((modulo) => (
          <Card key={modulo.id} className="hover:border-red-500 transition-colors cursor-pointer">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <Icons.layers className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">{modulo.nome}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{modulo.descricao}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[modulo.status]}`}>
                {modulo.status}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {modulo.clientes} cliente(s)
              </span>
              <button className="text-red-500 hover:text-red-600 text-sm font-medium">
                Configurar
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default ModulosPage;
