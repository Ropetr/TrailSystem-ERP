// =============================================
// PLANAC ERP - Integrações E-commerce
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

interface Integracao {
  id: string;
  plataforma: 'nuvemshop' | 'mercadolivre' | 'shopee' | 'amazon' | 'magalu' | 'b2w';
  nome_loja: string;
  status: 'ativa' | 'inativa' | 'erro' | 'sincronizando';
  ultima_sincronizacao?: string;
  config: {
    client_id?: string;
    access_token?: string;
    store_id?: string;
    seller_id?: string;
  };
  stats: {
    produtos_sincronizados: number;
    pedidos_hoje: number;
    pedidos_mes: number;
    faturamento_mes: number;
  };
  erros_recentes: {
    tipo: string;
    mensagem: string;
    data: string;
  }[];
}

const plataformasConfig = {
  nuvemshop: { 
    nome: 'Nuvemshop', 
    cor: 'bg-blue-500',
    logo: '🛒',
    campos: ['client_id', 'client_secret', 'store_id'],
  },
  mercadolivre: { 
    nome: 'Mercado Livre', 
    cor: 'bg-yellow-500',
    logo: '🤝',
    campos: ['client_id', 'client_secret', 'redirect_uri'],
  },
  shopee: { 
    nome: 'Shopee', 
    cor: 'bg-orange-500',
    logo: '🧡',
    campos: ['partner_id', 'partner_key', 'shop_id'],
  },
  amazon: { 
    nome: 'Amazon', 
    cor: 'bg-orange-600',
    logo: '📦',
    campos: ['seller_id', 'mws_auth_token', 'marketplace_id'],
  },
  magalu: { 
    nome: 'Magazine Luiza', 
    cor: 'bg-blue-600',
    logo: '🏪',
    campos: ['api_key', 'seller_id'],
  },
  b2w: { 
    nome: 'B2W (Americanas)', 
    cor: 'bg-red-500',
    logo: '🔴',
    campos: ['client_id', 'client_secret', 'seller_id'],
  },
};

const statusConfig = {
  ativa: { label: 'Ativa', variant: 'success' as const },
  inativa: { label: 'Inativa', variant: 'default' as const },
  erro: { label: 'Erro', variant: 'danger' as const },
  sincronizando: { label: 'Sincronizando', variant: 'warning' as const },
};

