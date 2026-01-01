// =============================================
// PLANAC ERP - Transportadoras Page
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

interface Transportadora {
  id: string;
  razao_social: string;
  nome_fantasia?: string;
  cnpj: string;
  inscricao_estadual?: string;
  rntrc?: string;
  tipo_frete: 'CIF' | 'FOB' | 'AMBOS';
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  contato?: string;
  site?: string;
  prazo_entrega_dias: number;
  valor_minimo_frete: number;
  percentual_frete: number;
  observacao?: string;
  ativo: boolean;
  created_at: string;
  regioes?: RegiaoAtendimento[];
}

interface RegiaoAtendimento {
  id: string;
  uf: string;
  cidade?: string;
  cep_inicial?: string;
  cep_final?: string;
  prazo_dias: number;
  valor_adicional: number;
}

interface TransportadoraForm {
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual: string;
  rntrc: string;
  tipo_frete: 'CIF' | 'FOB' | 'AMBOS';
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  telefone: string;
  celular: string;
  email: string;
  contato: string;
  site: string;
  prazo_entrega_dias: number;
  valor_minimo_frete: number;
  percentual_frete: number;
  observacao: string;
  ativo: boolean;
}

const UF_OPTIONS = [
  { value: '', label: 'Selecione' },
  { value: 'AC', label: 'AC' }, { value: 'AL', label: 'AL' }, { value: 'AP', label: 'AP' },
  { value: 'AM', label: 'AM' }, { value: 'BA', label: 'BA' }, { value: 'CE', label: 'CE' },
  { value: 'DF', label: 'DF' }, { value: 'ES', label: 'ES' }, { value: 'GO', label: 'GO' },
  { value: 'MA', label: 'MA' }, { value: 'MT', label: 'MT' }, { value: 'MS', label: 'MS' },
  { value: 'MG', label: 'MG' }, { value: 'PA', label: 'PA' }, { value: 'PB', label: 'PB' },
  { value: 'PR', label: 'PR' }, { value: 'PE', label: 'PE' }, { value: 'PI', label: 'PI' },
  { value: 'RJ', label: 'RJ' }, { value: 'RN', label: 'RN' }, { value: 'RS', label: 'RS' },
  { value: 'RO', label: 'RO' }, { value: 'RR', label: 'RR' }, { value: 'SC', label: 'SC' },
  { value: 'SP', label: 'SP' }, { value: 'SE', label: 'SE' }, { value: 'TO', label: 'TO' },
];

