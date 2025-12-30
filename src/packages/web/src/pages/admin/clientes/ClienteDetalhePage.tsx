// =============================================
// TRAILSYSTEM ERP - Admin Cliente Detalhe Page
// Dossiê completo do cliente/tenant
// =============================================

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardTitle } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';

// Tabs do dossiê do cliente
const tabs = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'assinatura', label: 'Assinatura & Cobrança' },
  { id: 'modulos', label: 'Módulos & Limites' },
  { id: 'usuarios', label: 'Usuários & Acessos' },
  { id: 'parametrizacoes', label: 'Parametrizações' },
  { id: 'integracoes', label: 'Integrações' },
  { id: 'logs', label: 'Logs & Auditoria' },
  { id: 'suporte', label: 'Suporte' },
  { id: 'timeline', label: 'Timeline' },
];

// Dados simulados do cliente
const mockCliente = {
  id: '1',
  nome: 'Planac Distribuidora',
  cnpj: '12.345.678/0001-90',
  ie: '123.456.789.000',
  plano: 'Enterprise',
  status: 'ativo',
  mrr: 'R$ 2.500',
  usuarios: 15,
  ultimoLogin: '2024-12-30 14:30',
  ambiente: 'Produção',
  versao: '2.1.0',
  contato: {
    nome: 'Rodrigo Silva',
    email: 'rodrigo@planac.com.br',
    telefone: '(11) 99999-9999',
  },
};

export function ClienteDetalhePage() {
  useParams(); // Used for route params
  const [activeTab, setActiveTab] = useState('resumo');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/clientes"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Icons.arrowLeft className="w-5 h-5 text-gray-500" />
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Icons.building className="w-6 h-6 text-gray-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{mockCliente.nome}</h1>
              <p className="text-gray-500 dark:text-gray-400">{mockCliente.cnpj}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium">
            Impersonar
          </button>
          <button className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium">
            Editar
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Icons.check className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <p className="font-medium text-gray-900 dark:text-white capitalize">{mockCliente.status}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Icons.layers className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Plano</p>
            <p className="font-medium text-gray-900 dark:text-white">{mockCliente.plano}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Icons.dollarSign className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">MRR</p>
            <p className="font-medium text-gray-900 dark:text-white">{mockCliente.mrr}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <Icons.users className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Usuários</p>
            <p className="font-medium text-gray-900 dark:text-white">{mockCliente.usuarios}</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-500'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'resumo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardTitle>Informações do Cliente</CardTitle>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Razão Social</span>
                <span className="text-gray-900 dark:text-white">{mockCliente.nome}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">CNPJ</span>
                <span className="text-gray-900 dark:text-white">{mockCliente.cnpj}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">IE</span>
                <span className="text-gray-900 dark:text-white">{mockCliente.ie}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Ambiente</span>
                <span className="text-gray-900 dark:text-white">{mockCliente.ambiente}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500 dark:text-gray-400">Versão</span>
                <span className="text-gray-900 dark:text-white">{mockCliente.versao}</span>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>Contato Principal</CardTitle>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Nome</span>
                <span className="text-gray-900 dark:text-white">{mockCliente.contato.nome}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">E-mail</span>
                <span className="text-gray-900 dark:text-white">{mockCliente.contato.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Telefone</span>
                <span className="text-gray-900 dark:text-white">{mockCliente.contato.telefone}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500 dark:text-gray-400">Último Login</span>
                <span className="text-gray-900 dark:text-white">{mockCliente.ultimoLogin}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab !== 'resumo' && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/40 rounded-lg">
              <Icons.alertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Em Desenvolvimento</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                A aba "{tabs.find(t => t.id === activeTab)?.label}" está sendo desenvolvida e estará disponível em breve.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default ClienteDetalhePage;
