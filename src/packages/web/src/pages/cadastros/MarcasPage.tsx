// =============================================
// PLANAC ERP - Marcas de Produtos Page
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

interface Marca {
  id: string;
  nome: string;
  descricao?: string;
  logo_url?: string;
  ativo: boolean;
  created_at: string;
}

interface MarcaForm {
  nome: string;
  descricao: string;
  logo_url: string;
  ativo: boolean;
}

export function MarcasPage() {
  const toast = useToast();
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<MarcaForm>({
    nome: '',
    descricao: '',
    logo_url: '',
    ativo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Marca[] }>('/marcas');
      if (response.success) {
        setMarcas(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar marcas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({ nome: '', descricao: '', logo_url: '', ativo: true });
    setShowModal(true);
  };

  const handleEdit = (marca: Marca) => {
    setEditingId(marca.id);
    setForm({
      nome: marca.nome,
      descricao: marca.descricao || '',
      logo_url: marca.logo_url || '',
      ativo: marca.ativo,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error('Nome da marca e obrigatorio');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/marcas/${editingId}`, form);
        toast.success('Marca atualizada com sucesso');
      } else {
        await api.post('/marcas', form);
        toast.success('Marca criada com sucesso');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar marca');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta marca?')) return;

    try {
      await api.delete(`/marcas/${id}`);
      toast.success('Marca excluida com sucesso');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir marca');
    }
  };

  const handleToggleStatus = async (marca: Marca) => {
    try {
      await api.put(`/marcas/${marca.id}`, { ativo: !marca.ativo });
      toast.success(`Marca ${marca.ativo ? 'desativada' : 'ativada'} com sucesso`);
      loadData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const filteredMarcas = marcas.filter((m) => {
    const matchSearch = m.nome.toLowerCase().includes(search.toLowerCase()) ||
      m.descricao?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter ||
      (statusFilter === 'ativo' && m.ativo) ||
      (statusFilter === 'inativo' && !m.ativo);
    return matchSearch && matchStatus;
  });

  const columns = [
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (m: Marca) => (
        <div className="flex items-center gap-3">
          {m.logo_url ? (
            <img src={m.logo_url} alt={m.nome} className="w-8 h-8 rounded object-contain bg-gray-100" />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
              <Icons.package className="w-4 h-4 text-gray-400" />
            </div>
          )}
          <span className="font-medium text-gray-900">{m.nome}</span>
        </div>
      ),
    },
    {
      key: 'descricao',
      header: 'Descricao',
      render: (m: Marca) => (
        <span className="text-gray-600">{m.descricao || '-'}</span>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      render: (m: Marca) => (
        <Badge variant={m.ativo ? 'success' : 'danger'} size="sm">
          {m.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const actions = (marca: Marca) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => handleEdit(marca),
    },
    {
      label: marca.ativo ? 'Desativar' : 'Ativar',
      icon: marca.ativo ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />,
      onClick: () => handleToggleStatus(marca),
    },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(marca.id),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marcas</h1>
          <p className="text-gray-500">Gerencie as marcas dos seus produtos</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={handleNew}
        >
          Nova Marca
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{marcas.length}</p>
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
                {marcas.filter((m) => m.ativo).length}
              </p>
              <p className="text-sm text-gray-500">Ativas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredMarcas}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma marca encontrada"
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
                {editingId ? 'Editar Marca' : 'Nova Marca'}
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
                  placeholder="Nome da marca"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descricao
                </label>
                <Input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descricao da marca"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL do Logo
                </label>
                <Input
                  value={form.logo_url}
                  onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                  placeholder="https://exemplo.com/logo.png"
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
                  Marca ativa
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

export default MarcasPage;
