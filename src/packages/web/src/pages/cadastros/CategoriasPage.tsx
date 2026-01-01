// =============================================
// PLANAC ERP - Categorias de Produtos Page
// =============================================

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  categoria_pai_id?: string;
  categoria_pai_nome?: string;
  ativo: boolean;
  created_at: string;
}

interface CategoriaForm {
  nome: string;
  descricao: string;
  categoria_pai_id: string;
  ativo: boolean;
}

export function CategoriasPage() {
  const toast = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriasOptions, setCategoriasOptions] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<CategoriaForm>({
    nome: '',
    descricao: '',
    categoria_pai_id: '',
    ativo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Categoria[] }>('/categorias');
      if (response.success) {
        setCategorias(response.data);
        setCategoriasOptions([
          { value: '', label: 'Nenhuma (Raiz)' },
          ...response.data.map((c) => ({ value: c.id, label: c.nome })),
        ]);
      }
    } catch (error) {
      toast.error('Erro ao carregar categorias');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({ nome: '', descricao: '', categoria_pai_id: '', ativo: true });
    setShowModal(true);
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingId(categoria.id);
    setForm({
      nome: categoria.nome,
      descricao: categoria.descricao || '',
      categoria_pai_id: categoria.categoria_pai_id || '',
      ativo: categoria.ativo,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/categorias/${editingId}`, form);
        toast.success('Categoria atualizada com sucesso');
      } else {
        await api.post('/categorias', form);
        toast.success('Categoria criada com sucesso');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar categoria');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta categoria?')) return;

    try {
      await api.delete(`/categorias/${id}`);
      toast.success('Categoria excluída com sucesso');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleToggleStatus = async (categoria: Categoria) => {
    try {
      await api.put(`/categorias/${categoria.id}`, { ativo: !categoria.ativo });
      toast.success(`Categoria ${categoria.ativo ? 'desativada' : 'ativada'} com sucesso`);
      loadData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const filteredCategorias = categorias.filter((c) => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.descricao?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter ||
      (statusFilter === 'ativo' && c.ativo) ||
      (statusFilter === 'inativo' && !c.ativo);
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (c: Categoria) => (
        <div>
          <p className="font-medium text-gray-900">{c.nome}</p>
          {c.categoria_pai_nome && (
            <p className="text-sm text-gray-500">Subcategoria de: {c.categoria_pai_nome}</p>
          )}
        </div>
      ),
    },
    {
      key: 'descricao',
      header: 'Descricao',
      render: (c: Categoria) => (
        <span className="text-gray-600">{c.descricao || '-'}</span>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      render: (c: Categoria) => (
        <Badge variant={c.ativo ? 'success' : 'danger'} size="sm">
          {c.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const actions = (categoria: Categoria) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => handleEdit(categoria),
    },
    {
      label: categoria.ativo ? 'Desativar' : 'Ativar',
      icon: categoria.ativo ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />,
      onClick: () => handleToggleStatus(categoria),
    },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(categoria.id),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias de Produtos</h1>
          <p className="text-gray-500">Gerencie as categorias para organizar seus produtos</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={handleNew}
        >
          Nova Categoria
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <Input
              placeholder="Buscar por nome ou descricao..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.layers className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{categorias.length}</p>
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
                {categorias.filter((c) => c.ativo).length}
              </p>
              <p className="text-sm text-gray-500">Ativas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.layers className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {categorias.filter((c) => c.categoria_pai_id).length}
              </p>
              <p className="text-sm text-gray-500">Subcategorias</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredCategorias}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma categoria encontrada"
          onRowClick={handleEdit}
        />
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Icons.x className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome da categoria"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descricao
                </label>
                <Input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descricao da categoria"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria Pai
                </label>
                <Select
                  value={form.categoria_pai_id}
                  onChange={(value) => setForm({ ...form, categoria_pai_id: value })}
                  options={categoriasOptions.filter((c) => c.value !== editingId)}
                  placeholder="Selecione (opcional)"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded border-gray-300"
                />
                <label htmlFor="ativo" className="text-sm text-gray-700">
                  Categoria ativa
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} isLoading={isSaving}>
                {editingId ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CategoriasPage;
