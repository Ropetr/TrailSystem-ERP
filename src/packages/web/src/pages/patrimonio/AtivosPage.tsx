// =============================================
// PLANAC ERP - Gestão de Ativos
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

interface Ativo {
  id: string;
  codigo: string;
  descricao: string;
  categoria_id: string;
  categoria_nome: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  data_aquisicao: string;
  valor_aquisicao: number;
  valor_residual: number;
  vida_util_meses: number;
  metodo_depreciacao: 'linear' | 'soma_digitos' | 'unidades_produzidas';
  status: 'ativo' | 'em_manutencao' | 'baixado' | 'vendido';
  localizacao?: string;
  responsavel_id?: string;
  responsavel_nome?: string;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  nota_fiscal?: string;
  depreciacao_acumulada: number;
  valor_atual: number;
  ultima_depreciacao?: string;
  foto_url?: string;
  observacoes?: string;
}

interface Categoria {
  id: string;
  nome: string;
  vida_util_padrao: number;
  conta_contabil?: string;
}

const statusConfig = {
  ativo: { label: 'Ativo', variant: 'success' as const },
  em_manutencao: { label: 'Em Manutenção', variant: 'warning' as const },
  baixado: { label: 'Baixado', variant: 'default' as const },
  vendido: { label: 'Vendido', variant: 'info' as const },
};

const metodoConfig = {
  linear: 'Linear',
  soma_digitos: 'Soma dos Dígitos',
  unidades_produzidas: 'Unidades Produzidas',
};

