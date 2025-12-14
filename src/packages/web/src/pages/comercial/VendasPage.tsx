// =============================================
// PLANAC ERP - Vendas Page
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface Venda {
  id: string;
  numero: string;
  orcamento_numero?: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_cpf_cnpj?: string;
  vendedor_nome?: string;
  data_emissao: string;
  data_previsao_entrega?: string;
  status: 'pendente' | 'aprovado' | 'faturado' | 'em_separacao' | 'despachado' | 'entregue' | 'cancelado';
  status_pagamento: 'pendente' | 'parcial' | 'pago';
  valor_total: number;
  valor_pago: number;
  entregas?: EntregaFracionada[];
  nfe_numero?: string;
}

interface EntregaFracionada {
  id: string;
  codigo: string; // Ex: .E1, .E2
  data_prevista: string;
  status: 'pendente' | 'separando' | 'despachado' | 'entregue';
  valor: number;
}

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'faturado', label: 'Faturado' },
  { value: 'em_separacao', label: 'Em Separação' },
  { value: 'despachado', label: 'Despachado' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
];

const statusConfig: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; label: string }> = {
  pendente: { variant: 'warning', label: 'Pendente' },
  aprovado: { variant: 'info', label: 'Aprovado' },
  faturado: { variant: 'info', label: 'Faturado' },
  em_separacao: { variant: 'warning', label: 'Separando' },
  despachado: { variant: 'info', label: 'Despachado' },
  entregue: { variant: 'success', label: 'Entregue' },
  cancelado: { variant: 'danger', label: 'Cancelado' },
};

const pagamentoConfig: Record<string, { variant: 'default' | 'success' | 'warning' | 'danger'; label: string }> = {
  pendente: { variant: 'danger', label: 'Pendente' },
  parcial: { variant: 'warning', label: 'Parcial' },
  pago: { variant: 'success', label: 'Pago' },
};

