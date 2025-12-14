// =============================================
// PLANAC ERP - Integração E-commerce
// =============================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface IntegracaoConfig {
  id: string;
  plataforma: 'nuvemshop' | 'shopify' | 'woocommerce' | 'mercadolivre';
  nome_loja: string;
  url_loja: string;
  status: 'conectado' | 'desconectado' | 'erro' | 'sincronizando';
  ultima_sincronizacao?: string;
  config: {
    sincronizar_produtos: boolean;
    sincronizar_estoque: boolean;
    sincronizar_precos: boolean;
    sincronizar_pedidos: boolean;
    atualizar_status_pedido: boolean;
    importar_clientes: boolean;
  };
  estatisticas: {
    produtos_sincronizados: number;
    pedidos_importados: number;
    erros_pendentes: number;
  };
}

interface LogSincronizacao {
  id: string;
  data: string;
  tipo: 'produtos' | 'estoque' | 'pedidos' | 'precos';
  direcao: 'importacao' | 'exportacao';
  status: 'sucesso' | 'parcial' | 'erro';
  itens_processados: number;
  itens_erro: number;
  mensagem?: string;
}

const plataformaConfig = {
  nuvemshop: { label: 'Nuvemshop', icon: '🛒', color: 'bg-blue-500' },
  shopify: { label: 'Shopify', icon: '🛍️', color: 'bg-green-500' },
  woocommerce: { label: 'WooCommerce', icon: '🔌', color: 'bg-purple-500' },
  mercadolivre: { label: 'Mercado Livre', icon: '🤝', color: 'bg-yellow-500' },
};

const statusConfig = {
  conectado: { label: 'Conectado', variant: 'success' as const },
  desconectado: { label: 'Desconectado', variant: 'default' as const },
  erro: { label: 'Erro', variant: 'danger' as const },
  sincronizando: { label: 'Sincronizando...', variant: 'warning' as const },
};

