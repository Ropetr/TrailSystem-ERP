// =============================================
// PLANAC ERP - Veiculos Page
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

interface Veiculo {
  id: string;
  placa: string;
  renavam?: string;
  chassi?: string;
  marca?: string;
  modelo?: string;
  ano_fabricacao?: number;
  ano_modelo?: number;
  cor?: string;
  tipo: 'PROPRIO' | 'TERCEIRO' | 'AGREGADO' | 'LOCADO';
  categoria: 'CARRO' | 'MOTO' | 'VAN' | 'CAMINHAO' | 'CARRETA';
  capacidade_kg?: number;
  capacidade_m3?: number;
  km_atual?: number;
  data_aquisicao?: string;
  valor_aquisicao?: number;
  vencimento_ipva?: string;
  vencimento_licenciamento?: string;
  vencimento_seguro?: string;
  transportadora_id?: string;
  transportadora_nome?: string;
  motorista_atual_nome?: string;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  total_entregas?: number;
}

interface VeiculoForm {
  placa: string;
  renavam: string;
  chassi: string;
  marca: string;
  modelo: string;
  ano_fabricacao: number | '';
  ano_modelo: number | '';
  cor: string;
  tipo: 'PROPRIO' | 'TERCEIRO' | 'AGREGADO' | 'LOCADO';
  categoria: 'CARRO' | 'MOTO' | 'VAN' | 'CAMINHAO' | 'CARRETA';
  capacidade_kg: number | '';
  capacidade_m3: number | '';
  km_atual: number | '';
  data_aquisicao: string;
  valor_aquisicao: number | '';
  vencimento_ipva: string;
  vencimento_licenciamento: string;
  vencimento_seguro: string;
  transportadora_id: string;
  observacoes: string;
  ativo: boolean;
}

interface Transportadora {
  id: string;
  razao_social: string;
}

const TIPO_OPTIONS = [
  { value: 'PROPRIO', label: 'Proprio' },
  { value: 'TERCEIRO', label: 'Terceiro' },
  { value: 'AGREGADO', label: 'Agregado' },
  { value: 'LOCADO', label: 'Locado' },
];

const CATEGORIA_OPTIONS = [
  { value: 'CARRO', label: 'Carro' },
  { value: 'MOTO', label: 'Moto' },
  { value: 'VAN', label: 'Van' },
  { value: 'CAMINHAO', label: 'Caminhao' },
  { value: 'CARRETA', label: 'Carreta' },
];

