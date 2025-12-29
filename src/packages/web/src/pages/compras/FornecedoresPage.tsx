// =============================================
// PLANAC ERP - Cadastro de Fornecedores
// =============================================

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface Fornecedor {
  id: string;
  codigo: string;
  razao_social: string;
  nome_fantasia: string;
  cnpj: string;
  inscricao_estadual?: string;
  email: string;
  telefone: string;
  celular?: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  categorias: string[];
  condicao_pagamento_padrao?: string;
  prazo_entrega_medio?: number;
  status: 'ativo' | 'inativo' | 'bloqueado';
  avaliacao: number;
  total_compras: number;
  ultima_compra?: string;
  contato_nome?: string;
  contato_cargo?: string;
  observacao?: string;
}

const statusConfig = {
  ativo: { label: 'Ativo', variant: 'success' as const },
  inativo: { label: 'Inativo', variant: 'default' as const },
  bloqueado: { label: 'Bloqueado', variant: 'danger' as const },
};

const categoriasOptions = [
  'Materiais de Construção',
  'Drywall',
  'Ferramentas',
  'EPI',
  'Elétrica',
  'Hidráulica',
  'Acabamentos',
  'Outros',
];

export function FornecedoresPage() {
  const toast = useToast();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  
  // Modal de cadastro/edição
  const [showFormModal, setShowFormModal] = useState(false);
  const [fornecedorEdit, setFornecedorEdit] = useState<Fornecedor | null>(null);
  const [formTab, setFormTab] = useState('dados');
  const [formData, setFormData] = useState({
    razao_social: '',
    nome_fantasia: '',
    cnpj: '',
    inscricao_estadual: '',
    email: '',
    telefone: '',
    celular: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    categorias: [] as string[],
    condicao_pagamento_padrao: '',
    contato_nome: '',
    contato_cargo: '',
    observacao: '',
  });

  useEffect(() => {
    loadFornecedores();
  }, []);

  const loadFornecedores = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Fornecedor[] }>('/compras/fornecedores');
      if (response.success) {
        setFornecedores(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuscarCNPJ = async () => {
    if (formData.cnpj.length < 14) {
      toast.error('CNPJ inválido');
      return;
    }

    try {
      const response = await api.get<{ success: boolean; data: any }>(`/integracoes/cnpj/${formData.cnpj}`);
      if (response.success) {
        const dados = response.data;
        setFormData({
          ...formData,
          razao_social: dados.razao_social || '',
          nome_fantasia: dados.nome_fantasia || '',
          email: dados.email || '',
          telefone: dados.telefone || '',
          logradouro: dados.logradouro || '',
          numero: dados.numero || '',
          complemento: dados.complemento || '',
          bairro: dados.bairro || '',
          cidade: dados.cidade || '',
          uf: dados.uf || '',
          cep: dados.cep || '',
        });
        toast.success('Dados do CNPJ carregados');
      }
    } catch (error) {
      toast.error('Erro ao buscar CNPJ');
    }
  };

  const handleSalvar = async () => {
    if (!formData.razao_social || !formData.cnpj) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const payload = {
        ...formData,
        endereco: {
          logradouro: formData.logradouro,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          uf: formData.uf,
          cep: formData.cep,
        },
      };

      if (fornecedorEdit) {
        await api.put(`/compras/fornecedores/${fornecedorEdit.id}`, payload);
        toast.success('Fornecedor atualizado');
      } else {
        await api.post('/compras/fornecedores', payload);
        toast.success('Fornecedor cadastrado');
      }

      setShowFormModal(false);
      resetForm();
      loadFornecedores();
    } catch (error) {
      toast.error('Erro ao salvar fornecedor');
    }
  };

  const handleEditar = (fornecedor: Fornecedor) => {
    setFornecedorEdit(fornecedor);
    setFormData({
      razao_social: fornecedor.razao_social,
      nome_fantasia: fornecedor.nome_fantasia,
      cnpj: fornecedor.cnpj,
      inscricao_estadual: fornecedor.inscricao_estadual || '',
      email: fornecedor.email,
      telefone: fornecedor.telefone,
      celular: fornecedor.celular || '',
      logradouro: fornecedor.endereco.logradouro,
      numero: fornecedor.endereco.numero,
      complemento: fornecedor.endereco.complemento || '',
      bairro: fornecedor.endereco.bairro,
      cidade: fornecedor.endereco.cidade,
      uf: fornecedor.endereco.uf,
      cep: fornecedor.endereco.cep,
      categorias: fornecedor.categorias,
      condicao_pagamento_padrao: fornecedor.condicao_pagamento_padrao || '',
      contato_nome: fornecedor.contato_nome || '',
      contato_cargo: fornecedor.contato_cargo || '',
      observacao: fornecedor.observacao || '',
    });
    setShowFormModal(true);
  };

  const handleBloquear = async (fornecedor: Fornecedor) => {
    const novoStatus = fornecedor.status === 'bloqueado' ? 'ativo' : 'bloqueado';
    const msg = novoStatus === 'bloqueado' ? 'bloquear' : 'desbloquear';
    
    if (!confirm(`Deseja ${msg} este fornecedor?`)) return;

    try {
      await api.patch(`/compras/fornecedores/${fornecedor.id}/status`, { status: novoStatus });
      toast.success(`Fornecedor ${novoStatus === 'bloqueado' ? 'bloqueado' : 'desbloqueado'}`);
      loadFornecedores();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const resetForm = () => {
    setFornecedorEdit(null);
    setFormTab('dados');
    setFormData({
      razao_social: '',
      nome_fantasia: '',
      cnpj: '',
      inscricao_estadual: '',
      email: '',
      telefone: '',
      celular: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      cep: '',
      categorias: [],
      condicao_pagamento_padrao: '',
      contato_nome: '',
      contato_cargo: '',
      observacao: '',
    });
  };

  const filteredFornecedores = fornecedores.filter((fornecedor) => {
    const matchSearch =
      fornecedor.razao_social?.toLowerCase().includes(search.toLowerCase()) ||
      fornecedor.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) ||
      fornecedor.cnpj?.includes(search) ||
      fornecedor.codigo?.includes(search);

    const matchStatus = !statusFilter || fornecedor.status === statusFilter;
    const matchCategoria = !categoriaFilter || fornecedor.categorias.includes(categoriaFilter);

    return matchSearch && matchStatus && matchCategoria;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const renderStars = (rating: number) => {
    return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
  };

  const columns = [
    {
      key: 'codigo',
      header: 'Código',
      width: '80px',
      render: (f: Fornecedor) => <span className="font-mono">{f.codigo}</span>,
    },
    {
      key: 'fornecedor',
      header: 'Fornecedor',
      render: (f: Fornecedor) => (
        <div>
          <p className="font-medium text-gray-900">{f.nome_fantasia || f.razao_social}</p>
          <p className="text-sm text-gray-500">{f.cnpj}</p>
        </div>
      ),
    },
    {
      key: 'contato',
      header: 'Contato',
      render: (f: Fornecedor) => (
        <div>
          <p className="text-sm">{f.email}</p>
          <p className="text-sm text-gray-500">{f.telefone}</p>
        </div>
      ),
    },
    {
      key: 'categorias',
      header: 'Categorias',
      render: (f: Fornecedor) => (
        <div className="flex flex-wrap gap-1">
          {f.categorias.slice(0, 2).map((cat, i) => (
            <Badge key={i} variant="default">{cat}</Badge>
          ))}
          {f.categorias.length > 2 && (
            <span className="text-xs text-gray-500">+{f.categorias.length - 2}</span>
          )}
        </div>
      ),
    },
    {
      key: 'avaliacao',
      header: 'Avaliação',
      width: '100px',
      render: (f: Fornecedor) => (
        <span className="text-yellow-500">{renderStars(f.avaliacao)}</span>
      ),
    },
    {
      key: 'compras',
      header: 'Total Compras',
      width: '120px',
      render: (f: Fornecedor) => formatCurrency(f.total_compras),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (f: Fornecedor) => {
        const config = statusConfig[f.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (fornecedor: Fornecedor) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => handleEditar(fornecedor),
    },
    {
      label: 'Ver Histórico',
      icon: <Icons.document className="w-4 h-4" />,
      onClick: () => {},
    },
    {
      label: fornecedor.status === 'bloqueado' ? 'Desbloquear' : 'Bloquear',
      icon: <Icons.x className="w-4 h-4" />,
      variant: 'danger' as const,
      onClick: () => handleBloquear(fornecedor),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-500">Gerencie seus fornecedores</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={() => {
            resetForm();
            setShowFormModal(true);
          }}
        >
          Novo Fornecedor
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total Fornecedores</p>
          <p className="text-2xl font-bold">{fornecedores.length}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Ativos</p>
          <p className="text-2xl font-bold text-green-600">
            {fornecedores.filter(f => f.status === 'ativo').length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Bloqueados</p>
          <p className="text-2xl font-bold text-red-600">
            {fornecedores.filter(f => f.status === 'bloqueado').length}
          </p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Avaliação Média</p>
          <p className="text-2xl font-bold text-yellow-600">
            {(fornecedores.reduce((a, f) => a + f.avaliacao, 0) / fornecedores.length || 0).toFixed(1)} ★
          </p>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por nome, CNPJ, código..."
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
                { value: '', label: 'Todos Status' },
                ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label })),
              ]}
            />
          </div>
          <div className="w-48">
            <Select
              value={categoriaFilter}
              onChange={setCategoriaFilter}
              options={[
                { value: '', label: 'Todas Categorias' },
                ...categoriasOptions.map(c => ({ value: c, label: c })),
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredFornecedores}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum fornecedor encontrado"
        />
      </Card>

      {/* Modal Formulário */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
        title={fornecedorEdit ? 'Editar Fornecedor' : 'Novo Fornecedor'}
        size="xl"
      >
        <Tabs
          value={formTab}
          onChange={setFormTab}
          tabs={[
            { id: 'dados', label: 'Dados' },
            { id: 'endereco', label: 'Endereço' },
            { id: 'comercial', label: 'Comercial' },
          ]}
        />
        
        <div className="mt-4 space-y-4">
          {formTab === 'dados' && (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    label="CNPJ *"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <Button variant="secondary" onClick={handleBuscarCNPJ} className="mt-6">
                  Buscar
                </Button>
              </div>
              
              <Input
                label="Razão Social *"
                value={formData.razao_social}
                onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
              />
              
              <Input
                label="Nome Fantasia"
                value={formData.nome_fantasia}
                onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="E-mail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <Input
                  label="Telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
            </>
          )}
          
          {formTab === 'endereco' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Input
                    label="Logradouro"
                    value={formData.logradouro}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                  />
                </div>
                <Input
                  label="Número"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Complemento"
                  value={formData.complemento}
                  onChange={(e) => setFormData({ ...formData, complemento: e.target.value })}
                />
                <Input
                  label="Bairro"
                  value={formData.bairro}
                  onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Input
                    label="CEP"
                    value={formData.cep}
                    onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                  />
                </div>
                <Input
                  label="Cidade"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
                <Select
                  label="UF"
                  value={formData.uf}
                  onChange={(v) => setFormData({ ...formData, uf: v })}
                  options={['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => ({ value: uf, label: uf }))}
                />
              </div>
            </>
          )}
          
          {formTab === 'comercial' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nome do Contato"
                  value={formData.contato_nome}
                  onChange={(e) => setFormData({ ...formData, contato_nome: e.target.value })}
                />
                <Input
                  label="Cargo"
                  value={formData.contato_cargo}
                  onChange={(e) => setFormData({ ...formData, contato_cargo: e.target.value })}
                />
              </div>
              
              <Input
                label="Condição de Pagamento Padrão"
                value={formData.condicao_pagamento_padrao}
                onChange={(e) => setFormData({ ...formData, condicao_pagamento_padrao: e.target.value })}
                placeholder="Ex: 30/60/90 dias"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categorias</label>
                <div className="flex flex-wrap gap-2">
                  {categoriasOptions.map((cat) => (
                    <label key={cat} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categorias.includes(cat)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, categorias: [...formData.categorias, cat] });
                          } else {
                            setFormData({ ...formData, categorias: formData.categorias.filter(c => c !== cat) });
                          }
                        }}
                      />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <Input
                label="Observações"
                value={formData.observacao}
                onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                placeholder="Observações sobre o fornecedor"
              />
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="secondary" onClick={() => setShowFormModal(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSalvar}>
            {fornecedorEdit ? 'Atualizar' : 'Cadastrar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

export default FornecedoresPage;