export function TransportadorasPage() {
  const toast = useToast();
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoFreteFilter, setTipoFreteFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'endereco' | 'frete' | 'regioes'>('dados');
  const [form, setForm] = useState<TransportadoraForm>({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    inscricao_estadual: '',
    rntrc: '',
    tipo_frete: 'AMBOS',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    telefone: '',
    celular: '',
    email: '',
    contato: '',
    site: '',
    prazo_entrega_dias: 0,
    valor_minimo_frete: 0,
    percentual_frete: 0,
    observacao: '',
    ativo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Transportadora[] }>('/transportadoras');
      if (response.success) {
        setTransportadoras(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar transportadoras');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({
      razao_social: '',
      nome_fantasia: '',
      cnpj: '',
      inscricao_estadual: '',
      rntrc: '',
      tipo_frete: 'AMBOS',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      telefone: '',
      celular: '',
      email: '',
      contato: '',
      site: '',
      prazo_entrega_dias: 0,
      valor_minimo_frete: 0,
      percentual_frete: 0,
      observacao: '',
      ativo: true,
    });
    setActiveTab('dados');
    setShowModal(true);
  };

  const handleEdit = async (transportadora: Transportadora) => {
    setEditingId(transportadora.id);
    setForm({
      razao_social: transportadora.razao_social,
      nome_fantasia: transportadora.nome_fantasia || '',
      cnpj: transportadora.cnpj,
      inscricao_estadual: transportadora.inscricao_estadual || '',
      rntrc: transportadora.rntrc || '',
      tipo_frete: transportadora.tipo_frete,
      cep: transportadora.cep || '',
      logradouro: transportadora.logradouro || '',
      numero: transportadora.numero || '',
      complemento: transportadora.complemento || '',
      bairro: transportadora.bairro || '',
      cidade: transportadora.cidade || '',
      uf: transportadora.uf || '',
      telefone: transportadora.telefone || '',
      celular: transportadora.celular || '',
      email: transportadora.email || '',
      contato: transportadora.contato || '',
      site: transportadora.site || '',
      prazo_entrega_dias: transportadora.prazo_entrega_dias,
      valor_minimo_frete: transportadora.valor_minimo_frete,
      percentual_frete: transportadora.percentual_frete,
      observacao: transportadora.observacao || '',
      ativo: transportadora.ativo,
    });
    setActiveTab('dados');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.razao_social.trim()) {
      toast.error('Razao social e obrigatoria');
      return;
    }
    if (!form.cnpj.trim()) {
      toast.error('CNPJ e obrigatorio');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        ...form,
        nome_fantasia: form.nome_fantasia || null,
        inscricao_estadual: form.inscricao_estadual || null,
        rntrc: form.rntrc || null,
        cep: form.cep || null,
        logradouro: form.logradouro || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        cidade: form.cidade || null,
        uf: form.uf || null,
        telefone: form.telefone || null,
        celular: form.celular || null,
        email: form.email || null,
        contato: form.contato || null,
        site: form.site || null,
        observacao: form.observacao || null,
      };

      if (editingId) {
        await api.put(`/transportadoras/${editingId}`, payload);
        toast.success('Transportadora atualizada com sucesso');
      } else {
        await api.post('/transportadoras', payload);
        toast.success('Transportadora criada com sucesso');
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar transportadora');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta transportadora?')) return;

    try {
      await api.delete(`/transportadoras/${id}`);
      toast.success('Transportadora excluida com sucesso');
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir transportadora');
    }
  };

  const handleToggleStatus = async (transportadora: Transportadora) => {
    try {
      await api.put(`/transportadoras/${transportadora.id}`, { ativo: !transportadora.ativo });
      toast.success(`Transportadora ${transportadora.ativo ? 'desativada' : 'ativada'} com sucesso`);
      loadData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const filteredTransportadoras = transportadoras.filter((t) => {
    const matchSearch = t.razao_social.toLowerCase().includes(search.toLowerCase()) ||
      t.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) ||
      t.cnpj.includes(search);
    const matchStatus = !statusFilter ||
      (statusFilter === 'ativo' && t.ativo) ||
      (statusFilter === 'inativo' && !t.ativo);
    const matchTipoFrete = !tipoFreteFilter ||
      t.tipo_frete === tipoFreteFilter ||
      t.tipo_frete === 'AMBOS';
    return matchSearch && matchStatus && matchTipoFrete;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const columns = [
    {
      key: 'razao_social',
      header: 'Transportadora',
      sortable: true,
      render: (t: Transportadora) => (
        <div>
          <p className="font-medium text-gray-900">{t.razao_social}</p>
          {t.nome_fantasia && (
            <p className="text-sm text-gray-500">{t.nome_fantasia}</p>
          )}
        </div>
      ),
    },
    {
      key: 'cnpj',
      header: 'CNPJ',
      width: '150px',
      render: (t: Transportadora) => (
        <span className="font-mono text-sm text-gray-600">{t.cnpj}</span>
      ),
    },
    {
      key: 'cidade',
      header: 'Cidade/UF',
      render: (t: Transportadora) => (
        <span className="text-gray-600">
          {t.cidade && t.uf ? `${t.cidade}/${t.uf}` : '-'}
        </span>
      ),
    },
    {
      key: 'tipo_frete',
      header: 'Tipo Frete',
      width: '100px',
      render: (t: Transportadora) => (
        <Badge variant={t.tipo_frete === 'CIF' ? 'info' : t.tipo_frete === 'FOB' ? 'warning' : 'default'} size="sm">
          {t.tipo_frete}
        </Badge>
      ),
    },
    {
      key: 'prazo',
      header: 'Prazo',
      width: '80px',
      render: (t: Transportadora) => (
        <span className="text-gray-600">{t.prazo_entrega_dias} dias</span>
      ),
    },
    {
      key: 'frete',
      header: 'Frete Min.',
      width: '120px',
      render: (t: Transportadora) => (
        <span className="text-gray-600">{formatCurrency(t.valor_minimo_frete)}</span>
      ),
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '90px',
      render: (t: Transportadora) => (
        <Badge variant={t.ativo ? 'success' : 'danger'} size="sm">
          {t.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const actions = (transportadora: Transportadora) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => handleEdit(transportadora),
    },
    {
      label: transportadora.ativo ? 'Desativar' : 'Ativar',
      icon: transportadora.ativo ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />,
      onClick: () => handleToggleStatus(transportadora),
    },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(transportadora.id),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transportadoras</h1>
          <p className="text-gray-500">Gerencie as transportadoras para entregas</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={handleNew}
        >
          Nova Transportadora
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <Input
              placeholder="Buscar por nome, fantasia ou CNPJ..."
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
          <div className="w-36">
            <Select
              value={tipoFreteFilter}
              onChange={setTipoFreteFilter}
              options={[
                { value: '', label: 'Todos' },
                { value: 'CIF', label: 'CIF' },
                { value: 'FOB', label: 'FOB' },
              ]}
              placeholder="Tipo Frete"
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
              <p className="text-2xl font-bold text-gray-900">{transportadoras.length}</p>
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
                {transportadoras.filter((t) => t.ativo).length}
              </p>
              <p className="text-sm text-gray-500">Ativas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {transportadoras.filter((t) => t.tipo_frete === 'CIF' || t.tipo_frete === 'AMBOS').length}
              </p>
              <p className="text-sm text-gray-500">CIF</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Icons.dollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {transportadoras.filter((t) => t.tipo_frete === 'FOB' || t.tipo_frete === 'AMBOS').length}
              </p>
              <p className="text-sm text-gray-500">FOB</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredTransportadoras}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma transportadora encontrada"
          onRowClick={handleEdit}
        />
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-3xl p-6 m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingId ? 'Editar Transportadora' : 'Nova Transportadora'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <Icons.x className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              {[
                { id: 'dados', label: 'Dados Gerais' },
                { id: 'endereco', label: 'Endereco' },
                { id: 'frete', label: 'Frete' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {activeTab === 'dados' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Razao Social *
                      </label>
                      <Input
                        value={form.razao_social}
                        onChange={(e) => setForm({ ...form, razao_social: e.target.value })}
                        placeholder="Razao social da transportadora"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome Fantasia
                      </label>
                      <Input
                        value={form.nome_fantasia}
                        onChange={(e) => setForm({ ...form, nome_fantasia: e.target.value })}
                        placeholder="Nome fantasia"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CNPJ *
                      </label>
                      <Input
                        value={form.cnpj}
                        onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                        placeholder="00.000.000/0000-00"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Inscricao Estadual
                      </label>
                      <Input
                        value={form.inscricao_estadual}
                        onChange={(e) => setForm({ ...form, inscricao_estadual: e.target.value })}
                        placeholder="ISENTO ou numero"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        RNTRC
                      </label>
                      <Input
                        value={form.rntrc}
                        onChange={(e) => setForm({ ...form, rntrc: e.target.value })}
                        placeholder="Registro ANTT"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo de Frete
                      </label>
                      <Select
                        value={form.tipo_frete}
                        onChange={(value) => setForm({ ...form, tipo_frete: value as any })}
                        options={[
                          { value: 'AMBOS', label: 'CIF e FOB' },
                          { value: 'CIF', label: 'Apenas CIF' },
                          { value: 'FOB', label: 'Apenas FOB' },
                        ]}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <Input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="email@transportadora.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contato
                      </label>
                      <Input
                        value={form.contato}
                        onChange={(e) => setForm({ ...form, contato: e.target.value })}
                        placeholder="Nome do contato"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Site
                      </label>
                      <Input
                        value={form.site}
                        onChange={(e) => setForm({ ...form, site: e.target.value })}
                        placeholder="https://www.transportadora.com.br"
                      />
                    </div>
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
                      Transportadora ativa
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'endereco' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CEP
                      </label>
                      <Input
                        value={form.cep}
                        onChange={(e) => setForm({ ...form, cep: e.target.value })}
                        placeholder="00000-000"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Logradouro
                      </label>
                      <Input
                        value={form.logradouro}
                        onChange={(e) => setForm({ ...form, logradouro: e.target.value })}
                        placeholder="Rua, Avenida, etc."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numero
                      </label>
                      <Input
                        value={form.numero}
                        onChange={(e) => setForm({ ...form, numero: e.target.value })}
                        placeholder="123"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Complemento
                      </label>
                      <Input
                        value={form.complemento}
                        onChange={(e) => setForm({ ...form, complemento: e.target.value })}
                        placeholder="Sala, Galpao, etc."
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bairro
                      </label>
                      <Input
                        value={form.bairro}
                        onChange={(e) => setForm({ ...form, bairro: e.target.value })}
                        placeholder="Bairro"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cidade
                      </label>
                      <Input
                        value={form.cidade}
                        onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                        placeholder="Cidade"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        UF
                      </label>
                      <Select
                        value={form.uf}
                        onChange={(value) => setForm({ ...form, uf: value })}
                        options={UF_OPTIONS}
                      />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'frete' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prazo de Entrega (dias)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        value={form.prazo_entrega_dias}
                        onChange={(e) => setForm({ ...form, prazo_entrega_dias: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor Minimo Frete (R$)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={form.valor_minimo_frete}
                        onChange={(e) => setForm({ ...form, valor_minimo_frete: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Percentual Frete (%)
                      </label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={form.percentual_frete}
                        onChange={(e) => setForm({ ...form, percentual_frete: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observacoes
                    </label>
                    <textarea
                      value={form.observacao}
                      onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      placeholder="Observacoes sobre a transportadora..."
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Calculo do frete:</strong> O valor do frete sera o maior entre o valor minimo e o percentual sobre o valor da mercadoria.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
              <Button variant="ghost" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} isLoading={isSaving}>
                {editingId ? 'Salvar Alteracoes' : 'Criar Transportadora'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
