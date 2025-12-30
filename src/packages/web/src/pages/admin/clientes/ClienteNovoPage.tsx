// =============================================
// TRAILSYSTEM ERP - Admin Novo Cliente Page
// Cadastro de novo cliente/tenant
// =============================================

import { Link } from 'react-router-dom';
import { Card, CardTitle } from '@/components/ui/Card';
import { Icons } from '@/components/ui/Icons';

export function ClienteNovoPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/clientes"
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <Icons.arrowLeft className="w-5 h-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Novo Cliente</h1>
          <p className="text-gray-500 dark:text-gray-400">Cadastre um novo cliente/tenant na plataforma</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dados do Cliente */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardTitle>Identificação</CardTitle>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Razão Social *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Nome da empresa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CNPJ *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Opcional"
                />
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle>Contato Principal</CardTitle>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nome do Responsável *
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  E-mail *
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="email@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Telefone
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cargo
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Ex: Diretor, Gerente"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardTitle>Plano</CardTitle>
            <div className="mt-4 space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-red-500">
                <input type="radio" name="plano" value="starter" className="text-red-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Starter</p>
                  <p className="text-sm text-gray-500">R$ 299/mês</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-red-500">
                <input type="radio" name="plano" value="professional" className="text-red-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Professional</p>
                  <p className="text-sm text-gray-500">R$ 799/mês</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-red-500">
                <input type="radio" name="plano" value="enterprise" className="text-red-500" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Enterprise</p>
                  <p className="text-sm text-gray-500">Sob consulta</p>
                </div>
              </label>
            </div>
          </Card>

          <Card>
            <CardTitle>Período Trial</CardTitle>
            <div className="mt-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="text-red-500 rounded" defaultChecked />
                <span className="text-sm text-gray-700 dark:text-gray-300">Iniciar com 14 dias de trial</span>
              </label>
            </div>
          </Card>

          <div className="flex gap-3">
            <Link
              to="/admin/clientes"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-center text-sm font-medium"
            >
              Cancelar
            </Link>
            <button
              type="button"
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
            >
              Criar Cliente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClienteNovoPage;
