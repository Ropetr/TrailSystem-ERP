// =============================================
// PLANAC ERP - Centros de Custo Page
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

interface CentroCusto {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  centro_pai_id?: string;
  centro_pai_nome?: string;
  centro_pai_codigo?: string;
  nivel: number;
  ativo: boolean;
  total_filhos?: number;
  created_at: string;
}

interface CentroCustoForm {
  codigo: string;
  nome: string;
  descricao: string;
  centro_pai_id: string;
  ativo: boolean;
}

export function CentrosCustoPage() {
  const toast = useToast();
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<CentroCustoForm>({
    codigo: '',
    nome: '',
    descricao: '',
    centro_pai_id: '',
    ativo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get<{ success: boolean; data: CentroCusto[] }>('/centros-custo');
      if (response.success) {
        setCentrosCusto(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar centros de custo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({
      codigo: '',
      nome: '',
      descricao: '',
      centro_pai_id: '',
      ativo: true,
    });
    setShowModal(true);
  };

  const handleEdit = (centro: CentroCusto) => {
    setEditingId(centro.id);
    setForm({
      codigo: centro.codigo,
      nome: centro.nome,
      descricao: centro.descricao || '',
      centro_pai_id: centro.centro_pai_id || '',
      ativo: centro.ativo,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.codigo.trim()) {
      toast.error('Codigo e obrigatorio');
      return;
    }
    if (!form.nome.trim()) {
      toast.error('Nome e obrigatorio');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        codigo: form.codigo,
        nome: form.nome,
        descricao: form.descricao || null,
        centro_pai_id: form.centro_pai_id || null,
        ativo: form.ativo,
      };

      if (editingId) {
        await api.put(`/centros-custo/${editingId}`, payload);
        toast.success('Centro de custo atualizado com sucesso');
      } else {
        await api.post('/centros-custo', payload);
        toast.success('Centro de custo criado com sucesso');
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar centro de custo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este centro de custo?')) return;

    try {
      await api.delete(`/centros-custo/${id}`);
      toast.success('Centro de custo excluido com sucesso');
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir centro de custo');
    }
  };

  const handleToggleStatus = async (centro: CentroCusto) => {
    try {
      await api.put(`/centros-custo/${centro.id}`, { ativo: !centro.ativo });
      toast.success(`Centro de custo ${centro.ativo ? 'desativado' : 'ativado'} com sucesso`);
      loadData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const filteredCentros = centrosCusto.filter((c) => {
    const matchSearch = c.codigo.toLowerCase().includes(search.toLowerCase()) ||
      c.nome.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter ||
      (statusFilter === 'ativo' && c.ativo) ||
      (statusFilter === 'inativo' && !c.ativo);
    return matchSearch && matchStatus;
  });

  // Opcoes de centro pai (excluindo o proprio centro em edicao)
  const centroPaiOptions = [
    { value: '', label: 'Nenhum (raiz)' },
    ...centrosCusto
      .filter((c) => c.id !== editingId && c.ativo)
      .map((c) => ({
        value: c.id,
        label: `${c.codigo} - ${c.nome}`,
      })),
  ];

  const columns = [
    {
      key: 'codigo',
      header: 'Codigo',
      width: '120px',
      sortable: true,
      render: (c: CentroCusto) => (
        <div className="flex items-center gap-2">
          {c.nivel > 1 && (
            <span className="text-gray-300" style={{ marginLeft: (c.nivel - 1) * 16 }}>
              └
            </span>
          )}
          <span className="font-mono font-medium text-gray-900">{c.codigo}</span>
        </div>
      ),
    },
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (c: CentroCusto) => (
        <div>
          <p className="font-medium text-gray-900">{c.nome}</p>
          {c.descricao && (
            <p className="text-sm text-gray-500 truncate max-w-xs">{c.descricao}</p>
          )}
        </div>
      ),
    },
    {
      key: 'centro_pai',
      header: 'Centro Pai',
      render: (c: CentroCusto) => (
        <span className="text-gray-600">
          {c.centro_pai_codigo ? `${c.centro_pai_codigo} - ${c.centro_pai_nome}` : '-'}
        </span>
      ),
    },
    {
      key: 'nivel',
      header: 'Nivel',
      width: '80px',
      render: (c: CentroCusto) => (
        <Badge variant="default" size="sm">
          Nivel {c.nivel}
        </Badge>
      ),
    },
    {
      key: 'filhos',
      header: 'Subcentros',
      width: '100px',
      render: (c: CentroCusto) => (
        <span className="text-gray-600">{c.total_filhos || 0}</span>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '90px',
      render: (c: CentroCusto) => (
        <Badge variant={c.ativo ? 'success' : 'danger'} size="sm">
          {c.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const actions = (centro: CentroCusto) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => handleEdit(centro),
    },
    {
      label: centro.ativo ? 'Desativar' : 'Ativar',
      icon: centro.ativo ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />,
      onClick: () => handleToggleStatus(centro),
    },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(centro.id),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Centros de Custo</h1>
          <p className="text-gray-500">Gerencie os centros de custo para controle financeiro</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={handleNew}
        >
          Novo Centro de Custo
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <Input
              placeholder="Buscar por codigo ou nome..."
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.fileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{centrosCusto.length}</p>
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
                {centrosCusto.filter((c) => c.ativo).length}
              </p>
              <p className="text-sm text-gray-500">Ativos</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.home className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {centrosCusto.filter((c) => c.nivel === 1).length}
              </p>
              <p className="text-sm text-gray-500">Raizes</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Icons.layers className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.max(...centrosCusto.map((c) => c.nivel), 0)}
              </p>
              <p className="text-sm text-gray-500">Niveis</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredCentros}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum centro de custo encontrado"
          onRowClick={handleEdit}
        />
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Editar Centro de Custo' : 'Novo Centro de Custo'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Icons.x className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Codigo *
                  </label>
                  <Input
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    placeholder="001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Centro Pai
                  </label>
                  <Select
                    value={form.centro_pai_id}
                    onChange={(value) => setForm({ ...form, centro_pai_id: value })}
                    options={centroPaiOptions}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome do centro de custo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descricao
                </label>
                <textarea
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  placeholder="Descricao do centro de custo..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="w-4 h-4 text-red-500 rounded focus:ring-red-500"
                />
                <label htmlFor="ativo" className="text-sm text-gray-700">
                  Centro de custo ativo
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} isLoading={isSaving}>
                {editingId ? 'Salvar Alteracoes' : 'Criar Centro de Custo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
