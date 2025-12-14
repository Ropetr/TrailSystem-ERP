// =============================================
// PLANAC ERP - Saldos de Estoque / Posição
// =============================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface SaldoEstoque {
  produto_id: string;
  produto_codigo: string;
  produto_nome: string;
  produto_unidade: string;
  categoria_nome: string;
  estoque_atual: number;
  estoque_minimo: number;
  estoque_maximo: number;
  estoque_reservado: number;
  estoque_disponivel: number;
  preco_custo: number;
  preco_venda: number;
  valor_estoque: number;
  localizacao?: string;
  ultimo_movimento?: string;
  status: 'normal' | 'baixo' | 'critico' | 'excesso';
}

const statusConfig = {
  normal: { label: 'Normal', variant: 'success' as const },
  baixo: { label: 'Baixo', variant: 'warning' as const },
  critico: { label: 'Crítico', variant: 'danger' as const },
  excesso: { label: 'Excesso', variant: 'info' as const },
};

export function SaldosPage() {
  const toast = useToast();
  const [saldos, setSaldos] = useState<SaldoEstoque[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [filialFilter, setFilialFilter] = useState('');

  useEffect(() => {
    loadSaldos();
  }, [filialFilter]);

  const loadSaldos = async () => {
    try {
      const params = filialFilter ? `?filial_id=${filialFilter}` : '';
      const response = await api.get<{ success: boolean; data: SaldoEstoque[] }>(`/estoque/saldos${params}`);
      if (response.success) {
        setSaldos(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar saldos');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSaldos = saldos.filter((s) => {
    const matchSearch =
      s.produto_nome?.toLowerCase().includes(search.toLowerCase()) ||
      s.produto_codigo?.includes(search);

    const matchCategoria = !categoriaFilter || s.categoria_nome === categoriaFilter;
    const matchStatus = !statusFilter || s.status === statusFilter;

    return matchSearch && matchCategoria && matchStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Estatísticas
  const stats = {
    totalItens: saldos.length,
    itensEstoqueBaixo: saldos.filter(s => s.status === 'baixo' || s.status === 'critico').length,
    valorTotalEstoque: saldos.reduce((acc, s) => acc + s.valor_estoque, 0),
    itensSemMovimento30d: saldos.filter(s => {
      if (!s.ultimo_movimento) return true;
      const dias = (Date.now() - new Date(s.ultimo_movimento).getTime()) / (1000 * 60 * 60 * 24);
      return dias > 30;
    }).length,
  };

  // Categorias únicas para filtro
  const categorias = [...new Set(saldos.map(s => s.categoria_nome).filter(Boolean))];

  const columns = [
    {
      key: 'produto',
      header: 'Produto',
      render: (s: SaldoEstoque) => (
        <div>
          <p className="font-medium text-gray-900">{s.produto_nome}</p>
          <p className="text-sm text-gray-500">{s.produto_codigo}</p>
        </div>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoria',
      width: '130px',
      render: (s: SaldoEstoque) => s.categoria_nome || '-',
    },
    {
      key: 'estoque_atual',
      header: 'Estoque',
      width: '100px',
      sortable: true,
      render: (s: SaldoEstoque) => (
        <div className="text-center">
          <p className="font-bold text-lg">{s.estoque_atual}</p>
          <p className="text-xs text-gray-500">{s.produto_unidade}</p>
        </div>
      ),
    },
    {
      key: 'reservado',
      header: 'Reservado',
      width: '90px',
      render: (s: SaldoEstoque) => (
        <span className={s.estoque_reservado > 0 ? 'text-orange-600 font-medium' : 'text-gray-400'}>
          {s.estoque_reservado}
        </span>
      ),
    },
    {
      key: 'disponivel',
      header: 'Disponível',
      width: '90px',
      render: (s: SaldoEstoque) => (
        <span className="font-bold text-green-600">{s.estoque_disponivel}</span>
      ),
    },
    {
      key: 'min_max',
      header: 'Mín/Máx',
      width: '100px',
      render: (s: SaldoEstoque) => (
        <div className="text-sm">
          <span className="text-red-500">{s.estoque_minimo}</span>
          <span className="mx-1">/</span>
          <span className="text-blue-500">{s.estoque_maximo}</span>
        </div>
      ),
    },
    {
      key: 'valor',
      header: 'Valor Estoque',
      width: '130px',
      sortable: true,
      render: (s: SaldoEstoque) => (
        <span className="font-medium">{formatCurrency(s.valor_estoque)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (s: SaldoEstoque) => {
        const config = statusConfig[s.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'localizacao',
      header: 'Local',
      width: '100px',
      render: (s: SaldoEstoque) => s.localizacao || '-',
    },
  ];

  const actions = (saldo: SaldoEstoque) => [
    {
      label: 'Ver Movimentações',
      icon: <Icons.document className="w-4 h-4" />,
      onClick: () => {},
    },
    {
      label: 'Ajustar Estoque',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => {},
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Posição de Estoque</h1>
          <p className="text-gray-500">Saldos atuais por produto</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Icons.printer className="w-5 h-5" />}>
            Imprimir
          </Button>
          <Button variant="secondary" leftIcon={<Icons.document className="w-5 h-5" />}>
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por nome ou código..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              value={filialFilter}
              onChange={setFilialFilter}
              options={[
                { value: '', label: 'Todas Filiais' },
                { value: '1', label: 'Matriz' },
                { value: '2', label: 'Filial 01' },
              ]}
              placeholder="Filial"
            />
          </div>
          <div className="w-40">
            <Select
              value={categoriaFilter}
              onChange={setCategoriaFilter}
              options={[
                { value: '', label: 'Todas Categorias' },
                ...categorias.map(c => ({ value: c, label: c })),
              ]}
              placeholder="Categoria"
            />
          </div>
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'Todos Status' },
                ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label })),
              ]}
              placeholder="Status"
            />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.document className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.totalItens}</p>
              <p className="text-sm text-gray-500">Total de Itens</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Icons.x className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.itensEstoqueBaixo}</p>
              <p className="text-sm text-gray-500">Estoque Baixo</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.valorTotalEstoque)}</p>
              <p className="text-sm text-gray-500">Valor em Estoque</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icons.eye className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.itensSemMovimento30d}</p>
              <p className="text-sm text-gray-500">Sem Movimento (30d)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredSaldos}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum produto encontrado"
        />
      </Card>
    </div>
  );
}

export default SaldosPage;
