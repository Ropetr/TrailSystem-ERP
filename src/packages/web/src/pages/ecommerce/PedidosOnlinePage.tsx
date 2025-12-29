// =============================================
// PLANAC ERP - Pedidos Online
// =============================================

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface PedidoOnline {
  id: string;
  numero_externo: string;
  numero_interno?: string;
  plataforma: 'nuvemshop' | 'shopify' | 'mercadolivre';
  data_criacao: string;
  cliente: {
    nome: string;
    email: string;
    telefone?: string;
    documento?: string;
  };
  endereco_entrega: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  itens: Array<{
    sku: string;
    nome: string;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
  }>;
  subtotal: number;
  desconto: number;
  frete: number;
  total: number;
  forma_pagamento: string;
  status_pagamento: 'pendente' | 'aprovado' | 'recusado' | 'estornado';
  status_pedido: 'novo' | 'processando' | 'separacao' | 'enviado' | 'entregue' | 'cancelado';
  codigo_rastreio?: string;
  observacao?: string;
  sincronizado: boolean;
}

const statusPedidoConfig = {
  novo: { label: 'Novo', variant: 'info' as const },
  processando: { label: 'Processando', variant: 'warning' as const },
  separacao: { label: 'Separação', variant: 'warning' as const },
  enviado: { label: 'Enviado', variant: 'success' as const },
  entregue: { label: 'Entregue', variant: 'success' as const },
  cancelado: { label: 'Cancelado', variant: 'danger' as const },
};

const statusPagamentoConfig = {
  pendente: { label: 'Pendente', variant: 'warning' as const },
  aprovado: { label: 'Aprovado', variant: 'success' as const },
  recusado: { label: 'Recusado', variant: 'danger' as const },
  estornado: { label: 'Estornado', variant: 'default' as const },
};

const plataformaConfig = {
  nuvemshop: { label: 'Nuvemshop', icon: '🛒' },
  shopify: { label: 'Shopify', icon: '🛍️' },
  mercadolivre: { label: 'ML', icon: '🤝' },
};

