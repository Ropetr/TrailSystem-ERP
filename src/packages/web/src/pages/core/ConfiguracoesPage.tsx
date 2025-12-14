// =============================================
// PLANAC ERP - Configurações Page
// =============================================

import React, { useState } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';

const tabs = [
  { id: 'sistema', label: 'Sistema', icon: <Icons.settings className="w-4 h-4" /> },
  { id: 'comercial', label: 'Comercial', icon: <Icons.document className="w-4 h-4" /> },
  { id: 'fiscal', label: 'Fiscal', icon: <Icons.document className="w-4 h-4" /> },
];

export function ConfiguracoesPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('sistema');
  const [isLoading, setIsLoading] = useState(false);

  // Configurações do Sistema
  const [sistemaConfig, setSistemaConfig] = useState({
    fuso_horario: 'America/Sao_Paulo',
    formato_data: 'DD/MM/YYYY',
    moeda: 'BRL',
    casas_decimais: '2',
    tema_padrao: 'light',
    backup_automatico: true,
    logs_auditoria: true,
  });

  // Configurações Comerciais
  const [comercialConfig, setComercialConfig] = useState({
    validade_orcamento: '15',
    permitir_mesclar: true,
    pedido_minimo_b2c: '0',
    pedido_minimo_b2b: '500',
    desconto_max_vendedor: '10',
    desconto_max_gerente: '20',
    reserva_estoque: true,
    venda_sem_estoque: false,
    venda_abaixo_custo: false,
  });

  // Configurações Fiscais
  const [fiscalConfig, setFiscalConfig] = useState({
    serie_nfe: '1',
    serie_nfce: '1',
    ambiente: '2',
    certificado_validade: '2025-12-31',
    ibpt_ativo: true,
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Configurações salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500">Configure os parâmetros do sistema</p>
      </div>

      <Card>
        {/* Abas */}
        <div className="flex border-b border-gray-200 mb-6 -mx-6 -mt-6 px-6 pt-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors
                border-b-2 -mb-px
                ${activeTab === tab.id
                  ? 'border-planac-500 text-planac-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Aba: Sistema */}
        {activeTab === 'sistema' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Fuso Horário"
                value={sistemaConfig.fuso_horario}
                onChange={(v) => setSistemaConfig({ ...sistemaConfig, fuso_horario: v })}
                options={[
                  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
                  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
                ]}
              />
              <Select
                label="Formato de Data"
                value={sistemaConfig.formato_data}
                onChange={(v) => setSistemaConfig({ ...sistemaConfig, formato_data: v })}
                options={[
                  { value: 'DD/MM/YYYY', label: 'DD/MM/AAAA' },
                  { value: 'YYYY-MM-DD', label: 'AAAA-MM-DD' },
                ]}
              />
              <Select
                label="Casas Decimais"
                value={sistemaConfig.casas_decimais}
                onChange={(v) => setSistemaConfig({ ...sistemaConfig, casas_decimais: v })}
                options={[
                  { value: '2', label: '2 casas' },
                  { value: '3', label: '3 casas' },
                  { value: '4', label: '4 casas' },
                ]}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={sistemaConfig.backup_automatico}
                  onChange={(e) => setSistemaConfig({ ...sistemaConfig, backup_automatico: e.target.checked })}
                  className="w-4 h-4 text-planac-500 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 block">Backup Automático</span>
                  <span className="text-xs text-gray-500">Realizar backup diário dos dados</span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={sistemaConfig.logs_auditoria}
                  onChange={(e) => setSistemaConfig({ ...sistemaConfig, logs_auditoria: e.target.checked })}
                  className="w-4 h-4 text-planac-500 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700 block">Logs de Auditoria</span>
                  <span className="text-xs text-gray-500">Registrar todas as alterações no sistema</span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Aba: Comercial */}
        {activeTab === 'comercial' && (
          <div className="space-y-6">
            <CardTitle>Orçamentos</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Validade Padrão (dias)"
                type="number"
                value={comercialConfig.validade_orcamento}
                onChange={(e) => setComercialConfig({ ...comercialConfig, validade_orcamento: e.target.value })}
              />
              <label className="flex items-center gap-3 pt-7">
                <input
                  type="checkbox"
                  checked={comercialConfig.permitir_mesclar}
                  onChange={(e) => setComercialConfig({ ...comercialConfig, permitir_mesclar: e.target.checked })}
                  className="w-4 h-4 text-planac-500 rounded"
                />
                <span className="text-sm text-gray-700">Permitir Mesclar Orçamentos</span>
              </label>
            </div>

            <CardTitle>Vendas</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Pedido Mínimo B2C (R$)"
                type="number"
                value={comercialConfig.pedido_minimo_b2c}
                onChange={(e) => setComercialConfig({ ...comercialConfig, pedido_minimo_b2c: e.target.value })}
              />
              <Input
                label="Pedido Mínimo B2B (R$)"
                type="number"
                value={comercialConfig.pedido_minimo_b2b}
                onChange={(e) => setComercialConfig({ ...comercialConfig, pedido_minimo_b2b: e.target.value })}
              />
              <Input
                label="Desconto Máx. Vendedor (%)"
                type="number"
                value={comercialConfig.desconto_max_vendedor}
                onChange={(e) => setComercialConfig({ ...comercialConfig, desconto_max_vendedor: e.target.value })}
              />
              <Input
                label="Desconto Máx. Gerente (%)"
                type="number"
                value={comercialConfig.desconto_max_gerente}
                onChange={(e) => setComercialConfig({ ...comercialConfig, desconto_max_gerente: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={comercialConfig.reserva_estoque}
                  onChange={(e) => setComercialConfig({ ...comercialConfig, reserva_estoque: e.target.checked })}
                  className="w-4 h-4 text-planac-500 rounded"
                />
                <span className="text-sm text-gray-700">Reservar Estoque ao Criar Pedido</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={comercialConfig.venda_sem_estoque}
                  onChange={(e) => setComercialConfig({ ...comercialConfig, venda_sem_estoque: e.target.checked })}
                  className="w-4 h-4 text-planac-500 rounded"
                />
                <span className="text-sm text-gray-700">Permitir Venda Sem Estoque</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={comercialConfig.venda_abaixo_custo}
                  onChange={(e) => setComercialConfig({ ...comercialConfig, venda_abaixo_custo: e.target.checked })}
                  className="w-4 h-4 text-planac-500 rounded"
                />
                <span className="text-sm text-gray-700 text-red-600">Permitir Venda Abaixo do Custo</span>
              </label>
            </div>
          </div>
        )}

        {/* Aba: Fiscal */}
        {activeTab === 'fiscal' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Série NF-e"
                type="number"
                value={fiscalConfig.serie_nfe}
                onChange={(e) => setFiscalConfig({ ...fiscalConfig, serie_nfe: e.target.value })}
              />
              <Input
                label="Série NFC-e"
                type="number"
                value={fiscalConfig.serie_nfce}
                onChange={(e) => setFiscalConfig({ ...fiscalConfig, serie_nfce: e.target.value })}
              />
              <Select
                label="Ambiente"
                value={fiscalConfig.ambiente}
                onChange={(v) => setFiscalConfig({ ...fiscalConfig, ambiente: v })}
                options={[
                  { value: '1', label: 'Produção' },
                  { value: '2', label: 'Homologação' },
                ]}
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-center gap-3">
                <Icons.document className="w-6 h-6 text-blue-500" />
                <div>
                  <p className="font-medium text-blue-800">Certificado Digital</p>
                  <p className="text-sm text-blue-600">
                    Válido até: {fiscalConfig.certificado_validade}
                  </p>
                </div>
                <Button variant="secondary" size="sm" className="ml-auto">
                  Atualizar Certificado
                </Button>
              </div>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={fiscalConfig.ibpt_ativo}
                onChange={(e) => setFiscalConfig({ ...fiscalConfig, ibpt_ativo: e.target.checked })}
                className="w-4 h-4 text-planac-500 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 block">IBPT (Lei do Imposto na Nota)</span>
                <span className="text-xs text-gray-500">Exibir carga tributária aproximada nos documentos</span>
              </div>
            </label>
          </div>
        )}

        {/* Botões */}
        <div className="flex justify-end pt-6 mt-6 border-t border-gray-100">
          <Button
            onClick={handleSave}
            isLoading={isLoading}
            leftIcon={<Icons.check className="w-4 h-4" />}
          >
            Salvar Configurações
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default ConfiguracoesPage;
