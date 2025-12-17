// =============================================
// PLANAC ERP - Vendas Page
// Lista de Pedidos/Vendas
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface Entrega {
  id: string;
  numero: string; // .E1, .E2, etc
  status: string;
  data_prevista: string;
  data_realizada?: string;
  valor: number;
}

interface Venda {
  id: string;
  numero: string;
  orcamento_numero?: string;
  cliente_id: string;
  cliente_nome: string;
  vendedor_nome: string;
  status: 'pendente' | 'separando' | 'faturado' | 'entregue' | 'cancelado';
  status_pagamento: 'pendente' | 'parcial' | 'pago';
  valor_total: number;
  valor_pago: number;
  data_emissao: string;
  previsao_entrega: string;
  itens_count: number;
  entregas: Entrega[];
  tem_entregas_fracionadas: boolean;
  created_at: string;
}

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'separando', label: 'Separando' },
  { value: 'faturado', label: 'Faturado' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
];

const statusPagamentoOptions = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'pago', label: 'Pago' },
];

const statusColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  pendente: 'warning',
  separando: 'info',
  faturado: 'info',
  entregue: 'success',
  cancelado: 'danger',
};

const statusPagColors: Record<string, 'default' | 'info' | 'success' | 'warning' | 'danger'> = {
  pendente: 'warning',
  parcial: 'info',
  pago: 'success',
};