export function AtivosPage() {
  const toast = useToast();
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modal
  const [showFormModal, setShowFormModal] = useState(false);
  const [ativoEdit, setAtivoEdit] = useState<Ativo | null>(null);
  const [formTab, setFormTab] = useState('dados');
  const [formData, setFormData] = useState({
    codigo: '',
    descricao: '',
    categoria_id: '',
    marca: '',
    modelo: '',
    numero_serie: '',
    data_aquisicao: '',
    valor_aquisicao: '',
    valor_residual: '',
    vida_util_meses: '',
    metodo_depreciacao: 'linear',
    localizacao: '',
    responsavel_id: '',
    nota_fiscal: '',
    observacoes: '',
  });
  
  // Modal de baixa
  const [showBaixaModal, setShowBaixaModal] = useState(false);
  const [ativoParaBaixa, setAtivoParaBaixa] = useState<Ativo | null>(null);
  const [baixaForm, setBaixaForm] = useState({
    tipo: 'baixa',
    data: new Date().toISOString().split('T')[0],
    valor_venda: '',
    motivo: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ativosRes, categoriasRes] = await Promise.all([
        api.get<{ success: boolean; data: Ativo[] }>('/patrimonio/ativos'),
        api.get<{ success: boolean; data: Categoria[] }>('/patrimonio/categorias'),
      ]);
      
      if (ativosRes.success) setAtivos(ativosRes.data);
      if (categoriasRes.success) setCategorias(categoriasRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSalvar = async () => {
    if (!formData.descricao || !formData.categoria_id || !formData.valor_aquisicao) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      const payload = {
        ...formData,
        valor_aquisicao: parseFloat(formData.valor_aquisicao),
        valor_residual: parseFloat(formData.valor_residual) || 0,
        vida_util_meses: parseInt(formData.vida_util_meses) || 60,
      };

      if (ativoEdit) {
        await api.put(`/patrimonio/ativos/${ativoEdit.id}`, payload);
        toast.success('Ativo atualizado');
      } else {
        await api.post('/patrimonio/ativos', payload);
        toast.success('Ativo cadastrado');
      }

      setShowFormModal(false);
      resetForm();
      loadData();
    } catch (error) {
      toast.error('Erro ao salvar ativo');
    }
  };

  const handleBaixar = async () => {
    if (!ativoParaBaixa) return;

    try {
      await api.post(`/patrimonio/ativos/${ativoParaBaixa.id}/baixa`, {
        tipo: baixaForm.tipo,
        data: baixaForm.data,
        valor_venda: baixaForm.tipo === 'venda' ? parseFloat(baixaForm.valor_venda) : undefined,
        motivo: baixaForm.motivo,
      });
      toast.success(baixaForm.tipo === 'venda' ? 'Ativo vendido' : 'Ativo baixado');
      setShowBaixaModal(false);
      setBaixaForm({ tipo: 'baixa', data: new Date().toISOString().split('T')[0], valor_venda: '', motivo: '' });
      loadData();
    } catch (error) {
      toast.error('Erro ao processar baixa');
    }
  };

  const handleEditar = (ativo: Ativo) => {
    setAtivoEdit(ativo);
    setFormData({
      codigo: ativo.codigo,
      descricao: ativo.descricao,
      categoria_id: ativo.categoria_id,
      marca: ativo.marca || '',
      modelo: ativo.modelo || '',
      numero_serie: ativo.numero_serie || '',
      data_aquisicao: ativo.data_aquisicao,
      valor_aquisicao: ativo.valor_aquisicao.toString(),
      valor_residual: ativo.valor_residual.toString(),
      vida_util_meses: ativo.vida_util_meses.toString(),
      metodo_depreciacao: ativo.metodo_depreciacao,
      localizacao: ativo.localizacao || '',
      responsavel_id: ativo.responsavel_id || '',
      nota_fiscal: ativo.nota_fiscal || '',
      observacoes: ativo.observacoes || '',
    });
    setShowFormModal(true);
  };

  const resetForm = () => {
    setAtivoEdit(null);
    setFormTab('dados');
    setFormData({
      codigo: '', descricao: '', categoria_id: '', marca: '', modelo: '',
      numero_serie: '', data_aquisicao: '', valor_aquisicao: '', valor_residual: '',
      vida_util_meses: '', metodo_depreciacao: 'linear', localizacao: '',
      responsavel_id: '', nota_fiscal: '', observacoes: '',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const calcularPercentualDepreciado = (ativo: Ativo) => {
    const valorDepreciavel = ativo.valor_aquisicao - ativo.valor_residual;
    if (valorDepreciavel <= 0) return 0;
    return Math.min(100, (ativo.depreciacao_acumulada / valorDepreciavel) * 100);
  };

  const filteredAtivos = ativos.filter((a) => {
    const matchSearch = a.descricao.toLowerCase().includes(search.toLowerCase()) ||
      a.codigo.toLowerCase().includes(search.toLowerCase());
    const matchCategoria = !categoriaFilter || a.categoria_id === categoriaFilter;
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchCategoria && matchStatus;
  });

  // Stats
  const stats = {
    total: ativos.length,
    valorTotal: ativos.filter(a => a.status === 'ativo').reduce((acc, a) => acc + a.valor_aquisicao, 0),
    valorAtual: ativos.filter(a => a.status === 'ativo').reduce((acc, a) => acc + a.valor_atual, 0),
    depreciacao: ativos.filter(a => a.status === 'ativo').reduce((acc, a) => acc + a.depreciacao_acumulada, 0),
  };

  const columns = [
    {
      key: 'ativo',
      header: 'Ativo',
      render: (a: Ativo) => (
        <div>
          <p className="font-medium">{a.descricao}</p>
          <p className="text-sm text-gray-500">{a.codigo}</p>
        </div>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoria',
      width: '150px',
      render: (a: Ativo) => a.categoria_nome,
    },
    {
      key: 'valor_aquisicao',
      header: 'Valor Aquisição',
      width: '130px',
      render: (a: Ativo) => formatCurrency(a.valor_aquisicao),
    },
    {
      key: 'depreciacao',
      header: 'Depreciação',
      width: '150px',
      render: (a: Ativo) => {
        const percentual = calcularPercentualDepreciado(a);
        return (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>{formatCurrency(a.depreciacao_acumulada)}</span>
              <span>{percentual.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div className="bg-planac-500 h-1.5 rounded-full" style={{ width: `${percentual}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: 'valor_atual',
      header: 'Valor Atual',
      width: '120px',
      render: (a: Ativo) => (
        <span className="font-bold text-planac-600">{formatCurrency(a.valor_atual)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (a: Ativo) => {
        const config = statusConfig[a.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (ativo: Ativo) => [
    { label: 'Editar', icon: <Icons.edit className="w-4 h-4" />, onClick: () => handleEditar(ativo) },
    { label: 'Ver Histórico', icon: <Icons.document className="w-4 h-4" />, onClick: () => {} },
    ...(ativo.status === 'ativo' ? [{
      label: 'Baixar/Vender',
      icon: <Icons.x className="w-4 h-4" />,
      onClick: () => { setAtivoParaBaixa(ativo); setShowBaixaModal(true); },
    }] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ativos Imobilizados</h1>
          <p className="text-gray-500">Gestão do patrimônio da empresa</p>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => { resetForm(); setShowFormModal(true); }}>
          Novo Ativo
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total de Ativos</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Valor de Aquisição</p>
          <p className="text-2xl font-bold">{formatCurrency(stats.valorTotal)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Depreciação Acumulada</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.depreciacao)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Valor Contábil Atual</p>
          <p className="text-2xl font-bold text-planac-600">{formatCurrency(stats.valorAtual)}</p>
        </Card>
      </div>

      {/* Filtros */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por descrição ou código..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={categoriaFilter}
            onChange={setCategoriaFilter}
            options={[{ value: '', label: 'Todas Categorias' }, ...categorias.map(c => ({ value: c.id, label: c.nome }))]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: '', label: 'Todos Status' }, ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label }))]}
          />
        </div>
      </Card>

      {/* Tabela */}
      <Card padding="none">
        <DataTable
          data={filteredAtivos}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum ativo encontrado"
        />
      </Card>

      {/* Modal Form */}
      <Modal isOpen={showFormModal} onClose={() => setShowFormModal(false)} title={ativoEdit ? 'Editar Ativo' : 'Novo Ativo'} size="xl">
        <Tabs value={formTab} onChange={setFormTab} tabs={[
          { id: 'dados', label: 'Dados Gerais' },
          { id: 'valores', label: 'Valores' },
          { id: 'outros', label: 'Outros' },
        ]} />
        <div className="mt-4 space-y-4">
          {formTab === 'dados' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Código" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} />
                <Select label="Categoria *" value={formData.categoria_id} onChange={(v) => setFormData({ ...formData, categoria_id: v })}
                  options={[{ value: '', label: 'Selecione...' }, ...categorias.map(c => ({ value: c.id, label: c.nome }))]} />
              </div>
              <Input label="Descrição *" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} />
              <div className="grid grid-cols-3 gap-4">
                <Input label="Marca" value={formData.marca} onChange={(e) => setFormData({ ...formData, marca: e.target.value })} />
                <Input label="Modelo" value={formData.modelo} onChange={(e) => setFormData({ ...formData, modelo: e.target.value })} />
                <Input label="Nº Série" value={formData.numero_serie} onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })} />
              </div>
            </>
          )}
          {formTab === 'valores' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Data Aquisição" type="date" value={formData.data_aquisicao} onChange={(e) => setFormData({ ...formData, data_aquisicao: e.target.value })} />
                <Input label="Nota Fiscal" value={formData.nota_fiscal} onChange={(e) => setFormData({ ...formData, nota_fiscal: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Valor Aquisição *" type="number" value={formData.valor_aquisicao} onChange={(e) => setFormData({ ...formData, valor_aquisicao: e.target.value })} />
                <Input label="Valor Residual" type="number" value={formData.valor_residual} onChange={(e) => setFormData({ ...formData, valor_residual: e.target.value })} />
                <Input label="Vida Útil (meses)" type="number" value={formData.vida_util_meses} onChange={(e) => setFormData({ ...formData, vida_util_meses: e.target.value })} />
              </div>
              <Select label="Método Depreciação" value={formData.metodo_depreciacao} onChange={(v) => setFormData({ ...formData, metodo_depreciacao: v })}
                options={Object.entries(metodoConfig).map(([k, v]) => ({ value: k, label: v }))} />
            </>
          )}
          {formTab === 'outros' && (
            <>
              <Input label="Localização" value={formData.localizacao} onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })} />
              <Input label="Observações" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} />
            </>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button variant="secondary" onClick={() => setShowFormModal(false)}>Cancelar</Button>
          <Button onClick={handleSalvar}>{ativoEdit ? 'Atualizar' : 'Cadastrar'}</Button>
        </div>
      </Modal>

      {/* Modal Baixa */}
      <Modal isOpen={showBaixaModal} onClose={() => setShowBaixaModal(false)} title={`Baixa - ${ativoParaBaixa?.descricao}`} size="md">
        <div className="space-y-4">
          <Select label="Tipo" value={baixaForm.tipo} onChange={(v) => setBaixaForm({ ...baixaForm, tipo: v })}
            options={[{ value: 'baixa', label: 'Baixa por Descarte/Perda' }, { value: 'venda', label: 'Venda' }]} />
          <Input label="Data" type="date" value={baixaForm.data} onChange={(e) => setBaixaForm({ ...baixaForm, data: e.target.value })} />
          {baixaForm.tipo === 'venda' && (
            <Input label="Valor de Venda" type="number" value={baixaForm.valor_venda} onChange={(e) => setBaixaForm({ ...baixaForm, valor_venda: e.target.value })} />
          )}
          <Input label="Motivo" value={baixaForm.motivo} onChange={(e) => setBaixaForm({ ...baixaForm, motivo: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowBaixaModal(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleBaixar}>Confirmar Baixa</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AtivosPage;
