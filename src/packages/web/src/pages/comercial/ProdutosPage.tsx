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
  unidade: string;
  ncm?: string;
  categoria_id?: string;
  categoria_nome?: string;
  preco_venda: number;
  preco_custo: number;
  estoque_atual: number;
  estoque_minimo: number;
  ativo: boolean;
}

interface Categoria {
  id: string;
  nome: string;
}

export function ProdutosPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [estoqueFilter, setEstoqueFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [produtosRes, categoriasRes] = await Promise.all([
        api.get<{ success: boolean; data: Produto[] }>('/produtos'),
        api.get<{ success: boolean; data: Categoria[] }>('/categorias'),
      ]);

      if (produtosRes.success) {
        setProdutos(produtosRes.data);
      }
      if (categoriasRes.success) {
        setCategorias([
          { value: '', label: 'Todas' },
          ...categoriasRes.data.map((c) => ({ value: c.id, label: c.nome })),
        ]);
      }
    } catch (error) {
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;

    try {
      await api.delete(`/produtos/${id}`);
      toast.success('Produto excluído com sucesso');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir produto');
    }
  };

  const filteredProdutos = produtos.filter((p) => {
    const matchSearch =
      p.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo_barras?.includes(search);

    const matchCategoria = !categoriaFilter || p.categoria_id === categoriaFilter;
    const matchStatus =
      !statusFilter ||
      (statusFilter === 'ativo' && p.ativo) ||
      (statusFilter === 'inativo' && !p.ativo);
    const matchEstoque =
      !estoqueFilter ||
      (estoqueFilter === 'baixo' && p.estoque_atual <= p.estoque_minimo) ||
      (estoqueFilter === 'normal' && p.estoque_atual > p.estoque_minimo);

    return matchSearch && matchCategoria && matchStatus && matchEstoque;
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
        <span className="font-mono text-sm text-gray-600">{p.codigo}</span>
      ),
    },
    {
      key: 'descricao',
      header: 'Descrição',
      sortable: true,
      render: (p: Produto) => (
        <div>
          <p className="font-medium text-gray-900">{p.descricao}</p>
          {p.categoria_nome && (
            <p className="text-sm text-gray-500">{p.categoria_nome}</p>
          )}
        </div>
      ),
    },
    {
      key: 'ncm',
      header: 'NCM',
      width: '100px',
      render: (p: Produto) => (
        <span className="font-mono text-sm">{p.ncm || '-'}</span>
      ),
    },
    {
      key: 'unidade',
      header: 'UN',
      width: '60px',
    },
    {
      key: 'preco_venda',
      header: 'Preço Venda',
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
      render: (p: Produto) => {
        const baixo = p.estoque_atual <= p.estoque_minimo;
        return (
          <div className="flex items-center gap-2">
            <span className={baixo ? 'text-red-600 font-medium' : 'text-gray-900'}>
              {p.estoque_atual}
            </span>
            {baixo && (
              <Icons.alertTriangle className="w-4 h-4 text-red-500" />
            )}
          </div>
        );
      },
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

  const produtosBaixoEstoque = produtos.filter(
    (p) => p.ativo && p.estoque_atual <= p.estoque_minimo
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-gray-500">Gerencie seu catálogo de produtos</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            leftIcon={<Icons.download className="w-5 h-5" />}
          >
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

      {/* Alerta de estoque baixo */}
      {produtosBaixoEstoque > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <Icons.alertTriangle className="w-5 h-5 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Atenção: Estoque baixo</p>
            <p className="text-sm text-amber-600">
              {produtosBaixoEstoque} produto(s) estão com estoque abaixo do mínimo
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto"
            onClick={() => setEstoqueFilter('baixo')}
          >
            Ver produtos
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <Input
              placeholder="Buscar por código, descrição ou código de barras..."
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
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'Todos' },
                { value: 'ativo', label: 'Ativos' },
                { value: 'inativo', label: 'Inativos' },
              ]}
              placeholder="Status"
            />
          </div>
          <div className="w-36">
            <Select
              value={estoqueFilter}
              onChange={setEstoqueFilter}
              options={[
                { value: '', label: 'Todos' },
                { value: 'baixo', label: 'Estoque baixo' },
                { value: 'normal', label: 'Estoque OK' },
              ]}
              placeholder="Estoque"
            />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{produtos.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">
                {produtos.filter((p) => p.ativo).length}
              </p>
              <p className="text-sm text-gray-500">Ativos</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Icons.alertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{produtosBaixoEstoque}</p>
              <p className="text-sm text-gray-500">Estoque Baixo</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.layers className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{categorias.length - 1}</p>
              <p className="text-sm text-gray-500">Categorias</p>
            </div>
          </div>
        </Card>
      </div>

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