export function IntegracaoPage() {
  const toast = useToast();
  const [integracoes, setIntegracoes] = useState<IntegracaoConfig[]>([]);
  const [logs, setLogs] = useState<LogSincronizacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [integracaoSelecionada, setIntegracaoSelecionada] = useState<IntegracaoConfig | null>(null);
  
  // Modal de conexão
  const [showConectarModal, setShowConectarModal] = useState(false);
  const [conectarForm, setConectarForm] = useState({
    plataforma: 'nuvemshop',
    access_token: '',
    store_id: '',
  });
  
  // Modal de configuração
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [configForm, setConfigForm] = useState({
    sincronizar_produtos: true,
    sincronizar_estoque: true,
    sincronizar_precos: true,
    sincronizar_pedidos: true,
    atualizar_status_pedido: true,
    importar_clientes: true,
  });

  useEffect(() => {
    loadIntegracoes();
    loadLogs();
  }, []);

  const loadIntegracoes = async () => {
    try {
      const response = await api.get<{ success: boolean; data: IntegracaoConfig[] }>('/ecommerce/integracoes');
      if (response.success) {
        setIntegracoes(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar integrações');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await api.get<{ success: boolean; data: LogSincronizacao[] }>('/ecommerce/logs?limit=20');
      if (response.success) {
        setLogs(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar logs');
    }
  };

  const handleConectar = async () => {
    if (!conectarForm.access_token || !conectarForm.store_id) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      await api.post('/ecommerce/conectar', conectarForm);
      toast.success('Loja conectada com sucesso!');
      setShowConectarModal(false);
      setConectarForm({ plataforma: 'nuvemshop', access_token: '', store_id: '' });
      loadIntegracoes();
    } catch (error) {
      toast.error('Erro ao conectar loja');
    }
  };

  const handleDesconectar = async (integracao: IntegracaoConfig) => {
    if (!confirm('Deseja realmente desconectar esta loja?')) return;

    try {
      await api.post(`/ecommerce/integracoes/${integracao.id}/desconectar`);
      toast.success('Loja desconectada');
      loadIntegracoes();
    } catch (error) {
      toast.error('Erro ao desconectar');
    }
  };

  const handleSincronizar = async (integracao: IntegracaoConfig, tipo: string) => {
    try {
      await api.post(`/ecommerce/integracoes/${integracao.id}/sincronizar`, { tipo });
      toast.success(`Sincronização de ${tipo} iniciada`);
      loadIntegracoes();
      loadLogs();
    } catch (error) {
      toast.error('Erro ao iniciar sincronização');
    }
  };

  const handleSalvarConfig = async () => {
    if (!integracaoSelecionada) return;

    try {
      await api.put(`/ecommerce/integracoes/${integracaoSelecionada.id}/config`, configForm);
      toast.success('Configurações salvas');
      setShowConfigModal(false);
      loadIntegracoes();
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrações E-commerce</h1>
          <p className="text-gray-500">Conecte suas lojas virtuais ao ERP</p>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => setShowConectarModal(true)}>
          Conectar Loja
        </Button>
      </div>

      {/* Lojas Conectadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-planac-500" />
          </div>
        ) : integracoes.length === 0 ? (
          <Card className="col-span-full text-center py-12">
            <Icons.settings className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">Nenhuma loja conectada</h3>
            <p className="text-gray-500 mb-4">Conecte sua primeira loja virtual para começar</p>
            <Button onClick={() => setShowConectarModal(true)}>Conectar Loja</Button>
          </Card>
        ) : (
          integracoes.map((integracao) => {
            const plataforma = plataformaConfig[integracao.plataforma];
            const status = statusConfig[integracao.status];
            
            return (
              <Card key={integracao.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-lg ${plataforma.color} flex items-center justify-center text-2xl text-white`}>
                      {plataforma.icon}
                    </div>
                    <div>
                      <p className="font-bold">{integracao.nome_loja}</p>
                      <p className="text-sm text-gray-500">{plataforma.label}</p>
                    </div>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                
                {/* Estatísticas */}
                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-lg font-bold text-planac-600">{integracao.estatisticas.produtos_sincronizados}</p>
                    <p className="text-xs text-gray-500">Produtos</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-lg font-bold text-green-600">{integracao.estatisticas.pedidos_importados}</p>
                    <p className="text-xs text-gray-500">Pedidos</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-lg font-bold text-red-600">{integracao.estatisticas.erros_pendentes}</p>
                    <p className="text-xs text-gray-500">Erros</p>
                  </div>
                </div>
                
                {integracao.ultima_sincronizacao && (
                  <p className="text-xs text-gray-500 mb-4">
                    Última sinc: {formatDate(integracao.ultima_sincronizacao)}
                  </p>
                )}
                
                {/* Ações */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={integracao.status === 'sincronizando'}
                    onClick={() => handleSincronizar(integracao, 'tudo')}
                  >
                    <Icons.refresh className="w-4 h-4 mr-1" />
                    Sincronizar
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setIntegracaoSelecionada(integracao);
                      setConfigForm(integracao.config);
                      setShowConfigModal(true);
                    }}
                  >
                    <Icons.settings className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleDesconectar(integracao)}
                  >
                    <Icons.x className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Logs de Sincronização */}
      {logs.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold mb-4">Histórico de Sincronizações</h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={
                    log.status === 'sucesso' ? 'success' : 
                    log.status === 'parcial' ? 'warning' : 'danger'
                  }>
                    {log.status}
                  </Badge>
                  <div>
                    <p className="text-sm font-medium">
                      {log.tipo.charAt(0).toUpperCase() + log.tipo.slice(1)} - {log.direcao === 'importacao' ? 'Importação' : 'Exportação'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {log.itens_processados} processados{log.itens_erro > 0 && `, ${log.itens_erro} erros`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{formatDate(log.data)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Modal Conectar */}
      <Modal
        isOpen={showConectarModal}
        onClose={() => setShowConectarModal(false)}
        title="Conectar Loja Virtual"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plataforma</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(plataformaConfig).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  className={`p-4 rounded-lg border-2 transition-all ${
                    conectarForm.plataforma === key 
                      ? 'border-planac-500 bg-planac-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setConectarForm({ ...conectarForm, plataforma: key as any })}
                >
                  <span className="text-2xl">{config.icon}</span>
                  <p className="text-sm font-medium mt-1">{config.label}</p>
                </button>
              ))}
            </div>
          </div>
          
          <Input
            label="Store ID / User ID"
            value={conectarForm.store_id}
            onChange={(e) => setConectarForm({ ...conectarForm, store_id: e.target.value })}
            placeholder="ID da loja na plataforma"
          />
          
          <Input
            label="Access Token"
            type="password"
            value={conectarForm.access_token}
            onChange={(e) => setConectarForm({ ...conectarForm, access_token: e.target.value })}
            placeholder="Token de acesso da API"
          />
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>📘 Como obter o Access Token:</strong><br />
              Para Nuvemshop, acesse sua loja &gt; Configurações &gt; Aplicativos &gt; Criar aplicativo privado
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowConectarModal(false)}>Cancelar</Button>
            <Button onClick={handleConectar}>Conectar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Configuração */}
      <Modal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        title={`Configurar ${integracaoSelecionada?.nome_loja}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">Selecione o que deve ser sincronizado:</p>
          
          {[
            { key: 'sincronizar_produtos', label: 'Sincronizar Produtos', desc: 'Exportar produtos do ERP para a loja' },
            { key: 'sincronizar_estoque', label: 'Sincronizar Estoque', desc: 'Manter estoque atualizado em tempo real' },
            { key: 'sincronizar_precos', label: 'Sincronizar Preços', desc: 'Atualizar preços automaticamente' },
            { key: 'sincronizar_pedidos', label: 'Importar Pedidos', desc: 'Trazer pedidos da loja para o ERP' },
            { key: 'atualizar_status_pedido', label: 'Atualizar Status', desc: 'Enviar atualizações de status para a loja' },
            { key: 'importar_clientes', label: 'Importar Clientes', desc: 'Cadastrar clientes da loja no ERP' },
          ].map((item) => (
            <label key={item.key} className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={configForm[item.key as keyof typeof configForm]}
                onChange={(e) => setConfigForm({ ...configForm, [item.key]: e.target.checked })}
                className="mt-1"
              />
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </label>
          ))}
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowConfigModal(false)}>Cancelar</Button>
            <Button onClick={handleSalvarConfig}>Salvar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default IntegracaoPage;