export function VeiculosPage() {
  const toast = useToast();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [transportadoras, setTransportadoras] = useState<Transportadora[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'dados' | 'documentos' | 'capacidade'>('dados');
  const [form, setForm] = useState<VeiculoForm>({
    placa: '',
    renavam: '',
    chassi: '',
    marca: '',
    modelo: '',
    ano_fabricacao: '',
    ano_modelo: '',
    cor: '',
    tipo: 'PROPRIO',
    categoria: 'CAMINHAO',
    capacidade_kg: '',
    capacidade_m3: '',
    km_atual: '',
    data_aquisicao: '',
    valor_aquisicao: '',
    vencimento_ipva: '',
    vencimento_licenciamento: '',
    vencimento_seguro: '',
    transportadora_id: '',
    observacoes: '',
    ativo: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [veiculosRes, transportadorasRes] = await Promise.all([
        api.get<{ success: boolean; data: Veiculo[] }>('/veiculos'),
        api.get<{ success: boolean; data: Transportadora[] }>('/transportadoras?ativo=true'),
      ]);

      if (veiculosRes.success) {
        setVeiculos(veiculosRes.data);
      }
      if (transportadorasRes.success) {
        setTransportadoras(transportadorasRes.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar veiculos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setForm({
      placa: '',
      renavam: '',
      chassi: '',
      marca: '',
      modelo: '',
      ano_fabricacao: '',
      ano_modelo: '',
      cor: '',
      tipo: 'PROPRIO',
      categoria: 'CAMINHAO',
      capacidade_kg: '',
      capacidade_m3: '',
      km_atual: '',
      data_aquisicao: '',
      valor_aquisicao: '',
      vencimento_ipva: '',
      vencimento_licenciamento: '',
      vencimento_seguro: '',
      transportadora_id: '',
      observacoes: '',
      ativo: true,
    });
    setActiveTab('dados');
    setShowModal(true);
  };

  const handleEdit = (veiculo: Veiculo) => {
    setEditingId(veiculo.id);
    setForm({
      placa: veiculo.placa,
      renavam: veiculo.renavam || '',
      chassi: veiculo.chassi || '',
      marca: veiculo.marca || '',
      modelo: veiculo.modelo || '',
      ano_fabricacao: veiculo.ano_fabricacao || '',
      ano_modelo: veiculo.ano_modelo || '',
      cor: veiculo.cor || '',
      tipo: veiculo.tipo,
      categoria: veiculo.categoria,
      capacidade_kg: veiculo.capacidade_kg || '',
      capacidade_m3: veiculo.capacidade_m3 || '',
      km_atual: veiculo.km_atual || '',
      data_aquisicao: veiculo.data_aquisicao || '',
      valor_aquisicao: veiculo.valor_aquisicao || '',
      vencimento_ipva: veiculo.vencimento_ipva || '',
      vencimento_licenciamento: veiculo.vencimento_licenciamento || '',
      vencimento_seguro: veiculo.vencimento_seguro || '',
      transportadora_id: veiculo.transportadora_id || '',
      observacoes: veiculo.observacoes || '',
      ativo: veiculo.ativo,
    });
    setActiveTab('dados');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.placa.trim()) {
      toast.error('Placa e obrigatoria');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        placa: form.placa.toUpperCase(),
        renavam: form.renavam || null,
        chassi: form.chassi || null,
        marca: form.marca || null,
        modelo: form.modelo || null,
        ano_fabricacao: form.ano_fabricacao || null,
        ano_modelo: form.ano_modelo || null,
        cor: form.cor || null,
        tipo: form.tipo,
        categoria: form.categoria,
        capacidade_kg: form.capacidade_kg || null,
        capacidade_m3: form.capacidade_m3 || null,
        km_atual: form.km_atual || null,
        data_aquisicao: form.data_aquisicao || null,
        valor_aquisicao: form.valor_aquisicao || null,
        vencimento_ipva: form.vencimento_ipva || null,
        vencimento_licenciamento: form.vencimento_licenciamento || null,
        vencimento_seguro: form.vencimento_seguro || null,
        transportadora_id: form.transportadora_id || null,
        observacoes: form.observacoes || null,
        ativo: form.ativo,
      };

      if (editingId) {
        await api.put(`/veiculos/${editingId}`, payload);
        toast.success('Veiculo atualizado com sucesso');
      } else {
        await api.post('/veiculos', payload);
        toast.success('Veiculo criado com sucesso');
      }
      setShowModal(false);
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar veiculo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este veiculo?')) return;

    try {
      await api.delete(`/veiculos/${id}`);
      toast.success('Veiculo excluido com sucesso');
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao excluir veiculo');
    }
  };

  const handleToggleStatus = async (veiculo: Veiculo) => {
    try {
      await api.put(`/veiculos/${veiculo.id}`, { ativo: !veiculo.ativo });
      toast.success(`Veiculo ${veiculo.ativo ? 'desativado' : 'ativado'} com sucesso`);
      loadData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const filteredVeiculos = veiculos.filter((v) => {
    const matchSearch = v.placa.toLowerCase().includes(search.toLowerCase()) ||
      v.modelo?.toLowerCase().includes(search.toLowerCase()) ||
      v.marca?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter ||
      (statusFilter === 'ativo' && v.ativo) ||
      (statusFilter === 'inativo' && !v.ativo);
    const matchTipo = !tipoFilter || v.tipo === tipoFilter;
    const matchCategoria = !categoriaFilter || v.categoria === categoriaFilter;
    return matchSearch && matchStatus && matchTipo && matchCategoria;
  });

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

  const isDocumentoVencendo = (data?: string) => {
    if (!data) return false;
    const vencimento = new Date(data);
    const hoje = new Date();
    const diff = (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= 30 && diff >= 0;
  };

  const isDocumentoVencido = (data?: string) => {
    if (!data) return false;
    const vencimento = new Date(data);
    const hoje = new Date();
    return vencimento < hoje;
  };

  const columns = [
    {
      key: 'placa',
      header: 'Placa',
      width: '100px',
      render: (v: Veiculo) => (
        <span className="font-mono font-bold text-gray-900">{v.placa}</span>
      ),
    },
    {
      key: 'veiculo',
      header: 'Veiculo',
      sortable: true,
      render: (v: Veiculo) => (
        <div>
          <p className="font-medium text-gray-900">
            {v.marca} {v.modelo}
          </p>
          {v.ano_modelo && (
            <p className="text-sm text-gray-500">{v.ano_fabricacao}/{v.ano_modelo}</p>
          )}
        </div>
      ),
    },
    {
      key: 'tipo',
      header: 'Tipo',
      width: '100px',
      render: (v: Veiculo) => (
        <Badge variant={v.tipo === 'PROPRIO' ? 'success' : v.tipo === 'TERCEIRO' ? 'warning' : 'info'} size="sm">
          {v.tipo}
        </Badge>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoria',
      width: '100px',
      render: (v: Veiculo) => (
        <span className="text-gray-600">{v.categoria}</span>
      ),
    },
    {
      key: 'km',
      header: 'KM Atual',
      width: '100px',
      render: (v: Veiculo) => (
        <span className="text-gray-600">
          {v.km_atual ? v.km_atual.toLocaleString('pt-BR') : '-'}
        </span>
      ),
    },
    {
      key: 'motorista',
      header: 'Motorista',
      render: (v: Veiculo) => (
        <span className="text-gray-600">{v.motorista_atual_nome || '-'}</span>
      ),
    },
    {
      key: 'documentos',
      header: 'Documentos',
      width: '120px',
      render: (v: Veiculo) => {
        const vencido = isDocumentoVencido(v.vencimento_ipva) || 
                        isDocumentoVencido(v.vencimento_licenciamento) || 
                        isDocumentoVencido(v.vencimento_seguro);
        const vencendo = isDocumentoVencendo(v.vencimento_ipva) || 
                         isDocumentoVencendo(v.vencimento_licenciamento) || 
                         isDocumentoVencendo(v.vencimento_seguro);
        
        if (vencido) {
          return <Badge variant="danger" size="sm">Vencido</Badge>;
        }
        if (vencendo) {
          return <Badge variant="warning" size="sm">Vencendo</Badge>;
        }
        return <Badge variant="success" size="sm">Regular</Badge>;
      },
    },
    {
      key: 'ativo',
      header: 'Status',
      width: '90px',
      render: (v: Veiculo) => (
        <Badge variant={v.ativo ? 'success' : 'danger'} size="sm">
          {v.ativo ? 'Ativo' : 'Inativo'}
        </Badge>
      ),
    },
  ];

  const actions = (veiculo: Veiculo) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => handleEdit(veiculo),
    },
    {
      label: veiculo.ativo ? 'Desativar' : 'Ativar',
      icon: veiculo.ativo ? <Icons.x className="w-4 h-4" /> : <Icons.check className="w-4 h-4" />,
      onClick: () => handleToggleStatus(veiculo),
    },
    {
      label: 'Excluir',
      icon: <Icons.trash className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleDelete(veiculo.id),
    },
  ];

  const transportadoraOptions = [
    { value: '', label: 'Nenhuma' },
    ...transportadoras.map((t) => ({ value: t.id, label: t.razao_social })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Veiculos</h1>
          <p className="text-gray-500">Gerencie a frota de veiculos</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={handleNew}
        >
          Novo Veiculo
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[250px]">
            <Input
              placeholder="Buscar por placa, marca ou modelo..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-32">
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
          <div className="w-32">
            <Select
              value={tipoFilter}
              onChange={setTipoFilter}
              options={[{ value: '', label: 'Todos' }, ...TIPO_OPTIONS]}
              placeholder="Tipo"
            />
          </div>
          <div className="w-32">
            <Select
              value={categoriaFilter}
              onChange={setCategoriaFilter}
              options={[{ value: '', label: 'Todas' }, ...CATEGORIA_OPTIONS]}
              placeholder="Categoria"
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
              <p className="text-2xl font-bold text-gray-900">{veiculos.length}</p>
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
                {veiculos.filter((v) => v.ativo).length}
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
                {veiculos.filter((v) => v.tipo === 'PROPRIO').length}
              </p>
              <p className="text-sm text-gray-500">Proprios</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Icons.alertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {veiculos.filter((v) => 
                  isDocumentoVencido(v.vencimento_ipva) || 
                  isDocumentoVencido(v.vencimento_licenciamento) || 
                  isDocumentoVencido(v.vencimento_seguro) ||
                  isDocumentoVencendo(v.vencimento_ipva) || 
                  isDocumentoVencendo(v.vencimento_licenciamento) || 
                  isDocumentoVencendo(v.vencimento_seguro)
                ).length}
              </p>
              <p className="text-sm text-gray-500">Alertas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredVeiculos}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum veiculo encontrado"
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
                {editingId ? 'Editar Veiculo' : 'Novo Veiculo'}
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
                { id: 'documentos', label: 'Documentos' },
                { id: 'capacidade', label: 'Capacidade' },
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
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Placa *
                      </label>
                      <Input
                        value={form.placa}
                        onChange={(e) => setForm({ ...form, placa: e.target.value.toUpperCase() })}
                        placeholder="ABC1D23"
                        maxLength={8}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Renavam
                      </label>
                      <Input
                        value={form.renavam}
                        onChange={(e) => setForm({ ...form, renavam: e.target.value })}
                        placeholder="00000000000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chassi
                      </label>
                      <Input
                        value={form.chassi}
                        onChange={(e) => setForm({ ...form, chassi: e.target.value.toUpperCase() })}
                        placeholder="9BWZZZ377VT004251"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Marca
                      </label>
                      <Input
                        value={form.marca}
                        onChange={(e) => setForm({ ...form, marca: e.target.value })}
                        placeholder="Volkswagen"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Modelo
                      </label>
                      <Input
                        value={form.modelo}
                        onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                        placeholder="Delivery 11.180"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cor
                      </label>
                      <Input
                        value={form.cor}
                        onChange={(e) => setForm({ ...form, cor: e.target.value })}
                        placeholder="Branco"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ano Fab.
                      </label>
                      <Input
                        type="number"
                        value={form.ano_fabricacao}
                        onChange={(e) => setForm({ ...form, ano_fabricacao: e.target.value ? parseInt(e.target.value) : '' })}
                        placeholder="2024"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ano Modelo
                      </label>
                      <Input
                        type="number"
                        value={form.ano_modelo}
                        onChange={(e) => setForm({ ...form, ano_modelo: e.target.value ? parseInt(e.target.value) : '' })}
                        placeholder="2025"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <Select
                        value={form.tipo}
                        onChange={(value) => setForm({ ...form, tipo: value as any })}
                        options={TIPO_OPTIONS}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria
                      </label>
                      <Select
                        value={form.categoria}
                        onChange={(value) => setForm({ ...form, categoria: value as any })}
                        options={CATEGORIA_OPTIONS}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Transportadora
                      </label>
                      <Select
                        value={form.transportadora_id}
                        onChange={(value) => setForm({ ...form, transportadora_id: value })}
                        options={transportadoraOptions}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        KM Atual
                      </label>
                      <Input
                        type="number"
                        value={form.km_atual}
                        onChange={(e) => setForm({ ...form, km_atual: e.target.value ? parseInt(e.target.value) : '' })}
                        placeholder="0"
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
                      Veiculo ativo
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'documentos' && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vencimento IPVA
                      </label>
                      <Input
                        type="date"
                        value={form.vencimento_ipva}
                        onChange={(e) => setForm({ ...form, vencimento_ipva: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vencimento Licenciamento
                      </label>
                      <Input
                        type="date"
                        value={form.vencimento_licenciamento}
                        onChange={(e) => setForm({ ...form, vencimento_licenciamento: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vencimento Seguro
                      </label>
                      <Input
                        type="date"
                        value={form.vencimento_seguro}
                        onChange={(e) => setForm({ ...form, vencimento_seguro: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data de Aquisicao
                      </label>
                      <Input
                        type="date"
                        value={form.data_aquisicao}
                        onChange={(e) => setForm({ ...form, data_aquisicao: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Valor de Aquisicao (R$)
                      </label>
                      <Input
                        type="number"
                        step={0.01}
                        value={form.valor_aquisicao}
                        onChange={(e) => setForm({ ...form, valor_aquisicao: e.target.value ? parseFloat(e.target.value) : '' })}
                        placeholder="0,00"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Icons.alertTriangle className="w-5 h-5" />
                      <span className="font-medium">Alertas de Documentos</span>
                    </div>
                    <p className="text-sm text-amber-600 mt-1">
                      O sistema alertara automaticamente quando os documentos estiverem proximos do vencimento (30 dias).
                    </p>
                  </div>
                </>
              )}

              {activeTab === 'capacidade' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacidade (kg)
                      </label>
                      <Input
                        type="number"
                        value={form.capacidade_kg}
                        onChange={(e) => setForm({ ...form, capacidade_kg: e.target.value ? parseFloat(e.target.value) : '' })}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacidade (m3)
                      </label>
                      <Input
                        type="number"
                        step={0.1}
                        value={form.capacidade_m3}
                        onChange={(e) => setForm({ ...form, capacidade_m3: e.target.value ? parseFloat(e.target.value) : '' })}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observacoes
                    </label>
                    <textarea
                      value={form.observacoes}
                      onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      placeholder="Observacoes sobre o veiculo..."
                    />
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
                {editingId ? 'Salvar Alteracoes' : 'Criar Veiculo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
