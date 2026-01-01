// =============================================
// PLANAC ERP - Vendedores Page
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

interface Vendedor {
  id: string;
  codigo?: string;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  celular?: string;
  comissao_padrao: number;
  meta_mensal?: number;
  usuario_id?: string;
  usuario_nome?: string;
  ativo: boolean;
  created_at: string;
}

interface VendedorForm {
  codigo: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  celular: string;
  comissao_padrao: number;
  meta_mensal: number;
  usuario_id: string;
  ativo: boolean;
}

export function VendedoresPage() {
  const toast = useToast();
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [usuarios, setUsuarios] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<VendedorForm>({
    codigo: '',
    nome: '',
    cpf: '',
    email: '',
    telefone: '',
    celular: '',
    comissao_padrao: 5,
    meta_mensal: 0,
    usuario_id: '',
    ativo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vendedoresRes, usuariosRes] = await Promise.all([
        api.get<{ success: boolean; data: Vendedor[] }>('/vendedores'),
        api.get<{ success: boolean; data: { id: string; nome: string }[] }>('/usuarios'),
      ]);

      if (vendedoresRes.success) {
        setVendedores(vendedoresRes.data);
      }
      if (usuariosRes.success) {
        setUsuarios([
          { value: '', label: 'Nenhum (externo)' },
          ...usuariosRes.data.map((u) => ({ value: u.id, label: u.nome })),
        ]);
      }
    } catch (error) {
      toast.error('Erro ao carregar vendedores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({
      codigo: '',
      nome: '',
      cpf: '',
      email: '',
      telefone: '',
      celular: '',
      comissao_padrao: 5,
      meta_mensal: 0,
      usuario_id: '',
      ativo: true,
    });
    setShowModal(true);
  };

  const handleEdit = (vendedor: Vendedor) => {
    setEditingId(vendedor.id);
    setForm({
      codigo: vendedor.codigo || '',
      nome: vendedor.nome,
      cpf: vendedor.cpf || '',
      email: vendedor.email || '',
      telefone: vendedor.telefone || '',
      celular: vendedor.celular || '',
      comissao_padrao: vendedor.comissao_padrao,
      meta_mensal: vendedor.meta_mensal || 0,
      usuario_id: vendedor.usuario_id || '',
      ativo: vendedor.ativo,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) {
      toast.error('Nome do vendedor e obrigatorio');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        await api.put(`/vendedores/${editingId}`, form);
        toast.success('Vendedor atualizado com sucesso');
      } else {
        await api.post('/vendedores', form);
        toast.success('Vendedor criado com sucesso');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar vendedor');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este vendedor?')) return;

    try {
      await api.delete(`/vendedores/${id}`);
      toast.success('Vendedor excluido com sucesso');
      loadData();
    } catch (error) {
      toast.error('Erro ao excluir vendedor');
    }
  };

  const handleToggleStatus = async (vendedor: Vendedor) => {
    try {
      await api.put(`/vendedores/${vendedor.id}`, { ativo: !vendedor.ativo });
      toast.success(`Vendedor ${vendedor.ativo ? 'desativado' : 'ativado'} com sucesso`);
      loadData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const filteredVendedores = vendedores.filter((v) => {
    const matchSearch = v.nome.toLowerCase().includes(search.toLowerCase()) ||
      v.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter ||
      (statusFilter === 'ativo' && v.ativo) ||
      (statusFilter === 'inativo' && !v.ativo);
    return matchSearch && matchStatus;
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
      header: 'Codigo',
      width: '80px',
      render: (v: Vendedor) => (
        <span className="font-mono text-sm text-gray-600">{v.codigo || '-'}</span>
      ),
    },
    {
      key: 'nome',
      header: 'Nome',
      sortable: true,
      render: (v: Vendedor) => (
        <div>
          <p className="font-medium text-gray-900">{v.nome}</p>
          {v.email && (
            <p className="text-sm text-gray-500">{v.email}</p>
          )}
        </div>
      ),
    },
    {
      key: 'contato',
      header: 'Contato',
      render: (v: Vendedor) => (
        <div className="text-sm">
          {v.celular && <p className="text-gray-600">{v.celular}</p>}
          {v.telefone && <p className="text-gray-500">{v.telefone}</p>}
          {!v.celular && !v.telefone && <span className="text-gray-400">-</span>}
        </div>
      ),
    },
    {
      key: 'comissao',
      header: 'Comissao',
      width: '100px',
      render: (v: Vendedor) => (
        <span className="font-medium text-green-600">{v.comissao_padrao}%</span>
      ),
    },
    {
      key: 'meta',
      header: 'Meta Mensal',
      width: '120px',
      render: (v: Vendedor) => (
        <span className="text-gray-600">
          {v.meta_mensal ? formatCurrency(v.meta_mensal) : '-'}
        </span>
      ),
    },
    {
      key: 'vinculo',
      header: 'Vinculo',
      width: '100px',
      render: (v: Vendedor) => (
        <Badge variant={v.usuario_id ? 'info' : 'default'} size="sm">
          {v.usuario_id ? 'Usuario' : 'Externo'}
        </Badge>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '90px',
      render: (v: Vendedor) => (
        <Badge variant={v.ativo ? 'success' : 'danger'} size="sm">
          {v.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const actions = (vendedor: Vendedor) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => handleEdit(vendedor),
    },
    {
      label: 'Ver Comissoes',
      icon: <Icons.dollarSign className="w-4 h-4" />,
      onClick: () => toast.info('Funcionalidade em desenvolvimento'),
    },
    {
      label: vendedor.ativo ? 'Desativar' : 'Ativar',
      icon: vendedor.ativo ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />,
      onClick: () => handleToggleStatus(vendedor),
    },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(vendedor.id),
    },
  ];

  const totalMeta = vendedores
    .filter((v) => v.ativo)
    .reduce((sum, v) => sum + (v.meta_mensal || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendedores</h1>
          <p className="text-gray-500">Gerencie sua equipe de vendas e representantes</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={handleNew}
        >
          Novo Vendedor
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <Input
              placeholder="Buscar por nome, codigo ou email..."
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
              <Icons.users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{vendedores.length}</p>
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
                {vendedores.filter((v) => v.ativo).length}
              </p>
              <p className="text-sm text-gray-500">Ativos</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.user className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {vendedores.filter((v) => v.usuario_id).length}
              </p>
              <p className="text-sm text-gray-500">Vinculados</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Icons.trending className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(totalMeta)}
              </p>
              <p className="text-sm text-gray-500">Meta Total</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredVendedores}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum vendedor encontrado"
          onRowClick={handleEdit}
        />
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Editar Vendedor' : 'Novo Vendedor'}
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
                    Codigo
                  </label>
                  <Input
                    value={form.codigo}
                    onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                    placeholder="001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CPF
                  </label>
                  <Input
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                    placeholder="000.000.000-00"
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
                  placeholder="Nome completo do vendedor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <Input
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    placeholder="(00) 0000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Celular
                  </label>
                  <Input
                    value={form.celular}
                    onChange={(e) => setForm({ ...form, celular: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comissao Padrao (%)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={form.comissao_padrao}
                    onChange={(e) => setForm({ ...form, comissao_padrao: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meta Mensal (R$)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    value={form.meta_mensal}
                    onChange={(e) => setForm({ ...form, meta_mensal: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vincular a Usuario do Sistema
                </label>
                <Select
                  value={form.usuario_id}
                  onChange={(value) => setForm({ ...form, usuario_id: value })}
                  options={usuarios}
                  placeholder="Selecione (opcional)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Vincule a um usuario para que ele veja apenas suas vendas
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
                  Vendedor ativo
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

export default VendedoresPage;
