// =============================================
// PLANAC ERP - Condicoes de Pagamento Page
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

interface CondicaoPagamento {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'avista' | 'prazo' | 'parcelado' | 'entrada_parcelas';
  parcelas: number;
  intervalo_dias: number;
  entrada: number;
  ativo: boolean;
  created_at: string;
}

interface CondicaoForm {
  nome: string;
  descricao: string;
  tipo: string;
  parcelas: number;
  intervalo_dias: number;
  entrada: number;
  ativo: boolean;
}

const tiposCondicao = [
  { value: 'avista', label: 'A Vista' },
  { value: 'prazo', label: 'A Prazo' },
  { value: 'parcelado', label: 'Parcelado' },
  { value: 'entrada_parcelas', label: 'Entrada + Parcelas' },
];

export function CondicoesPagamentoPage() {
  const toast = useToast();
  const [condicoes, setCondicoes] = useState<CondicaoPagamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<CondicaoForm>({
    nome: '',
    descricao: '',
    tipo: 'avista',
    parcelas: 1,
    intervalo_dias: 30,
    entrada: 0,
    ativo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get<{ success: boolean; data: CondicaoPagamento[] }>('/condicoes-pagamento');
      if (response.success) {
        setCondicoes(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar condicoes de pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({
      nome: '',
      descricao: '',
      tipo: 'avista',
      parcelas: 1,
      intervalo_dias: 30,
      entrada: 0,
      ativo: true,
    });
    setShowModal(true);
  };

  const handleEdit = (condicao: CondicaoPagamento) => {
    setEditingId(condicao.id);
    setForm({
      nome: condicao.nome,
      descricao: condicao.descricao || '',
      tipo: condicao.tipo,
      parcelas: condicao.parcelas,
      intervalo_dias: condicao.intervalo_dias,
      entrada: condicao.entrada,
      ativo: condicao.ativo,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error('Nome da condicao e obrigatorio');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/condicoes-pagamento/${editingId}`, form);
        toast.success('Condicao atualizada com sucesso');
      } else {
        await api.post('/condicoes-pagamento', form);
        toast.success('Condicao criada com sucesso');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar condicao');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta condicao de pagamento?')) return;

    try {
      await api.delete(`/condicoes-pagamento/${id}`);
      toast.success('Condicao excluida com sucesso');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir condicao');
    }
  };

  const handleToggleStatus = async (condicao: CondicaoPagamento) => {
    try {
      await api.put(`/condicoes-pagamento/${condicao.id}`, { ativo: !condicao.ativo });
      toast.success(`Condicao ${condicao.ativo ? 'desativada' : 'ativada'} com sucesso`);
      loadData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const filteredCondicoes = condicoes.filter((c) => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.descricao?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter ||
      (statusFilter === 'ativo' && c.ativo) ||
      (statusFilter === 'inativo' && !c.ativo);
    const matchTipo = !tipoFilter || c.tipo === tipoFilter;
    return matchSearch && matchStatus && matchTipo;
  });

  const getTipoLabel = (tipo: string) => {
    return tiposCondicao.find((t) => t.value === tipo)?.label || tipo;
  };

  const formatDescricaoCondicao = (c: CondicaoPagamento) => {
    if (c.tipo === 'avista') return 'Pagamento imediato';
    if (c.tipo === 'prazo') return `${c.intervalo_dias} dias`;
    if (c.tipo === 'parcelado') return `${c.parcelas}x de ${c.intervalo_dias} em ${c.intervalo_dias} dias`;
    if (c.tipo === 'entrada_parcelas') return `${c.entrada}% entrada + ${c.parcelas}x`;
    return '';
  };

  const columns = [
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (c: CondicaoPagamento) => (
        <div>
          <p className="font-medium text-gray-900">{c.nome}</p>
          {c.descricao && (
            <p className="text-sm text-gray-500">{c.descricao}</p>
          )}
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      width: '150px',
      render: (c: CondicaoPagamento) => (
        <Badge variant="info" size="sm">
          {getTipoLabel(c.tipo)}
        </Badge>
      ),
    },
    {
      key: 'detalhes',
      header: 'Detalhes',
      render: (c: CondicaoPagamento) => (
        <span className="text-gray-600">{formatDescricaoCondicao(c)}</span>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '100px',
      render: (c: CondicaoPagamento) => (
        <Badge variant={c.ativo ? 'success' : 'danger'} size="sm">
          {c.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const actions = (condicao: CondicaoPagamento) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => handleEdit(condicao),
    },
    {
      label: condicao.ativo ? 'Desativar' : 'Ativar',
      icon: condicao.ativo ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />,
      onClick: () => handleToggleStatus(condicao),
    },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(condicao.id),
    },
  ];

  // Condicoes comuns pre-definidas
  const condicoesComuns = [
    { nome: 'A Vista', tipo: 'avista', parcelas: 1, intervalo_dias: 0, entrada: 0 },
    { nome: '30 dias', tipo: 'prazo', parcelas: 1, intervalo_dias: 30, entrada: 0 },
    { nome: '30/60 dias', tipo: 'parcelado', parcelas: 2, intervalo_dias: 30, entrada: 0 },
    { nome: '30/60/90 dias', tipo: 'parcelado', parcelas: 3, intervalo_dias: 30, entrada: 0 },
    { nome: '50% entrada + 30 dias', tipo: 'entrada_parcelas', parcelas: 1, intervalo_dias: 30, entrada: 50 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Condicoes de Pagamento</h1>
          <p className="text-gray-500">Gerencie as condicoes de pagamento para vendas</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={handleNew}
        >
          Nova Condicao
        </Button>
      </div>

      {/* Quick Add */}
      {condicoes.length === 0 && !isLoading && (
        <Card>
          <div className="text-center py-4">
            <p className="text-gray-600 mb-4">Adicione condicoes comuns rapidamente:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {condicoesComuns.map((c) => (
                <Button
                  key={c.nome}
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    try {
                      await api.post('/condicoes-pagamento', { ...c, ativo: true });
                      toast.success(`Condicao "${c.nome}" adicionada`);
                      loadData();
                    } catch (error) {
                      toast.error('Erro ao adicionar condicao');
                    }
                  }}
                >
                  {c.nome}
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
              placeholder="Buscar por nome ou descricao..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              value={tipoFilter}
              onChange={setTipoFilter}
              options={[{ value: '', label: 'Todos os tipos' }, ...tiposCondicao]}
              placeholder="Tipo"
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
              <Icons.dollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{condicoes.length}</p>
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
                {condicoes.filter((c) => c.tipo === 'avista').length}
              </p>
              <p className="text-sm text-gray-500">A Vista</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {condicoes.filter((c) => c.tipo === 'prazo').length}
              </p>
              <p className="text-sm text-gray-500">A Prazo</p>
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
                {condicoes.filter((c) => c.tipo === 'parcelado' || c.tipo === 'entrada_parcelas').length}
              </p>
              <p className="text-sm text-gray-500">Parcelado</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredCondicoes}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma condicao de pagamento encontrada"
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
                {editingId ? 'Editar Condicao' : 'Nova Condicao de Pagamento'}
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
                  placeholder="Ex: 30/60/90 dias"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descricao
                </label>
                <Input
                  value={form.descricao}
                  onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                  placeholder="Descricao da condicao"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo *
                </label>
                <Select
                  value={form.tipo}
                  onChange={(value) => {
                    const newForm = { ...form, tipo: value };
                    if (value === 'avista') {
                      newForm.parcelas = 1;
                      newForm.intervalo_dias = 0;
                      newForm.entrada = 0;
                    }
                    setForm(newForm);
                  }}
                  options={tiposCondicao}
                />
              </div>

              {form.tipo !== 'avista' && (
                <div className="grid grid-cols-2 gap-4">
                  {(form.tipo === 'parcelado' || form.tipo === 'entrada_parcelas') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Parcelas
                      </label>
                      <Input
                        type="number"
                        min={1}
                        max={48}
                        value={form.parcelas}
                        onChange={(e) => setForm({ ...form, parcelas: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Intervalo (dias)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      value={form.intervalo_dias}
                      onChange={(e) => setForm({ ...form, intervalo_dias: parseInt(e.target.value) || 30 })}
                    />
                  </div>

                  {form.tipo === 'entrada_parcelas' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Entrada (%)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={form.entrada}
                        onChange={(e) => setForm({ ...form, entrada: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Preview */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  <strong>Preview:</strong> {formatDescricaoCondicao(form as CondicaoPagamento)}
                </p>
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
                  Condicao ativa
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

export default CondicoesPagamentoPage;