export function PedidosOnlinePage() {
  const toast = useToast();
  const [pedidos, setPedidos] = useState<PedidoOnline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [plataformaFilter, setPlataformaFilter] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('hoje');
  
  // Modal de detalhes
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [pedidoDetalhes, setPedidoDetalhes] = useState<PedidoOnline | null>(null);
  
  // Modal de rastreio
  const [showRastreioModal, setShowRastreioModal] = useState(false);
  const [rastreioForm, setRastreioForm] = useState({ codigo: '', transportadora: '' });

  useEffect(() => {
    loadPedidos();
  }, [periodoFilter]);

  const loadPedidos = async () => {
    try {
      const response = await api.get<{ success: boolean; data: PedidoOnline[] }>(
        `/ecommerce/pedidos?periodo=${periodoFilter}`
      );
      if (response.success) {
        setPedidos(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAtualizarStatus = async (pedido: PedidoOnline, novoStatus: string) => {
    try {
      await api.put(`/ecommerce/pedidos/${pedido.id}/status`, { status: novoStatus });
      toast.success('Status atualizado');
      loadPedidos();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleEnviarRastreio = async () => {
    if (!pedidoDetalhes || !rastreioForm.codigo) {
      toast.error('Informe o código de rastreio');
      return;
    }

    try {
      await api.post(`/ecommerce/pedidos/${pedidoDetalhes.id}/rastreio`, rastreioForm);
      toast.success('Rastreio enviado para a plataforma');
      setShowRastreioModal(false);
      setRastreioForm({ codigo: '', transportadora: '' });
      loadPedidos();
    } catch (error) {
      toast.error('Erro ao enviar rastreio');
    }
  };

  const handleImportarPedido = async (pedido: PedidoOnline) => {
    try {
      await api.post(`/ecommerce/pedidos/${pedido.id}/importar`);
      toast.success('Pedido importado para o ERP');
      loadPedidos();
    } catch (error) {
      toast.error('Erro ao importar pedido');
    }
  };

  const handleSincronizar = async () => {
    try {
      await api.post('/ecommerce/pedidos/sincronizar');
      toast.success('Sincronização iniciada');
      loadPedidos();
    } catch (error) {
      toast.error('Erro ao sincronizar');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => new Date(date).toLocaleString('pt-BR');

  const filteredPedidos = pedidos.filter((pedido) => {
    const matchSearch =
      pedido.numero_externo?.includes(search) ||
      pedido.numero_interno?.includes(search) ||
      pedido.cliente.nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || pedido.status_pedido === statusFilter;
    const matchPlataforma = !plataformaFilter || pedido.plataforma === plataformaFilter;
    return matchSearch && matchStatus && matchPlataforma;
  });

  // Stats
  const stats = {
    novos: pedidos.filter(p => p.status_pedido === 'novo').length,
    processando: pedidos.filter(p => ['processando', 'separacao'].includes(p.status_pedido)).length,
    enviados: pedidos.filter(p => p.status_pedido === 'enviado').length,
    totalDia: pedidos.reduce((acc, p) => acc + p.total, 0),
  };

  const columns = [
    {
      key: 'pedido',
      header: 'Pedido',
      render: (p: PedidoOnline) => (
        <div>
          <div className="flex items-center gap-2">
            <span>{plataformaConfig[p.plataforma].icon}</span>
            <span className="font-bold">#{p.numero_externo}</span>
          </div>
          {p.numero_interno && (
            <p className="text-xs text-gray-500">ERP: {p.numero_interno}</p>
          )}
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (p: PedidoOnline) => (
        <div>
          <p className="font-medium">{p.cliente.nome}</p>
          <p className="text-sm text-gray-500">{p.cliente.email}</p>
        </div>
      ),
    },
    {
      key: 'itens',
      header: 'Itens',
      width: '80px',
      render: (p: PedidoOnline) => (
        <span className="text-sm">{p.itens.length} item(ns)</span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      width: '120px',
      render: (p: PedidoOnline) => (
        <span className="font-bold text-planac-600">{formatCurrency(p.total)}</span>
      ),
    },
    {
      key: 'pagamento',
      header: 'Pagamento',
      width: '100px',
      render: (p: PedidoOnline) => {
        const config = statusPagamentoConfig[p.status_pagamento];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (p: PedidoOnline) => {
        const config = statusPedidoConfig[p.status_pedido];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'data',
      header: 'Data',
      width: '100px',
      render: (p: PedidoOnline) => (
        <span className="text-sm text-gray-500">
          {new Date(p.data_criacao).toLocaleDateString('pt-BR')}
        </span>
      ),
    },
  ];

  const actions = (pedido: PedidoOnline) => {
    const items = [
      {
        label: 'Ver Detalhes',
        icon: <Icons.eye className="w-4 h-4" />,
        onClick: () => {
          setPedidoDetalhes(pedido);
          setShowDetalhesModal(true);
        },
      },
    ];

    if (!pedido.sincronizado) {
      items.push({
        label: 'Importar para ERP',
        icon: <Icons.download className="w-4 h-4" />,
        onClick: () => handleImportarPedido(pedido),
      });
    }

    if (pedido.status_pedido === 'separacao') {
      items.push({
        label: 'Informar Rastreio',
        icon: <Icons.document className="w-4 h-4" />,
        onClick: () => {
          setPedidoDetalhes(pedido);
          setShowRastreioModal(true);
        },
      });
    }

    if (!['enviado', 'entregue', 'cancelado'].includes(pedido.status_pedido)) {
      items.push({
        label: 'Cancelar',
        icon: <Icons.x className="w-4 h-4" />,
        variant: 'danger' as const,
        onClick: () => handleAtualizarStatus(pedido, 'cancelado'),
      });
    }

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos Online</h1>
          <p className="text-gray-500">Gerencie pedidos das lojas virtuais</p>
        </div>
        <Button leftIcon={<Icons.refresh className="w-5 h-5" />} onClick={handleSincronizar}>
          Sincronizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Novos</p>
          <p className="text-2xl font-bold text-blue-600">{stats.novos}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Processando</p>
          <p className="text-2xl font-bold text-orange-600">{stats.processando}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Enviados</p>
          <p className="text-2xl font-bold text-green-600">{stats.enviados}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Faturamento</p>
          <p className="text-2xl font-bold text-planac-600">{formatCurrency(stats.totalDia)}</p>
        </Card>
      </div>

      {/* Filtros */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por número ou cliente..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={periodoFilter}
            onChange={setPeriodoFilter}
            options={[
              { value: 'hoje', label: 'Hoje' },
              { value: '7dias', label: 'Últimos 7 dias' },
              { value: '30dias', label: 'Últimos 30 dias' },
              { value: 'todos', label: 'Todos' },
            ]}
          />
          <Select
            value={plataformaFilter}
            onChange={setPlataformaFilter}
            options={[
              { value: '', label: 'Todas Plataformas' },
              ...Object.entries(plataformaConfig).map(([k, v]) => ({ value: k, label: v.label })),
            ]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'Todos Status' },
              ...Object.entries(statusPedidoConfig).map(([k, v]) => ({ value: k, label: v.label })),
            ]}
          />
        </div>
      </Card>

      {/* Tabela */}
      <Card padding="none">
        <DataTable
          data={filteredPedidos}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum pedido encontrado"
        />
      </Card>

      {/* Modal Detalhes */}
      <Modal
        isOpen={showDetalhesModal}
        onClose={() => setShowDetalhesModal(false)}
        title={`Pedido #${pedidoDetalhes?.numero_externo}`}
        size="lg"
      >
        {pedidoDetalhes && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium">{pedidoDetalhes.cliente.nome}</p>
                <p className="text-sm text-gray-500">{pedidoDetalhes.cliente.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Endereço de Entrega</p>
                <p className="text-sm">
                  {pedidoDetalhes.endereco_entrega.logradouro}, {pedidoDetalhes.endereco_entrega.numero}
                  <br />
                  {pedidoDetalhes.endereco_entrega.bairro} - {pedidoDetalhes.endereco_entrega.cidade}/{pedidoDetalhes.endereco_entrega.uf}
                  <br />
                  CEP: {pedidoDetalhes.endereco_entrega.cep}
                </p>
              </div>
            </div>
            
            {/* Itens */}
            <div>
              <p className="font-medium mb-2">Itens do Pedido</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">SKU</th>
                      <th className="text-left p-2">Produto</th>
                      <th className="text-center p-2">Qtd</th>
                      <th className="text-right p-2">Unit.</th>
                      <th className="text-right p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pedidoDetalhes.itens.map((item, i) => (
                      <tr key={i}>
                        <td className="p-2 font-mono text-xs">{item.sku}</td>
                        <td className="p-2">{item.nome}</td>
                        <td className="p-2 text-center">{item.quantidade}</td>
                        <td className="p-2 text-right">{formatCurrency(item.valor_unitario)}</td>
                        <td className="p-2 text-right font-medium">{formatCurrency(item.valor_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Totais */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(pedidoDetalhes.subtotal)}</span>
              </div>
              {pedidoDetalhes.desconto > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Desconto</span>
                  <span>-{formatCurrency(pedidoDetalhes.desconto)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Frete</span>
                <span>{formatCurrency(pedidoDetalhes.frete)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                <span>Total</span>
                <span className="text-planac-600">{formatCurrency(pedidoDetalhes.total)}</span>
              </div>
            </div>
            
            {pedidoDetalhes.codigo_rastreio && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📦 Código de Rastreio:</strong> {pedidoDetalhes.codigo_rastreio}
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Rastreio */}
      <Modal
        isOpen={showRastreioModal}
        onClose={() => setShowRastreioModal(false)}
        title="Informar Código de Rastreio"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Código de Rastreio *"
            value={rastreioForm.codigo}
            onChange={(e) => setRastreioForm({ ...rastreioForm, codigo: e.target.value })}
            placeholder="Ex: BR123456789BR"
          />
          <Select
            label="Transportadora"
            value={rastreioForm.transportadora}
            onChange={(v) => setRastreioForm({ ...rastreioForm, transportadora: v })}
            options={[
              { value: '', label: 'Selecione...' },
              { value: 'correios', label: 'Correios' },
              { value: 'jadlog', label: 'Jadlog' },
              { value: 'azul', label: 'Azul Cargo' },
              { value: 'propria', label: 'Entrega Própria' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowRastreioModal(false)}>Cancelar</Button>
            <Button onClick={handleEnviarRastreio}>Enviar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default PedidosOnlinePage;