export function VendasPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [vendas, setVendas] = useState<Venda[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagamentoFilter, setPagamentoFilter] = useState('');

  useEffect(() => {
    loadVendas();
  }, []);

  const loadVendas = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Venda[] }>('/vendas');
      if (response.success) {
        setVendas(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar vendas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFaturar = async (id: string) => {
    try {
      const response = await api.post(`/vendas/${id}/faturar`);
      if (response.success) {
        toast.success(`NF-e ${response.data.nfe_numero} emitida com sucesso`);
        loadVendas();
      }
    } catch (error) {
      toast.error('Erro ao faturar venda');
    }
  };

  const handleCancelar = async (id: string) => {
    if (!confirm('Deseja realmente cancelar esta venda?')) return;

    try {
      await api.post(`/vendas/${id}/cancelar`);
      toast.success('Venda cancelada');
      loadVendas();
    } catch (error) {
      toast.error('Erro ao cancelar venda');
    }
  };

  const filteredVendas = vendas.filter((v) => {
    const matchSearch =
      v.numero?.toLowerCase().includes(search.toLowerCase()) ||
      v.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      v.nfe_numero?.includes(search);

    const matchStatus = !statusFilter || v.status === statusFilter;
    const matchPagamento = !pagamentoFilter || v.status_pagamento === pagamentoFilter;

    return matchSearch && matchStatus && matchPagamento;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const columns = [
    {
      key: 'numero',
      header: 'Pedido',
      width: '120px',
      sortable: true,
      render: (v: Venda) => (
        <div>
          <span className="font-mono font-medium text-planac-600">#{v.numero}</span>
          {v.orcamento_numero && (
            <p className="text-xs text-gray-500">Orç. #{v.orcamento_numero}</p>
          )}
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      sortable: true,
      render: (v: Venda) => (
        <div>
          <p className="font-medium text-gray-900">{v.cliente_nome}</p>
          {v.cliente_cpf_cnpj && (
            <p className="text-sm text-gray-500">{v.cliente_cpf_cnpj}</p>
          )}
        </div>
      ),
    },
    {
      key: 'vendedor_nome',
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
      key: 'entregas',
      header: 'Entregas',
      width: '100px',
      render: (v: Venda) => {
        if (!v.entregas || v.entregas.length === 0) {
          return <span className="text-gray-400">-</span>;
        }
        const entregues = v.entregas.filter((e) => e.status === 'entregue').length;
        return (
          <div className="flex items-center gap-1">
            <span className={entregues === v.entregas.length ? 'text-green-600' : 'text-amber-600'}>
              {entregues}/{v.entregas.length}
            </span>
            {v.entregas.length > 1 && (
              <Badge variant="info" size="sm">Fracionada</Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'nfe_numero',
      header: 'NF-e',
      width: '90px',
      render: (v: Venda) => v.nfe_numero || '-',
    },
    {
      key: 'valor_total',
      header: 'Total',
      width: '120px',
      render: (v: Venda) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(v.valor_total)}
        </span>
      ),
    },
    {
      key: 'status_pagamento',
      header: 'Pagto',
      width: '90px',
      render: (v: Venda) => {
        const config = pagamentoConfig[v.status_pagamento];
        return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (v: Venda) => {
        const config = statusConfig[v.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (venda: Venda) => {
    const items: any[] = [
      {
        label: 'Ver Detalhes',
        icon: <Icons.eye className="w-4 h-4" />,
        onClick: () => navigate(`/vendas/${venda.id}`),
      },
    ];

    if (venda.status === 'aprovado' && !venda.nfe_numero) {
      items.push({
        label: 'Faturar (Emitir NF-e)',
        icon: <Icons.fileText className="w-4 h-4" />,
        variant: 'success' as const,
        onClick: () => handleFaturar(venda.id),
      });
    }

    if (venda.nfe_numero) {
      items.push({
        label: 'Ver NF-e',
        icon: <Icons.fileText className="w-4 h-4" />,
        onClick: () => window.open(`/api/nfe/${venda.nfe_numero}/pdf`, '_blank'),
      });
    }

    items.push(
      {
        label: 'Imprimir',
        icon: <Icons.printer className="w-4 h-4" />,
        onClick: () => window.open(`/api/vendas/${venda.id}/pdf`, '_blank'),
      },
      { type: 'separator' as const }
    );

    if (venda.status !== 'cancelado' && venda.status !== 'entregue') {
      items.push({
        label: 'Cancelar',
        icon: <Icons.x className="w-4 h-4" />,
        variant: 'danger' as const,
        onClick: () => handleCancelar(venda.id),
      });
    }

    return items;
  };

  // Cálculos para cards
  const totalVendas = vendas.filter((v) => v.status !== 'cancelado').reduce((acc, v) => acc + v.valor_total, 0);
  const totalReceber = vendas.filter((v) => v.status !== 'cancelado').reduce((acc, v) => acc + (v.valor_total - v.valor_pago), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
          <p className="text-gray-500">Acompanhe seus pedidos de venda</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={() => navigate('/vendas/novo')}
        >
          Nova Venda
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <Input
              placeholder="Buscar por número, cliente ou NF-e..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              placeholder="Status"
            />
          </div>
          <div className="w-36">
            <Select
              value={pagamentoFilter}
              onChange={setPagamentoFilter}
              options={[
                { value: '', label: 'Todos' },
                { value: 'pendente', label: 'Pendente' },
                { value: 'parcial', label: 'Parcial' },
                { value: 'pago', label: 'Pago' },
              ]}
              placeholder="Pagamento"
            />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {vendas.filter((v) => v.status !== 'cancelado').length}
            </p>
            <p className="text-sm text-gray-500">Pedidos</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-600">
              {vendas.filter((v) => v.status === 'pendente').length}
            </p>
            <p className="text-sm text-gray-500">Pendentes</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {vendas.filter((v) => ['em_separacao', 'despachado'].includes(v.status)).length}
            </p>
            <p className="text-sm text-gray-500">Em Andamento</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalVendas)}
            </p>
            <p className="text-sm text-gray-500">Total Vendido</p>
          </div>
        </Card>
        <Card padding="sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalReceber)}
            </p>
            <p className="text-sm text-gray-500">A Receber</p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredVendas}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma venda encontrada"
          onRowClick={(v) => navigate(`/vendas/${v.id}`)}
        />
      </Card>
    </div>
  );
}

export default VendasPage;
