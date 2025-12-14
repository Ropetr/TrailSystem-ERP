// =============================================
// PLANAC ERP - Pedidos de Compra
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

interface ItemPedido {
  id: string;
  produto_id: string;
  produto_nome: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
}

interface PedidoCompra {
  id: string;
  numero: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  fornecedor_cnpj: string;
  data_pedido: string;
  data_previsao_entrega?: string;
  data_entrega?: string;
  status: 'rascunho' | 'enviado' | 'confirmado' | 'em_transito' | 'entregue_parcial' | 'entregue' | 'cancelado';
  valor_total: number;
  itens: ItemPedido[];
  condicao_pagamento?: string;
  observacao?: string;
}

const statusConfig = {
  rascunho: { label: 'Rascunho', variant: 'default' as const },
  enviado: { label: 'Enviado', variant: 'info' as const },
  confirmado: { label: 'Confirmado', variant: 'info' as const },
  em_transito: { label: 'Em Trânsito', variant: 'warning' as const },
  entregue_parcial: { label: 'Entrega Parcial', variant: 'warning' as const },
  entregue: { label: 'Entregue', variant: 'success' as const },
  cancelado: { label: 'Cancelado', variant: 'danger' as const },
};

export function PedidosCompraPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [pedidos, setPedidos] = useState<PedidoCompra[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  
  // Modal de detalhes
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [pedidoDetalhes, setPedidoDetalhes] = useState<PedidoCompra | null>(null);

  useEffect(() => {
    loadPedidos();
  }, []);

  const loadPedidos = async () => {
    try {
      const response = await api.get<{ success: boolean; data: PedidoCompra[] }>('/compras/pedidos');
      if (response.success) {
        setPedidos(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnviarPedido = async (pedido: PedidoCompra) => {
    try {
      await api.post(`/compras/pedidos/${pedido.id}/enviar`);
      toast.success('Pedido enviado ao fornecedor');
      loadPedidos();
    } catch (error) {
      toast.error('Erro ao enviar pedido');
    }
  };

  const handleCancelar = async (pedido: PedidoCompra) => {
    if (!confirm('Deseja realmente cancelar este pedido?')) return;

    try {
      await api.post(`/compras/pedidos/${pedido.id}/cancelar`);
      toast.success('Pedido cancelado');
      loadPedidos();
    } catch (error) {
      toast.error('Erro ao cancelar pedido');
    }
  };

  const handleDuplicar = async (pedido: PedidoCompra) => {
    try {
      const response = await api.post<{ success: boolean; data: PedidoCompra }>(`/compras/pedidos/${pedido.id}/duplicar`);
      if (response.success) {
        toast.success('Pedido duplicado');
        navigate(`/compras/pedidos/${response.data.id}`);
      }
    } catch (error) {
      toast.error('Erro ao duplicar pedido');
    }
  };

  const filteredPedidos = pedidos.filter((pedido) => {
    const matchSearch =
      pedido.numero?.includes(search) ||
      pedido.fornecedor_nome?.toLowerCase().includes(search.toLowerCase()) ||
      pedido.fornecedor_cnpj?.includes(search);

    const matchStatus = !statusFilter || pedido.status === statusFilter;

    const dataPedido = new Date(pedido.data_pedido);
    const matchPeriodoInicio = !periodoInicio || dataPedido >= new Date(periodoInicio);
    const matchPeriodoFim = !periodoFim || dataPedido <= new Date(periodoFim + 'T23:59:59');

    return matchSearch && matchStatus && matchPeriodoInicio && matchPeriodoFim;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Estatísticas
  const stats = {
    total: filteredPedidos.length,
    emAndamento: filteredPedidos.filter(p => ['enviado', 'confirmado', 'em_transito'].includes(p.status)).length,
    valorPendente: filteredPedidos
      .filter(p => ['enviado', 'confirmado', 'em_transito'].includes(p.status))
      .reduce((acc, p) => acc + p.valor_total, 0),
    entreguesMes: filteredPedidos.filter(p => {
      if (p.status !== 'entregue' || !p.data_entrega) return false;
      const data = new Date(p.data_entrega);
      const hoje = new Date();
      return data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
    }).length,
  };

  const columns = [
    {
      key: 'numero',
      header: 'Número',
      width: '100px',
      render: (pedido: PedidoCompra) => (
        <span className="font-mono font-bold">{pedido.numero}</span>
      ),
    },
    {
      key: 'fornecedor',
      header: 'Fornecedor',
      render: (pedido: PedidoCompra) => (
        <div>
          <p className="font-medium text-gray-900">{pedido.fornecedor_nome}</p>
          <p className="text-sm text-gray-500">{pedido.fornecedor_cnpj}</p>
        </div>
      ),
    },
    {
      key: 'data',
      header: 'Data',
      width: '100px',
      sortable: true,
      render: (pedido: PedidoCompra) => formatDate(pedido.data_pedido),
    },
    {
      key: 'previsao',
      header: 'Previsão',
      width: '100px',
      render: (pedido: PedidoCompra) => pedido.data_previsao_entrega ? formatDate(pedido.data_previsao_entrega) : '-',
    },
    {
      key: 'itens',
      header: 'Itens',
      width: '60px',
      render: (pedido: PedidoCompra) => (
        <span className="text-center">{pedido.itens?.length || 0}</span>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      width: '120px',
      sortable: true,
      render: (pedido: PedidoCompra) => (
        <span className="font-bold">{formatCurrency(pedido.valor_total)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (pedido: PedidoCompra) => {
        const config = statusConfig[pedido.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (pedido: PedidoCompra) => {
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

    if (pedido.status === 'rascunho') {
      items.push(
        {
          label: 'Editar',
          icon: <Icons.edit className="w-4 h-4" />,
          onClick: () => navigate(`/compras/pedidos/${pedido.id}`),
        },
        {
          label: 'Enviar ao Fornecedor',
          icon: <Icons.email className="w-4 h-4" />,
          variant: 'success' as const,
          onClick: () => handleEnviarPedido(pedido),
        }
      );
    }

    if (['confirmado', 'em_transito'].includes(pedido.status)) {
      items.push({
        label: 'Registrar Recebimento',
        icon: <Icons.check className="w-4 h-4" />,
        onClick: () => navigate(`/compras/pedidos/${pedido.id}/recebimento`),
      });
    }

    items.push({
      label: 'Duplicar',
      icon: <Icons.document className="w-4 h-4" />,
      onClick: () => handleDuplicar(pedido),
    });

    if (['rascunho', 'enviado'].includes(pedido.status)) {
      items.push({
        label: 'Cancelar',
        icon: <Icons.x className="w-4 h-4" />,
        variant: 'danger' as const,
        onClick: () => handleCancelar(pedido),
      });
    }

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos de Compra</h1>
          <p className="text-gray-500">Gerencie suas compras com fornecedores</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={() => navigate('/compras/pedidos/novo')}
        >
          Novo Pedido
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.document className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-500">Total Pedidos</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Icons.eye className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{stats.emAndamento}</p>
              <p className="text-sm text-gray-500">Em Andamento</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-planac-100 rounded-lg">
              <Icons.document className="w-5 h-5 text-planac-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-planac-600">{formatCurrency(stats.valorPendente)}</p>
              <p className="text-sm text-gray-500">Valor Pendente</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.entreguesMes}</p>
              <p className="text-sm text-gray-500">Entregues no Mês</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por número, fornecedor..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'Todos Status' },
                ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label })),
              ]}
            />
          </div>
          <div className="w-36">
            <Input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
          </div>
          <div className="w-36">
            <Input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredPedidos}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum pedido de compra encontrado"
        />
      </Card>

      {/* Modal Detalhes */}
      <Modal
        isOpen={showDetalhesModal}
        onClose={() => setShowDetalhesModal(false)}
        title={`Pedido ${pedidoDetalhes?.numero}`}
        size="lg"
      >
        {pedidoDetalhes && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Fornecedor</p>
                <p className="font-medium">{pedidoDetalhes.fornecedor_nome}</p>
                <p className="text-sm text-gray-500">{pedidoDetalhes.fornecedor_cnpj}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <Badge variant={statusConfig[pedidoDetalhes.status].variant}>
                  {statusConfig[pedidoDetalhes.status].label}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data do Pedido</p>
                <p className="font-medium">{formatDate(pedidoDetalhes.data_pedido)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Previsão de Entrega</p>
                <p className="font-medium">
                  {pedidoDetalhes.data_previsao_entrega ? formatDate(pedidoDetalhes.data_previsao_entrega) : '-'}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Itens do Pedido</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3">Produto</th>
                      <th className="text-right p-3">Qtd</th>
                      <th className="text-right p-3">Valor Unit.</th>
                      <th className="text-right p-3">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {pedidoDetalhes.itens?.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3">{item.produto_nome}</td>
                        <td className="p-3 text-right">{item.quantidade}</td>
                        <td className="p-3 text-right">{formatCurrency(item.valor_unitario)}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(item.valor_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="p-3 text-right font-medium">Total:</td>
                      <td className="p-3 text-right font-bold text-lg text-planac-600">
                        {formatCurrency(pedidoDetalhes.valor_total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            {pedidoDetalhes.observacao && (
              <div>
                <p className="text-sm text-gray-500">Observação</p>
                <p className="text-sm">{pedidoDetalhes.observacao}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PedidosCompraPage;