export function VendasPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [statusPagFilter, setStatusPagFilter] = useState('');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const clienteIdFilter = searchParams.get('cliente');

  useEffect(() => {
    loadVendas();
  }, [clienteIdFilter]);

  const loadVendas = async () => {
    try {
      let url = '/vendas';
      if (clienteIdFilter) {
        url += `?cliente_id=${clienteIdFilter}`;
      }
      const response = await api.get<{ success: boolean; data: Venda[] }>(url);
      if (response.success) {
        setVendas(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar vendas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Deseja realmente cancelar esta venda?')) return;

    try {
      await api.post(`/vendas/${id}/cancelar`);
      toast.success('Venda cancelada');
      loadVendas();
    } catch (error) {
      toast.error('Erro ao cancelar venda');
    }
  };

  const handleFaturar = async (id: string) => {
    try {
      await api.post(`/vendas/${id}/faturar`);
      toast.success('NF-e emitida com sucesso!');
      loadVendas();
    } catch (error) {
      toast.error('Erro ao faturar venda');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedRows(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredVendas = vendas.filter((v) => {
    const matchSearch =
      String(v.numero || "").toLowerCase().includes(search.toLowerCase()) ||
      String(v.cliente_nome || "").toLowerCase().includes(search.toLowerCase()) ||
      String(v.orcamento_numero || "").toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || v.status === statusFilter;
    const matchStatusPag = !statusPagFilter || v.status_pagamento === statusPagFilter;

    return matchSearch && matchStatus && matchStatusPag;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Stats
  const totalVendas = vendas.length;
  const valorTotal = vendas.reduce((acc, v) => acc + v.valor_total, 0);
  const valorPago = vendas.reduce((acc, v) => acc + v.valor_pago, 0);
  const pendentes = vendas.filter(v => v.status === 'pendente').length;

  const columns = [
    {
      key: 'expand',
      header: '',
      width: '40px',
      render: (v: Venda) => v.tem_entregas_fracionadas ? (
        <button
          onClick={(e) => { e.stopPropagation(); toggleExpand(v.id); }}
          className="p-1 hover:bg-gray-100 rounded"
        >
          {expandedRows.includes(v.id) ? (
            <Icons.chevronDown className="w-4 h-4" />
          ) : (
            <Icons.chevronRight className="w-4 h-4" />
          )}
        </button>
      ) : null,
    },
    {
      key: 'numero',
      header: 'Nº Pedido',
      width: '120px',
      sortable: true,
      render: (v: Venda) => (
        <div>
          <span className="font-mono font-medium">{v.numero}</span>
          {v.tem_entregas_fracionadas && (
            <Badge variant="info" size="sm" className="ml-1">
              {v.entregas.length}E
            </Badge>
          )}
          {v.orcamento_numero && (
            <p className="text-xs text-gray-400">Orç: #{v.orcamento_numero}</p>
          )}
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      sortable: true,
      render: (v: Venda) => (
        <p className="font-medium text-gray-900">{v.cliente_nome}</p>
      ),
    },
    {
      key: 'vendedor',
      header: 'Vendedor',
      width: '130px',
      render: (v: Venda) => v.vendedor_nome || '-',
    },
    {
      key: 'data_emissao',
      header: 'Data',
      width: '100px',
      render: (v: Venda) => formatDate(v.data_emissao),
    },
    {
      key: 'valor_total',
      header: 'Valor',
      width: '130px',
      render: (v: Venda) => (
        <div>
          <span className="font-medium text-green-600">
            {formatCurrency(v.valor_total)}
          </span>
          {v.valor_pago > 0 && v.valor_pago < v.valor_total && (
            <p className="text-xs text-gray-500">
              Pago: {formatCurrency(v.valor_pago)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (v: Venda) => (
        <Badge variant={statusColors[v.status] || 'default'}>
          {(v.status || 'pendente').charAt(0).toUpperCase() + (v.status || 'pendente').slice(1)}
        </Badge>
      ),
    },
    {
      key: 'status_pagamento',
      header: 'Pagamento',
      width: '100px',
      render: (v: Venda) => (
        <Badge variant={statusPagColors[v.status_pagamento] || 'default'} size="sm">
          {(v.status_pagamento || 'pendente').charAt(0).toUpperCase() + (v.status_pagamento || 'pendente').slice(1)}
        </Badge>
      ),
    },
  ];

  const actions = (venda: Venda) => [
    {
      label: 'Ver Detalhes',
      icon: <Icons.eye className="w-4 h-4" />,
      onClick: () => navigate(`/vendas/${venda.id}`),
    },
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => navigate(`/vendas/${venda.id}/editar`),
      disabled: venda.status === 'faturado' || venda.status === 'cancelado',
    },
    { type: 'separator' as const },
    ...(venda.status === 'separando' ? [{
      label: 'Faturar (NF-e)',
      icon: <Icons.fileText className="w-4 h-4" />,
      variant: 'success' as const,
      onClick: () => handleFaturar(venda.id),
    }] : []),
    ...(venda.status !== 'cancelado' && venda.status !== 'entregue' ? [{
      label: 'Cancelar',
      icon: <Icons.x className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleCancel(venda.id),
    }] : []),
  ];

  // Render expandable row for entregas fracionadas
  const renderExpandedRow = (venda: Venda) => {
    if (!expandedRows.includes(venda.id) || !venda.tem_entregas_fracionadas) return null;

    return (
      <tr className="bg-blue-50">
        <td colSpan={9} className="px-6 py-3">
          <div className="text-sm">
            <p className="font-medium text-blue-800 mb-2">
              Entregas Fracionadas ({venda.entregas.length})
            </p>
            <div className="grid grid-cols-4 gap-3">
              {venda.entregas.map((entrega) => (
                <div
                  key={entrega.id}
                  className="bg-white p-3 rounded-lg border border-blue-200"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono font-medium">
                      {venda.numero}{entrega.numero}
                    </span>
                    <Badge
                      variant={
                        entrega.status === 'entregue' ? 'success' :
                        entrega.status === 'em_transito' ? 'info' : 'default'
                      }
                      size="sm"
                    >
                      {entrega.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    Prevista: {formatDate(entrega.data_prevista)}
                  </p>
                  {entrega.data_realizada && (
                    <p className="text-xs text-green-600">
                      Realizada: {formatDate(entrega.data_realizada)}
                    </p>
                  )}
                  <p className="text-sm font-medium text-green-600 mt-1">
                    {formatCurrency(entrega.valor)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendas / Pedidos</h1>
          <p className="text-gray-500">Gerencie seus pedidos de venda</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={() => navigate('/vendas/novo')}
        >
          Nova Venda
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.shoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalVendas}</p>
              <p className="text-sm text-gray-500">Total Pedidos</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icons.clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{pendentes}</p>
              <p className="text-sm text-gray-500">Pendentes</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.dollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(valorTotal)}</p>
              <p className="text-sm text-gray-500">Valor Total</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.checkCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(valorPago)}</p>
              <p className="text-sm text-gray-500">Valor Recebido</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por número, cliente, orçamento..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              placeholder="Status"
            />
          </div>
          <div className="w-36">
            <Select
              value={statusPagFilter}
              onChange={setStatusPagFilter}
              options={statusPagamentoOptions}
              placeholder="Pagamento"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredVendas}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma venda encontrada"
          onRowClick={(v) => navigate(`/vendas/${v.id}`)}
          renderExpandedRow={renderExpandedRow}
        />
      </Card>
    </div>
  );
}

export default VendasPage;
