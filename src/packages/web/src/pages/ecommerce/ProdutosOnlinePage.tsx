// =============================================
// PLANAC ERP - Produtos Online (Catálogo E-commerce)
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

interface ProdutoOnline {
  id: string;
  produto_erp_id: string;
  sku: string;
  nome: string;
  descricao?: string;
  categoria: string;
  preco_erp: number;
  preco_online: number;
  preco_promocional?: number;
  estoque_erp: number;
  estoque_online: number;
  status: 'ativo' | 'inativo' | 'esgotado' | 'pendente';
  publicado_em: {
    nuvemshop?: boolean;
    shopify?: boolean;
    mercadolivre?: boolean;
  };
  imagens: string[];
  variantes?: Array<{
    id: string;
    nome: string;
    sku: string;
    preco: number;
    estoque: number;
  }>;
  ultima_sincronizacao?: string;
  erro_sincronizacao?: string;
}

const statusConfig = {
  ativo: { label: 'Ativo', variant: 'success' as const },
  inativo: { label: 'Inativo', variant: 'default' as const },
  esgotado: { label: 'Esgotado', variant: 'danger' as const },
  pendente: { label: 'Pendente', variant: 'warning' as const },
};

export function ProdutosOnlinePage() {
  const toast = useToast();
  const [produtos, setProdutos] = useState<ProdutoOnline[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [selecionados, setSelecionados] = useState<string[]>([]);
  
  // Modal de edição
  const [showEditModal, setShowEditModal] = useState(false);
  const [produtoEdit, setProdutoEdit] = useState<ProdutoOnline | null>(null);
  const [editForm, setEditForm] = useState({
    nome: '',
    descricao: '',
    preco_online: '',
    preco_promocional: '',
  });
  
  // Modal de publicação
  const [showPublicarModal, setShowPublicarModal] = useState(false);
  const [publicarForm, setPublicarForm] = useState({
    nuvemshop: true,
    shopify: false,
    mercadolivre: false,
  });

  useEffect(() => {
    loadProdutos();
  }, []);

  const loadProdutos = async () => {
    try {
      const response = await api.get<{ success: boolean; data: ProdutoOnline[] }>('/ecommerce/produtos');
      if (response.success) {
        setProdutos(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar produtos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSincronizarEstoque = async () => {
    try {
      await api.post('/ecommerce/produtos/sincronizar-estoque');
      toast.success('Estoque sincronizado');
      loadProdutos();
    } catch (error) {
      toast.error('Erro ao sincronizar estoque');
    }
  };

  const handleSincronizarPrecos = async () => {
    try {
      await api.post('/ecommerce/produtos/sincronizar-precos');
      toast.success('Preços sincronizados');
      loadProdutos();
    } catch (error) {
      toast.error('Erro ao sincronizar preços');
    }
  };

  const handleSalvarEdicao = async () => {
    if (!produtoEdit) return;

    try {
      await api.put(`/ecommerce/produtos/${produtoEdit.id}`, {
        nome: editForm.nome,
        descricao: editForm.descricao,
        preco_online: parseFloat(editForm.preco_online),
        preco_promocional: editForm.preco_promocional ? parseFloat(editForm.preco_promocional) : null,
      });
      toast.success('Produto atualizado');
      setShowEditModal(false);
      loadProdutos();
    } catch (error) {
      toast.error('Erro ao atualizar produto');
    }
  };

  const handlePublicar = async () => {
    if (selecionados.length === 0) {
      toast.error('Selecione pelo menos um produto');
      return;
    }

    try {
      await api.post('/ecommerce/produtos/publicar', {
        produtos: selecionados,
        plataformas: publicarForm,
      });
      toast.success(`${selecionados.length} produto(s) publicado(s)`);
      setShowPublicarModal(false);
      setSelecionados([]);
      loadProdutos();
    } catch (error) {
      toast.error('Erro ao publicar produtos');
    }
  };

  const handleDespublicar = async (produto: ProdutoOnline) => {
    if (!confirm('Deseja despublicar este produto de todas as plataformas?')) return;

    try {
      await api.post(`/ecommerce/produtos/${produto.id}/despublicar`);
      toast.success('Produto despublicado');
      loadProdutos();
    } catch (error) {
      toast.error('Erro ao despublicar');
    }
  };

  const handleToggleStatus = async (produto: ProdutoOnline) => {
    const novoStatus = produto.status === 'ativo' ? 'inativo' : 'ativo';
    
    try {
      await api.put(`/ecommerce/produtos/${produto.id}/status`, { status: novoStatus });
      toast.success(`Produto ${novoStatus === 'ativo' ? 'ativado' : 'desativado'}`);
      loadProdutos();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const categorias = [...new Set(produtos.map(p => p.categoria))].filter(Boolean);

  const filteredProdutos = produtos.filter((produto) => {
    const matchSearch =
      produto.sku?.toLowerCase().includes(search.toLowerCase()) ||
      produto.nome?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || produto.status === statusFilter;
    const matchCategoria = !categoriaFilter || produto.categoria === categoriaFilter;
    return matchSearch && matchStatus && matchCategoria;
  });

  // Stats
  const stats = {
    total: produtos.length,
    ativos: produtos.filter(p => p.status === 'ativo').length,
    esgotados: produtos.filter(p => p.status === 'esgotado').length,
    pendentes: produtos.filter(p => p.erro_sincronizacao).length,
  };

  const columns = [
    {
      key: 'selecao',
      header: (
        <input
          type="checkbox"
          checked={selecionados.length === filteredProdutos.length && filteredProdutos.length > 0}
          onChange={(e) => {
            if (e.target.checked) {
              setSelecionados(filteredProdutos.map(p => p.id));
            } else {
              setSelecionados([]);
            }
          }}
        />
      ),
      width: '40px',
      render: (p: ProdutoOnline) => (
        <input
          type="checkbox"
          checked={selecionados.includes(p.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelecionados([...selecionados, p.id]);
            } else {
              setSelecionados(selecionados.filter(id => id !== p.id));
            }
          }}
        />
      ),
    },
    {
      key: 'produto',
      header: 'Produto',
      render: (p: ProdutoOnline) => (
        <div className="flex items-center gap-3">
          {p.imagens?.[0] ? (
            <img src={p.imagens[0]} alt={p.nome} className="w-12 h-12 object-cover rounded" />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
              <Icons.document className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div>
            <p className="font-medium">{p.nome}</p>
            <p className="text-sm text-gray-500 font-mono">{p.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'precos',
      header: 'Preços',
      width: '150px',
      render: (p: ProdutoOnline) => (
        <div>
          <p className="font-medium">{formatCurrency(p.preco_online)}</p>
          {p.preco_promocional && (
            <p className="text-sm text-green-600">Promo: {formatCurrency(p.preco_promocional)}</p>
          )}
          {p.preco_online !== p.preco_erp && (
            <p className="text-xs text-orange-500">ERP: {formatCurrency(p.preco_erp)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'estoque',
      header: 'Estoque',
      width: '100px',
      render: (p: ProdutoOnline) => (
        <div>
          <p className={`font-medium ${p.estoque_online <= 0 ? 'text-red-600' : p.estoque_online <= 5 ? 'text-orange-600' : ''}`}>
            {p.estoque_online} un
          </p>
          {p.estoque_online !== p.estoque_erp && (
            <p className="text-xs text-orange-500">ERP: {p.estoque_erp}</p>
          )}
        </div>
      ),
    },
    {
      key: 'plataformas',
      header: 'Publicado em',
      width: '120px',
      render: (p: ProdutoOnline) => (
        <div className="flex gap-1">
          {p.publicado_em?.nuvemshop && <span title="Nuvemshop">🛒</span>}
          {p.publicado_em?.shopify && <span title="Shopify">🛍️</span>}
          {p.publicado_em?.mercadolivre && <span title="Mercado Livre">🤝</span>}
          {!p.publicado_em?.nuvemshop && !p.publicado_em?.shopify && !p.publicado_em?.mercadolivre && (
            <span className="text-gray-400 text-xs">Nenhum</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (p: ProdutoOnline) => {
        const config = statusConfig[p.status];
        return (
          <div>
            <Badge variant={config.variant}>{config.label}</Badge>
            {p.erro_sincronizacao && (
              <p className="text-xs text-red-500 mt-1" title={p.erro_sincronizacao}>⚠️ Erro</p>
            )}
          </div>
        );
      },
    },
  ];

  const actions = (produto: ProdutoOnline) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => {
        setProdutoEdit(produto);
        setEditForm({
          nome: produto.nome,
          descricao: produto.descricao || '',
          preco_online: produto.preco_online.toString(),
          preco_promocional: produto.preco_promocional?.toString() || '',
        });
        setShowEditModal(true);
      },
    },
    {
      label: produto.status === 'ativo' ? 'Desativar' : 'Ativar',
      icon: produto.status === 'ativo' ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />,
      onClick: () => handleToggleStatus(produto),
    },
    {
      label: 'Despublicar',
      icon: <Icons.x className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDespublicar(produto),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catálogo Online</h1>
          <p className="text-gray-500">Gerencie produtos publicados nas lojas virtuais</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSincronizarEstoque}>
            <Icons.refresh className="w-5 h-5 mr-1" /> Sincr. Estoque
          </Button>
          <Button variant="secondary" onClick={handleSincronizarPrecos}>
            <Icons.refresh className="w-5 h-5 mr-1" /> Sincr. Preços
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Ativos</p>
          <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Esgotados</p>
          <p className="text-2xl font-bold text-red-600">{stats.esgotados}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Com Erro</p>
          <p className="text-2xl font-bold text-orange-600">{stats.pendentes}</p>
        </Card>
      </div>

      {/* Barra de ações em lote */}
      {selecionados.length > 0 && (
        <Card padding="sm" className="bg-planac-50 border-planac-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-planac-700">
              {selecionados.length} produto(s) selecionado(s)
            </span>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowPublicarModal(true)}>
                Publicar Selecionados
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setSelecionados([])}>
                Limpar Seleção
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filtros */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por SKU ou nome..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={categoriaFilter}
            onChange={setCategoriaFilter}
            options={[
              { value: '', label: 'Todas Categorias' },
              ...categorias.map(c => ({ value: c, label: c })),
            ]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'Todos Status' },
              ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label })),
            ]}
          />
        </div>
      </Card>

      {/* Tabela */}
      <Card padding="none">
        <DataTable
          data={filteredProdutos}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum produto encontrado"
        />
      </Card>

      {/* Modal Edição */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Editar Produto - ${produtoEdit?.sku}`}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Nome do Produto"
            value={editForm.nome}
            onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
          />
          <Input
            label="Descrição"
            value={editForm.descricao}
            onChange={(e) => setEditForm({ ...editForm, descricao: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Preço Online"
              type="number"
              step="0.01"
              value={editForm.preco_online}
              onChange={(e) => setEditForm({ ...editForm, preco_online: e.target.value })}
            />
            <Input
              label="Preço Promocional"
              type="number"
              step="0.01"
              value={editForm.preco_promocional}
              onChange={(e) => setEditForm({ ...editForm, preco_promocional: e.target.value })}
              placeholder="Deixe vazio se não houver"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
            <Button onClick={handleSalvarEdicao}>Salvar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Publicar */}
      <Modal
        isOpen={showPublicarModal}
        onClose={() => setShowPublicarModal(false)}
        title="Publicar Produtos"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecione as plataformas para publicar os {selecionados.length} produto(s):
          </p>
          
          {[
            { key: 'nuvemshop', label: 'Nuvemshop', icon: '🛒' },
            { key: 'shopify', label: 'Shopify', icon: '🛍️' },
            { key: 'mercadolivre', label: 'Mercado Livre', icon: '🤝' },
          ].map((plat) => (
            <label key={plat.key} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={publicarForm[plat.key as keyof typeof publicarForm]}
                onChange={(e) => setPublicarForm({ ...publicarForm, [plat.key]: e.target.checked })}
              />
              <span className="text-xl">{plat.icon}</span>
              <span>{plat.label}</span>
            </label>
          ))}
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowPublicarModal(false)}>Cancelar</Button>
            <Button onClick={handlePublicar}>Publicar</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ProdutosOnlinePage;
