// =============================================
// PLANAC ERP - Unidades de Medida Page
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

interface Unidade {
  id: string;
  sigla: string;
  descricao: string;
  ativo: boolean;
  created_at: string;
}

interface UnidadeForm {
  sigla: string;
  descricao: string;
  ativo: boolean;
}

export function UnidadesPage() {
  const toast = useToast();
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<UnidadeForm>({
    sigla: '',
    descricao: '',
    ativo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Unidade[] }>('/unidades');
      if (response.success) {
        setUnidades(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar unidades');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({ sigla: '', descricao: '', ativo: true });
    setShowModal(true);
  };

  const handleEdit = (unidade: Unidade) => {
    setEditingId(unidade.id);
    setForm({
      sigla: unidade.sigla,
      descricao: unidade.descricao,
      ativo: unidade.ativo,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.sigla.trim()) {
      toast.error('Sigla e obrigatoria');
      return;
    }
    if (!form.descricao.trim()) {
      toast.error('Descricao e obrigatoria');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/unidades/${editingId}`, form);
        toast.success('Unidade atualizada com sucesso');
      } else {
        await api.post('/unidades', form);
        toast.success('Unidade criada com sucesso');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar unidade');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta unidade?')) return;

    try {
      await api.delete(`/unidades/${id}`);
      toast.success('Unidade excluida com sucesso');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir unidade');
    }
  };

  const handleToggleStatus = async (unidade: Unidade) => {
    try {
      await api.put(`/unidades/${unidade.id}`, { ativo: !unidade.ativo });
      toast.success(`Unidade ${unidade.ativo ? 'desativada' : 'ativada'} com sucesso`);
      loadData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const filteredUnidades = unidades.filter((u) => {
    const matchSearch = u.sigla.toLowerCase().includes(search.toLowerCase()) ||
      u.descricao.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter ||
      (statusFilter === 'ativo' && u.ativo) ||
      (statusFilter === 'inativo' && !u.ativo);
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      key: 'sigla',
      header: 'Sigla',
      width: '100px',
      sortable: true,
      render: (u: Unidade) => (
        <span className="font-mono font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded">
          {u.sigla}
        </span>
      ),
    },
    {
      key: 'descricao',
      header: 'Descricao',
      sortable: true,
      render: (u: Unidade) => (
        <span className="text-gray-900">{u.descricao}</span>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      render: (u: Unidade) => (
        <Badge variant={u.ativo ? 'success' : 'danger'} size="sm">
          {u.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const actions = (unidade: Unidade) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => handleEdit(unidade),
    },
    {
      label: unidade.ativo ? 'Desativar' : 'Ativar',
      icon: unidade.ativo ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />,
      onClick: () => handleToggleStatus(unidade),
    },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(unidade.id),
    },
  ];

  // Unidades comuns pre-definidas
  const unidadesComuns = [
    { sigla: 'UN', descricao: 'Unidade' },
    { sigla: 'KG', descricao: 'Quilograma' },
    { sigla: 'G', descricao: 'Grama' },
    { sigla: 'LT', descricao: 'Litro' },
    { sigla: 'ML', descricao: 'Mililitro' },
    { sigla: 'M', descricao: 'Metro' },
    { sigla: 'CM', descricao: 'Centimetro' },
    { sigla: 'M2', descricao: 'Metro Quadrado' },
    { sigla: 'M3', descricao: 'Metro Cubico' },
    { sigla: 'CX', descricao: 'Caixa' },
    { sigla: 'PC', descricao: 'Peca' },
    { sigla: 'PCT', descricao: 'Pacote' },
    { sigla: 'FD', descricao: 'Fardo' },
    { sigla: 'DZ', descricao: 'Duzia' },
    { sigla: 'PAR', descricao: 'Par' },
  ];

  const handleAddComum = async (sigla: string, descricao: string) => {
    if (unidades.some((u) => u.sigla === sigla)) {
      toast.error(`Unidade ${sigla} ja existe`);
      return;
    }

    try {
      await api.post('/unidades', { sigla, descricao, ativo: true });
      toast.success(`Unidade ${sigla} adicionada`);
      loadData();
    } catch (error) {
      toast.error('Erro ao adicionar unidade');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unidades de Medida</h1>
          <p className="text-gray-500">Gerencie as unidades de medida dos produtos</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={handleNew}
        >
          Nova Unidade
        </Button>
      </div>

      {/* Quick Add */}
      {unidades.length === 0 && !isLoading && (
        <Card>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">Adicione unidades comuns rapidamente:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {unidadesComuns.slice(0, 8).map((u) => (
                <Button
                  key={u.sigla}
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddComum(u.sigla, u.descricao)}
                >
                  {u.sigla}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <Input
              placeholder="Buscar por sigla ou descricao..."
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{unidades.length}</p>
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
                {unidades.filter((u) => u.ativo).length}
              </p>
              <p className="text-sm text-gray-500">Ativas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredUnidades}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma unidade encontrada"
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
                {editingId ? 'Editar Unidade' : 'Nova Unidade'}
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
                  Sigla *
                </label>
                <Input
                  value={form.sigla}
                  onChange={(e) => setForm({ ...form, sigla: e.target.value.toUpperCase() })}
                  placeholder="Ex: UN, KG, LT"
                  maxLength={10}
                />
                <p className="text-xs text-gray-500 mt-1">Maximo 10 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descricao *
                </label>
                <Input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Ex: Unidade, Quilograma, Litro"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ou selecione uma unidade comum:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {unidadesComuns.map((u) => (
                      <button
                        key={u.sigla}
                        type="button"
                        onClick={() => setForm({ ...form, sigla: u.sigla, descricao: u.descricao })}
                        className={`px-2 py-1 text-xs rounded border ${
                          form.sigla === u.sigla
                            ? 'bg-red-50 border-red-300 text-red-700'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {u.sigla}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded border-gray-300"
                />
                <label htmlFor="ativo" className="text-sm text-gray-700">
                  Unidade ativa
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

export default UnidadesPage;
