// =============================================
// PLANAC ERP - Tabelas de Preco Page
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

interface TabelaPreco {
  id: string;
  nome: string;
  descricao?: string;
  data_inicio?: string;
  data_fim?: string;
  ativo: boolean;
  created_at: string;
  itens_count?: number;
}

interface TabelaPrecoForm {
  nome: string;
  descricao: string;
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
}

export function TabelasPrecosPage() {
  const toast = useToast();
  const [tabelas, setTabelas] = useState<TabelaPreco[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<TabelaPrecoForm>({
    nome: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    ativo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get<{ success: boolean; data: TabelaPreco[] }>('/tabelas-preco');
      if (response.success) {
        setTabelas(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar tabelas de preco');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({ nome: '', descricao: '', data_inicio: '', data_fim: '', ativo: true });
    setShowModal(true);
  };

  const handleEdit = (tabela: TabelaPreco) => {
    setEditingId(tabela.id);
    setForm({
      nome: tabela.nome,
      descricao: tabela.descricao || '',
      data_inicio: tabela.data_inicio || '',
      data_fim: tabela.data_fim || '',
      ativo: tabela.ativo,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error('Nome da tabela e obrigatorio');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/tabelas-preco/${editingId}`, form);
        toast.success('Tabela atualizada com sucesso');
      } else {
        await api.post('/tabelas-preco', form);
        toast.success('Tabela criada com sucesso');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar tabela');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta tabela de preco?')) return;

    try {
      await api.delete(`/tabelas-preco/${id}`);
      toast.success('Tabela excluida com sucesso');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir tabela');
    }
  };

  const handleToggleStatus = async (tabela: TabelaPreco) => {
    try {
      await api.put(`/tabelas-preco/${tabela.id}`, { ativo: !tabela.ativo });
      toast.success(`Tabela ${tabela.ativo ? 'desativada' : 'ativada'} com sucesso`);
      loadData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const handleDuplicate = async (tabela: TabelaPreco) => {
    try {
      await api.post('/tabelas-preco', {
        nome: `${tabela.nome} (Copia)`,
        descricao: tabela.descricao,
        ativo: true,
      });
      toast.success('Tabela duplicada com sucesso');
      loadData();
    } catch (error) {
      toast.error('Erro ao duplicar tabela');
    }
  };

  const filteredTabelas = tabelas.filter((t) => {
    const matchSearch = t.nome.toLowerCase().includes(search.toLowerCase()) ||
      t.descricao?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter ||
      (statusFilter === 'ativo' && t.ativo) ||
      (statusFilter === 'inativo' && !t.ativo);
    return matchSearch && matchStatus;
  });

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const isVigente = (tabela: TabelaPreco) => {
    if (!tabela.ativo) return false;
    const hoje = new Date();
    if (tabela.data_inicio && new Date(tabela.data_inicio) > hoje) return false;
    if (tabela.data_fim && new Date(tabela.data_fim) < hoje) return false;
    return true;
  };

  const columns = [
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (t: TabelaPreco) => (
        <div>
          <p className="font-medium text-gray-900">{t.nome}</p>
          {t.descricao && (
            <p className="text-sm text-gray-500">{t.descricao}</p>
          )}
        </div>
      ),
    },
    {
      key: 'vigencia',
      header: 'Vigencia',
      render: (t: TabelaPreco) => (
        <div className="text-sm">
          <p className="text-gray-600">
            {t.data_inicio || t.data_fim ? (
              <>
                {formatDate(t.data_inicio)} - {formatDate(t.data_fim)}
              </>
            ) : (
              'Sem prazo'
            )}
          </p>
        </div>
      ),
    },
    {
      key: 'itens',
      header: 'Produtos',
      width: '100px',
      render: (t: TabelaPreco) => (
        <span className="text-gray-600">{t.itens_count || 0}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (t: TabelaPreco) => {
        if (!t.ativo) {
          return <Badge variant="danger" size="sm">Inativa</Badge>;
        }
        if (isVigente(t)) {
          return <Badge variant="success" size="sm">Vigente</Badge>;
        }
        return <Badge variant="warning" size="sm">Fora de Vigencia</Badge>;
      },
    },
  ];

  const actions = (tabela: TabelaPreco) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => handleEdit(tabela),
    },
    {
      label: 'Duplicar',
      icon: <Icons.copy className="w-4 h-4" />,
      onClick: () => handleDuplicate(tabela),
    },
    {
      label: tabela.ativo ? 'Desativar' : 'Ativar',
      icon: tabela.ativo ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />,
      onClick: () => handleToggleStatus(tabela),
    },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(tabela.id),
    },
  ];

  const tabelasVigentes = tabelas.filter(isVigente).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tabelas de Preco</h1>
          <p className="text-gray-500">Gerencie as tabelas de preco dos produtos</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={handleNew}
        >
          Nova Tabela
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
              <Icons.dollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{tabelas.length}</p>
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
              <p className="text-2xl font-bold text-gray-900">{tabelasVigentes}</p>
              <p className="text-sm text-gray-500">Vigentes</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Icons.clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {tabelas.filter((t) => t.ativo && !isVigente(t)).length}
              </p>
              <p className="text-sm text-gray-500">Fora de Vigencia</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredTabelas}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma tabela de preco encontrada"
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
                {editingId ? 'Editar Tabela de Preco' : 'Nova Tabela de Preco'}
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
                  placeholder="Ex: Tabela Varejo, Tabela Atacado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descricao
                </label>
                <Input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descricao da tabela"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Inicio
                  </label>
                  <Input
                    type="date"
                    value={form.data_inicio}
                    onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Fim
                  </label>
                  <Input
                    type="date"
                    value={form.data_fim}
                    onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Deixe em branco para tabela sem prazo de validade
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded border-gray-300"
                />
                <label htmlFor="ativo" className="text-sm text-gray-700">
                  Tabela ativa
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

export default TabelasPrecosPage;