export function IntegracoesPage() {
  const toast = useToast();
  const [integracoes, setIntegracoes] = useState<Integracao[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal nova integração
  const [showNovaModal, setShowNovaModal] = useState(false);
  const [plataformaSelecionada, setPlataformaSelecionada] = useState<keyof typeof plataformasConfig | null>(null);
  const [configForm, setConfigForm] = useState<Record<string, string>>({});
  
  // Modal detalhes
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [integracaoDetalhes, setIntegracaoDetalhes] = useState<Integracao | null>(null);

  useEffect(() => {
    loadIntegracoes();
  }, []);

  const loadIntegracoes = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Integracao[] }>('/ecommerce/integracoes');
      if (response.success) setIntegracoes(response.data);
    } catch (error) {
      toast.error('Erro ao carregar integrações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConectar = async () => {
    if (!plataformaSelecionada) return;
    
    try {
      await api.post('/ecommerce/integracoes', {
        plataforma: plataformaSelecionada,
        config: configForm,
      });
      toast.success('Integração conectada!');
      setShowNovaModal(false);
      setPlataformaSelecionada(null);
      setConfigForm({});
      loadIntegracoes();
    } catch (error) {
      toast.error('Erro ao conectar integração');
    }
  };

  const handleSincronizar = async (integracaoId: string) => {
    try {
      await api.post(`/ecommerce/integracoes/${integracaoId}/sincronizar`);
      toast.success('Sincronização iniciada');
      loadIntegracoes();
    } catch (error) {
      toast.error('Erro ao sincronizar');
    }
  };

  const handleDesconectar = async (integracaoId: string) => {
    if (!confirm('Deseja realmente desconectar esta integração?')) return;
    
    try {
      await api.delete(`/ecommerce/integracoes/${integracaoId}`);
      toast.success('Integração desconectada');
      loadIntegracoes();
    } catch (error) {
      toast.error('Erro ao desconectar');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  // Stats gerais
  const stats = {
    ativas: integracoes.filter(i => i.status === 'ativa').length,
    pedidosHoje: integracoes.reduce((acc, i) => acc + i.stats.pedidos_hoje, 0),
    pedidosMes: integracoes.reduce((acc, i) => acc + i.stats.pedidos_mes, 0),
    faturamentoMes: integracoes.reduce((acc, i) => acc + i.stats.faturamento_mes, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Integrações E-commerce</h1>
          <p className="text-gray-500">Conecte suas lojas e marketplaces</p>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => setShowNovaModal(true)}>
          Nova Integração
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Canais Ativos</p>
          <p className="text-2xl font-bold text-green-600">{stats.ativas}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Pedidos Hoje</p>
          <p className="text-2xl font-bold text-blue-600">{stats.pedidosHoje}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Pedidos no Mês</p>
          <p className="text-2xl font-bold">{stats.pedidosMes}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Faturamento Mês</p>
          <p className="text-2xl font-bold text-planac-600">{formatCurrency(stats.faturamentoMes)}</p>
        </Card>
      </div>

      {/* Cards de Integrações */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integracoes.map((integracao) => {
          const plataforma = plataformasConfig[integracao.plataforma];
          const status = statusConfig[integracao.status];
          
          return (
            <Card key={integracao.id} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 right-0 h-1 ${plataforma.cor}`} />
              
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{plataforma.logo}</span>
                  <div>
                    <h3 className="font-bold">{integracao.nome_loja}</h3>
                    <p className="text-sm text-gray-500">{plataforma.nome}</p>
                  </div>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Produtos</p>
                  <p className="font-bold">{integracao.stats.produtos_sincronizados}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pedidos Hoje</p>
                  <p className="font-bold">{integracao.stats.pedidos_hoje}</p>
                </div>
                <div>
                  <p className="text-gray-500">Pedidos Mês</p>
                  <p className="font-bold">{integracao.stats.pedidos_mes}</p>
                </div>
                <div>
                  <p className="text-gray-500">Faturamento</p>
                  <p className="font-bold text-green-600">{formatCurrency(integracao.stats.faturamento_mes)}</p>
                </div>
              </div>
              
              {integracao.ultima_sincronizacao && (
                <p className="text-xs text-gray-400 mb-4">
                  Última sinc: {formatDateTime(integracao.ultima_sincronizacao)}
                </p>
              )}
              
              {integracao.erros_recentes.length > 0 && (
                <div className="mb-4 p-2 bg-red-50 rounded text-sm text-red-600">
                  ⚠️ {integracao.erros_recentes[0].mensagem}
                </div>
              )}
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setIntegracaoDetalhes(integracao);
                    setShowDetalhesModal(true);
                  }}
                >
                  Detalhes
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleSincronizar(integracao.id)}
                  disabled={integracao.status === 'sincronizando'}
                >
                  {integracao.status === 'sincronizando' ? 'Sincronizando...' : 'Sincronizar'}
                </Button>
              </div>
            </Card>
          );
        })}
        
        {integracoes.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12">
            <Icons.cart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-bold text-gray-700">Nenhuma integração configurada</h3>
            <p className="text-gray-500 mb-4">Conecte sua primeira loja ou marketplace</p>
            <Button onClick={() => setShowNovaModal(true)}>Adicionar Integração</Button>
          </div>
        )}
      </div>

      {/* Modal Nova Integração */}
      <Modal
        isOpen={showNovaModal}
        onClose={() => {
          setShowNovaModal(false);
          setPlataformaSelecionada(null);
          setConfigForm({});
        }}
        title="Nova Integração"
        size="lg"
      >
        {!plataformaSelecionada ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(plataformasConfig).map(([key, config]) => (
              <button
                key={key}
                className="p-4 border rounded-lg hover:border-planac-500 hover:bg-planac-50 transition-colors text-center"
                onClick={() => setPlataformaSelecionada(key as keyof typeof plataformasConfig)}
              >
                <span className="text-4xl block mb-2">{config.logo}</span>
                <p className="font-medium">{config.nome}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <span className="text-3xl">{plataformasConfig[plataformaSelecionada].logo}</span>
              <div>
                <p className="font-bold">{plataformasConfig[plataformaSelecionada].nome}</p>
                <button
                  className="text-sm text-planac-600"
                  onClick={() => setPlataformaSelecionada(null)}
                >
                  Escolher outra plataforma
                </button>
              </div>
            </div>
            
            {plataformasConfig[plataformaSelecionada].campos.map((campo) => (
              <Input
                key={campo}
                label={campo.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                value={configForm[campo] || ''}
                onChange={(e) => setConfigForm({ ...configForm, [campo]: e.target.value })}
                type={campo.includes('secret') || campo.includes('token') ? 'password' : 'text'}
              />
            ))}
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowNovaModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConectar}>
                Conectar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Detalhes */}
      <Modal
        isOpen={showDetalhesModal}
        onClose={() => setShowDetalhesModal(false)}
        title={`Detalhes - ${integracaoDetalhes?.nome_loja}`}
        size="lg"
      >
        {integracaoDetalhes && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Plataforma</p>
                <p className="font-medium">{plataformasConfig[integracaoDetalhes.plataforma].nome}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={statusConfig[integracaoDetalhes.status].variant}>
                  {statusConfig[integracaoDetalhes.status].label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Store ID</p>
                <p className="font-mono text-sm">{integracaoDetalhes.config.store_id || integracaoDetalhes.config.seller_id || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Última Sincronização</p>
                <p className="text-sm">{integracaoDetalhes.ultima_sincronizacao ? formatDateTime(integracaoDetalhes.ultima_sincronizacao) : 'Nunca'}</p>
              </div>
            </div>
            
            {integracaoDetalhes.erros_recentes.length > 0 && (
              <div>
                <p className="font-medium mb-2">Erros Recentes</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {integracaoDetalhes.erros_recentes.map((erro, i) => (
                    <div key={i} className="p-2 bg-red-50 rounded text-sm">
                      <p className="text-red-700">{erro.mensagem}</p>
                      <p className="text-red-400 text-xs">{formatDateTime(erro.data)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="danger" onClick={() => {
                handleDesconectar(integracaoDetalhes.id);
                setShowDetalhesModal(false);
              }}>
                Desconectar
              </Button>
              <Button onClick={() => {
                handleSincronizar(integracaoDetalhes.id);
                setShowDetalhesModal(false);
              }}>
                Sincronizar Agora
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default IntegracoesPage;
