// =============================================
// PLANAC ERP - Cadastro de Funcionários
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

interface Funcionario {
  id: string;
  matricula: string;
  nome: string;
  cpf: string;
  rg?: string;
  data_nascimento: string;
  email: string;
  telefone: string;
  endereco: {
    logradouro: string;
    numero: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  cargo_id: string;
  cargo_nome: string;
  departamento_id: string;
  departamento_nome: string;
  data_admissao: string;
  data_demissao?: string;
  tipo_contrato: 'clt' | 'pj' | 'estagio' | 'temporario';
  salario: number;
  status: 'ativo' | 'ferias' | 'afastado' | 'desligado';
  foto_url?: string;
  pis?: string;
  ctps?: string;
}

interface Departamento {
  id: string;
  nome: string;
}

interface Cargo {
  id: string;
  nome: string;
  departamento_id: string;
}

const statusConfig = {
  ativo: { label: 'Ativo', variant: 'success' as const },
  ferias: { label: 'Férias', variant: 'info' as const },
  afastado: { label: 'Afastado', variant: 'warning' as const },
  desligado: { label: 'Desligado', variant: 'default' as const },
};

const tipoContratoConfig = {
  clt: { label: 'CLT', variant: 'success' as const },
  pj: { label: 'PJ', variant: 'info' as const },
  estagio: { label: 'Estágio', variant: 'warning' as const },
  temporario: { label: 'Temporário', variant: 'default' as const },
};

export function FuncionariosPage() {
  const toast = useToast();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departamentoFilter, setDepartamentoFilter] = useState('');
  
  // Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [funcionarioEdit, setFuncionarioEdit] = useState<Funcionario | null>(null);
  const [formTab, setFormTab] = useState('dados');
  const [formData, setFormData] = useState({
    nome: '',
    cpf: '',
    rg: '',
    data_nascimento: '',
    email: '',
    telefone: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
    cep: '',
    cargo_id: '',
    departamento_id: '',
    data_admissao: '',
    tipo_contrato: 'clt',
    salario: '',
    pis: '',
    ctps: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [funcRes, deptRes, cargoRes] = await Promise.all([
        api.get<{ success: boolean; data: Funcionario[] }>('/rh/funcionarios'),
        api.get<{ success: boolean; data: Departamento[] }>('/rh/departamentos'),
        api.get<{ success: boolean; data: Cargo[] }>('/rh/cargos'),
      ]);
      
      if (funcRes.success) setFuncionarios(funcRes.data);
      if (deptRes.success) setDepartamentos(deptRes.data);
      if (cargoRes.success) setCargos(cargoRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (!formData.nome || !formData.cpf || !formData.cargo_id) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const payload = {
        ...formData,
        salario: parseFloat(formData.salario) || 0,
        endereco: {
          logradouro: formData.logradouro,
          numero: formData.numero,
          bairro: formData.bairro,
          cidade: formData.cidade,
          uf: formData.uf,
          cep: formData.cep,
        },
      };

      if (funcionarioEdit) {
        await api.put(`/rh/funcionarios/${funcionarioEdit.id}`, payload);
        toast.success('Funcionário atualizado');
      } else {
        await api.post('/rh/funcionarios', payload);
        toast.success('Funcionário cadastrado');
      }

      setShowFormModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar funcionário');
    }
  };

  const handleEditar = (funcionario: Funcionario) => {
    setFuncionarioEdit(funcionario);
    setFormData({
      nome: funcionario.nome,
      cpf: funcionario.cpf,
      rg: funcionario.rg || '',
      data_nascimento: funcionario.data_nascimento,
      email: funcionario.email,
      telefone: funcionario.telefone,
      logradouro: funcionario.endereco.logradouro,
      numero: funcionario.endereco.numero,
      bairro: funcionario.endereco.bairro,
      cidade: funcionario.endereco.cidade,
      uf: funcionario.endereco.uf,
      cep: funcionario.endereco.cep,
      cargo_id: funcionario.cargo_id,
      departamento_id: funcionario.departamento_id,
      data_admissao: funcionario.data_admissao,
      tipo_contrato: funcionario.tipo_contrato,
      salario: funcionario.salario.toString(),
      pis: funcionario.pis || '',
      ctps: funcionario.ctps || '',
    });
    setShowFormModal(true);
  };

  const resetForm = () => {
    setFuncionarioEdit(null);
    setFormTab('dados');
    setFormData({
      nome: '', cpf: '', rg: '', data_nascimento: '', email: '', telefone: '',
      logradouro: '', numero: '', bairro: '', cidade: '', uf: '', cep: '',
      cargo_id: '', departamento_id: '', data_admissao: '', tipo_contrato: 'clt',
      salario: '', pis: '', ctps: '',
    });
  };

  const filteredFuncionarios = funcionarios.filter((func) => {
    const matchSearch =
      func.nome?.toLowerCase().includes(search.toLowerCase()) ||
      func.cpf?.includes(search) ||
      func.matricula?.includes(search);
    const matchStatus = !statusFilter || func.status === statusFilter;
    const matchDept = !departamentoFilter || func.departamento_id === departamentoFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const calcularTempoEmpresa = (dataAdmissao: string) => {
    const admissao = new Date(dataAdmissao);
    const hoje = new Date();
    const diffMeses = (hoje.getFullYear() - admissao.getFullYear()) * 12 + (hoje.getMonth() - admissao.getMonth());
    const anos = Math.floor(diffMeses / 12);
    const meses = diffMeses % 12;
    if (anos === 0) return `${meses}m`;
    return `${anos}a ${meses}m`;
  };

  // Stats
  const stats = {
    total: funcionarios.length,
    ativos: funcionarios.filter(f => f.status === 'ativo').length,
    ferias: funcionarios.filter(f => f.status === 'ferias').length,
    clt: funcionarios.filter(f => f.tipo_contrato === 'clt').length,
  };

  const columns = [
    {
      key: 'funcionario',
      header: 'Funcionário',
      render: (f: Funcionario) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-planac-100 flex items-center justify-center text-planac-600 font-bold">
            {f.nome.charAt(0)}
          </div>
          <div>
            <p className="font-medium">{f.nome}</p>
            <p className="text-sm text-gray-500">{f.matricula}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'cargo',
      header: 'Cargo / Depto',
      render: (f: Funcionario) => (
        <div>
          <p className="text-sm font-medium">{f.cargo_nome}</p>
          <p className="text-xs text-gray-500">{f.departamento_nome}</p>
        </div>
      ),
    },
    {
      key: 'contrato',
      header: 'Contrato',
      width: '100px',
      render: (f: Funcionario) => {
        const config = tipoContratoConfig[f.tipo_contrato];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'admissao',
      header: 'Admissão',
      width: '120px',
      render: (f: Funcionario) => (
        <div>
          <p className="text-sm">{formatDate(f.data_admissao)}</p>
          <p className="text-xs text-gray-500">{calcularTempoEmpresa(f.data_admissao)}</p>
        </div>
      ),
    },
    {
      key: 'salario',
      header: 'Salário',
      width: '120px',
      render: (f: Funcionario) => formatCurrency(f.salario),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (f: Funcionario) => {
        const config = statusConfig[f.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (funcionario: Funcionario) => [
    {
      label: 'Editar',
      icon: <Icons.edit className="w-4 h-4" />,
      onClick: () => handleEditar(funcionario),
    },
    {
      label: 'Ver Perfil',
      icon: <Icons.eye className="w-4 h-4" />,
      onClick: () => {},
    },
    {
      label: 'Histórico',
      icon: <Icons.document className="w-4 h-4" />,
      onClick: () => {},
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funcionários</h1>
          <p className="text-gray-500">Gerencie o cadastro de colaboradores</p>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => { resetForm(); setShowFormModal(true); }}>
          Novo Funcionário
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Ativos</p>
          <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">De Férias</p>
          <p className="text-2xl font-bold text-blue-600">{stats.ferias}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">CLT</p>
          <p className="text-2xl font-bold text-planac-600">{stats.clt}</p>
        </Card>
      </div>

      {/* Filtros */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por nome, CPF, matrícula..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'Todos Status' },
              ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label })),
            ]}
          />
          <Select
            value={departamentoFilter}
            onChange={setDepartamentoFilter}
            options={[
              { value: '', label: 'Todos Deptos' },
              ...departamentos.map(d => ({ value: d.id, label: d.nome })),
            ]}
          />
        </div>
      </Card>

      {/* Tabela */}
      <Card padding="none">
        <DataTable
          data={filteredFuncionarios}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum funcionário encontrado"
        />
      </Card>

      {/* Modal Formulário */}
      <Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={funcionarioEdit ? 'Editar Funcionário' : 'Novo Funcionário'}
        size="xl"
      >
        <Tabs
          value={formTab}
          onChange={setFormTab}
          tabs={[
            { id: 'dados', label: 'Dados Pessoais' },
            { id: 'endereco', label: 'Endereço' },
            { id: 'contrato', label: 'Contrato' },
          ]}
        />
        
        <div className="mt-4 space-y-4">
          {formTab === 'dados' && (
            <>
              <Input label="Nome Completo *" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="CPF *" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} />
                <Input label="RG" value={formData.rg} onChange={(e) => setFormData({ ...formData, rg: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Data Nascimento" type="date" value={formData.data_nascimento} onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })} />
                <Input label="Telefone" value={formData.telefone} onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} />
              </div>
              <Input label="E-mail" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </>
          )}
          
          {formTab === 'endereco' && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Input label="Logradouro" value={formData.logradouro} onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })} />
                </div>
                <Input label="Número" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Bairro" value={formData.bairro} onChange={(e) => setFormData({ ...formData, bairro: e.target.value })} />
                <Input label="CEP" value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Cidade" value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} />
                <Select label="UF" value={formData.uf} onChange={(v) => setFormData({ ...formData, uf: v })}
                  options={['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => ({ value: uf, label: uf }))}
                />
              </div>
            </>
          )}
          
          {formTab === 'contrato' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Departamento *" value={formData.departamento_id} onChange={(v) => setFormData({ ...formData, departamento_id: v, cargo_id: '' })}
                  options={[{ value: '', label: 'Selecione...' }, ...departamentos.map(d => ({ value: d.id, label: d.nome }))]}
                />
                <Select label="Cargo *" value={formData.cargo_id} onChange={(v) => setFormData({ ...formData, cargo_id: v })}
                  options={[{ value: '', label: 'Selecione...' }, ...cargos.filter(c => !formData.departamento_id || c.departamento_id === formData.departamento_id).map(c => ({ value: c.id, label: c.nome }))]}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Tipo Contrato" value={formData.tipo_contrato} onChange={(v) => setFormData({ ...formData, tipo_contrato: v })}
                  options={Object.entries(tipoContratoConfig).map(([k, v]) => ({ value: k, label: v.label }))}
                />
                <Input label="Data Admissão" type="date" value={formData.data_admissao} onChange={(e) => setFormData({ ...formData, data_admissao: e.target.value })} />
              </div>
              <Input label="Salário" type="number" value={formData.salario} onChange={(e) => setFormData({ ...formData, salario: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="PIS" value={formData.pis} onChange={(e) => setFormData({ ...formData, pis: e.target.value })} />
                <Input label="CTPS" value={formData.ctps} onChange={(e) => setFormData({ ...formData, ctps: e.target.value })} />
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="secondary" onClick={() => setShowFormModal(false)}>Cancelar</Button>
          <Button onClick={handleSalvar}>{funcionarioEdit ? 'Atualizar' : 'Cadastrar'}</Button>
        </div>
      </Modal>
    </div>
  );
}

export default FuncionariosPage;
