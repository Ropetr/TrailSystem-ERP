// =============================================
// PLANAC ERP - Produtos Page
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

interface Produto {
  id: string;
  codigo: string;
  codigo_barras?: string;
  descricao: string;
  ncm?: string;
  unidade: string;
  categoria_id?: string;
  categoria_nome?: string;
  preco_venda: number;
  preco_custo?: number;
  estoque_atual: number;
  estoque_minimo: number;
  marca?: string;
  ativo: boolean;
}

const statusOptions = [
  { value: '', label: 'Todos' },
  { value: 'ativo', label: 'Ativos' },
  { value: 'inativo', label: 'Inativos' },
  { value: 'estoque_baixo', label: 'Estoque Baixo' },
];

export function ProdutosPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categorias, setCategorias] = useState<{ value: string; label: string }[]>([]);
  const [categoriaFilter, setCategoriaFilter] = useState('');

  useEffect(() => {
    loadProdutos();
    loadCategorias();
  }, []);

  const loadProdutos = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Produto[] }>('/produtos');
      if (response.success) {
        setProdutos(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategorias = async () => {
    try {
      const response = await api.get('/categorias');
      if (response.success) {
        setCategorias([
          { value: '', label: 'Todas' },
          ...response.data.map((c: any) => ({ value: c.id, label: c.nome })),
        ]);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;

    try {
      await api.delete(`/produtos/${id}`);
      toast.success('Produto excluído com sucesso');
      loadProdutos();
    } catch (error) {
      toast.error('Erro ao excluir produto');
    }
  };

  const filteredProdutos = produtos.filter((p) => {
    const matchSearch =
      p.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo_barras?.includes(search);

    const matchStatus =
      !statusFilter ||
      (statusFilter === 'ativo' && p.ativo) ||
      (statusFilter === 'inativo' && !p.ativo) ||
      (statusFilter === 'estoque_baixo' && p.estoque_atual <= p.estoque_minimo);

    const matchCategoria = !categoriaFilter || p.categoria_id === categoriaFilter;

    return matchSearch && matchStatus && matchCategoria;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const columns = [
    {
      key: 'codigo',
      header: 'Código',
      width: '100px',
      sortable: true,
      render: (p: Produto) => (
        <span className="font-mono text-sm">{p.codigo}</span>
      ),
    },
    {
      key: 'descricao',
      header: 'Descrição',
      sortable: true,
      render: (p: Produto) => (
        <div>
          <p className="font-medium text-gray-900">{p.descricao}</p>
          {p.marca && <p className="text-sm text-gray-500">{p.marca}</p>}
        </div>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoria',
      width: '150px',
      render: (p: Produto) => p.categoria_nome || '-',
    },
    {
      key: 'unidade',
      header: 'UN',
      width: '60px',
    },
    {
      key: 'preco_venda',
      header: 'Preço',
      width: '120px',
      render: (p: Produto) => (
        <span className="font-medium text-green-600">
          {formatCurrency(p.preco_venda)}
        </span>
      ),
    },
    {
      key: 'estoque_atual',
      header: 'Estoque',
      width: '100px',
      render: (p: Produto) => (
        <div className="flex items-center gap-2">
          <span className={p.estoque_atual <= p.estoque_minimo ? 'text-red-600 font-medium' : ''}>
            {p.estoque_atual}
          </span>
          {p.estoque_atual <= p.estoque_minimo && (
            <Icons.alertTriangle className="w-4 h-4 text-red-500" />
          )}
        </div>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '90px',
      render: (p: Produto) => (
        <Badge variant={p.ativo ? 'success' : 'danger'} size="sm">
          {p.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const actions = (produto: Produto) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => navigate(`/produtos/${produto.id}`),
    },
    {
      label: 'Duplicar',
      icon: <Icons.copy className="w-4 h-4" />,
      onClick: () => navigate(`/produtos/novo?duplicar=${produto.id}`),
    },
    { type: 'separator' as const },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(produto.id),
    },
  ];

  // Stats
  const totalProdutos = produtos.length;
  const produtosAtivos = produtos.filter((p) => p.ativo).length;
  const estoqueBaixo = produtos.filter((p) => p.estoque_atual <= p.estoque_minimo).length;
  const valorEstoque = produtos.reduce((acc, p) => acc + p.preco_venda * p.estoque_atual, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500">Gerencie seu catálogo de produtos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Icons.download className="w-5 h-5" />}>
            Importar
          </Button>
          <Button
            leftIcon={<Icons.plus className="w-5 h-5" />}
            onClick={() => navigate('/produtos/novo')}
          >
            Novo Produto
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalProdutos}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{produtosAtivos}</p>
              <p className="text-sm text-gray-500">Ativos</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Icons.alertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{estoqueBaixo}</p>
              <p className="text-sm text-gray-500">Estoque Baixo</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.dollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(valorEstoque)}</p>
              <p className="text-sm text-gray-500">Valor em Estoque</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por código, descrição, código de barras..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              value={categoriaFilter}
              onChange={setCategoriaFilter}
              options={categorias}
              placeholder="Categoria"
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
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredProdutos}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum produto encontrado"
          onRowClick={(p) => navigate(`/produtos/${p.id}`)}
        />
      </Card>
    </div>
  );
}

export default ProdutosPage;
