// =============================================
// PLANAC ERP - CRM Oportunidades Page
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface Oportunidade {
  id: string;
  titulo: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_cnpj?: string;
  vendedor_id: string;
  vendedor_nome: string;
  etapa: string;
  status: 'aberta' | 'ganha' | 'perdida';
  valor: number;
  probabilidade: number;
  data_previsao_fechamento?: string;
  motivo_perda?: string;
  concorrente?: string;
  origem_lead_id?: string;
  produtos_interesse?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

const etapaOptions = [
  { value: '', label: 'Todas as etapas' },
  { value: 'prospeccao', label: 'Prospecção' },
  { value: 'qualificacao', label: 'Qualificação' },
  { value: 'proposta', label: 'Proposta' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'fechamento', label: 'Fechamento' },
];

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'aberta', label: 'Abertas' },
  { value: 'ganha', label: 'Ganhas' },
  { value: 'perdida', label: 'Perdidas' },
];

const vendedorOptions = [
  { value: '', label: 'Todos os vendedores' },
  { value: '1', label: 'João Silva' },
  { value: '2', label: 'Maria Santos' },
  { value: '3', label: 'Pedro Costa' },
];

const etapaConfig: Record<string, { label: string; cor: string }> = {
  prospeccao: { label: 'Prospecção', cor: 'bg-slate-500' },
  qualificacao: { label: 'Qualificação', cor: 'bg-blue-500' },
  proposta: { label: 'Proposta', cor: 'bg-yellow-500' },
  negociacao: { label: 'Negociação', cor: 'bg-orange-500' },
  fechamento: { label: 'Fechamento', cor: 'bg-green-500' },
};

export function OportunidadesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [oportunidades, setOportunidades] = useState<Oportunidade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [etapaFilter, setEtapaFilter] = useState(searchParams.get('etapa') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [vendedorFilter, setVendedorFilter] = useState('');

  useEffect(() => {
    loadOportunidades();
  }, [etapaFilter, statusFilter, vendedorFilter]);

  const loadOportunidades = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (etapaFilter) params.append('etapa', etapaFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (vendedorFilter) params.append('vendedor_id', vendedorFilter);

      const response = await api.get<{ success: boolean; data: Oportunidade[] }>(
        `/crm/oportunidades?${params.toString()}`
      );
      if (response.success) {
        setOportunidades(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar oportunidades');
      // Mock data
      setOportunidades([
        { id: '1', titulo: 'Obra Shopping Center', cliente_id: '1', cliente_nome: 'Construtora ABC', cliente_cnpj: '12.345.678/0001-90', vendedor_id: '1', vendedor_nome: 'João Silva', etapa: 'negociacao', status: 'aberta', valor: 285000, probabilidade: 75, data_previsao_fechamento: '2024-12-30', produtos_interesse: 'Drywall, Steel Frame', created_at: '2024-11-15', updated_at: '2024-12-14' },
        { id: '2', titulo: 'Hotel Marina - Reforma', cliente_id: '2', cliente_nome: 'Rede Hoteleira XYZ', cliente_cnpj: '98.765.432/0001-10', vendedor_id: '2', vendedor_nome: 'Maria Santos', etapa: 'proposta', status: 'aberta', valor: 180000, probabilidade: 60, data_previsao_fechamento: '2025-01-15', produtos_interesse: 'Forro, Divisórias', created_at: '2024-11-20', updated_at: '2024-12-13' },
        { id: '3', titulo: 'Escritório Tech Solutions', cliente_id: '3', cliente_nome: 'Tech Solutions LTDA', cliente_cnpj: '11.222.333/0001-44', vendedor_id: '1', vendedor_nome: 'João Silva', etapa: 'qualificacao', status: 'aberta', valor: 65000, probabilidade: 40, created_at: '2024-12-01', updated_at: '2024-12-12' },
        { id: '4', titulo: 'Clínica Saúde+ Ampliação', cliente_id: '4', cliente_nome: 'Clínica Saúde+', cliente_cnpj: '44.555.666/0001-77', vendedor_id: '3', vendedor_nome: 'Pedro Costa', etapa: 'fechamento', status: 'aberta', valor: 42000, probabilidade: 90, data_previsao_fechamento: '2024-12-20', created_at: '2024-11-25', updated_at: '2024-12-14' },
        { id: '5', titulo: 'Galpão Industrial Metal', cliente_id: '5', cliente_nome: 'Indústria Metal S.A.', cliente_cnpj: '55.666.777/0001-88', vendedor_id: '2', vendedor_nome: 'Maria Santos', etapa: 'proposta', status: 'aberta', valor: 320000, probabilidade: 55, data_previsao_fechamento: '2025-02-01', produtos_interesse: 'Steel Frame completo', created_at: '2024-12-05', updated_at: '2024-12-11' },
        { id: '6', titulo: 'Escola ABC - Salas', cliente_id: '6', cliente_nome: 'Colégio ABC', cliente_cnpj: '66.777.888/0001-99', vendedor_id: '1', vendedor_nome: 'João Silva', etapa: 'prospeccao', status: 'aberta', valor: 95000, probabilidade: 25, created_at: '2024-12-10', updated_at: '2024-12-14' },
        { id: '7', titulo: 'Apartamento Luxo', cliente_id: '7', cliente_nome: 'Incorporadora Premium', vendedor_id: '3', vendedor_nome: 'Pedro Costa', etapa: 'fechamento', status: 'ganha', valor: 78000, probabilidade: 100, data_previsao_fechamento: '2024-12-10', created_at: '2024-11-01', updated_at: '2024-12-10' },
        { id: '8', titulo: 'Loja Centro Comercial', cliente_id: '8', cliente_nome: 'Varejo Express', vendedor_id: '2', vendedor_nome: 'Maria Santos', etapa: 'negociacao', status: 'perdida', valor: 55000, probabilidade: 0, motivo_perda: 'Preço acima do orçamento do cliente', concorrente: 'Drywall Sul', created_at: '2024-11-10', updated_at: '2024-12-05' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta oportunidade?')) return;

    try {
      await api.delete(`/crm/oportunidades/${id}`);
      toast.success('Oportunidade excluída');
      loadOportunidades();
    } catch (error) {
      toast.error('Erro ao excluir oportunidade');
    }
  };

  const handleWin = async (oportunidade: Oportunidade) => {
    try {
      await api.put(`/crm/oportunidades/${oportunidade.id}`, { status: 'ganha' });
      toast.success('🎉 Oportunidade marcada como GANHA!');
      loadOportunidades();
    } catch (error) {
      toast.error('Erro ao atualizar oportunidade');
    }
  };

  const handleLose = async (oportunidade: Oportunidade) => {
    const motivo = prompt('Qual o motivo da perda?');
    if (!motivo) return;

    try {
      await api.put(`/crm/oportunidades/${oportunidade.id}`, { 
        status: 'perdida',
        motivo_perda: motivo 
      });
      toast.success('Oportunidade marcada como perdida');
      loadOportunidades();
    } catch (error) {
      toast.error('Erro ao atualizar oportunidade');
    }
  };

  const filteredOportunidades = oportunidades.filter((o) => {
    const matchSearch =
      o.titulo.toLowerCase().includes(search.toLowerCase()) ||
      o.cliente_nome.toLowerCase().includes(search.toLowerCase());

    return matchSearch;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const columns = [
    {
      key: 'titulo',
      header: 'Oportunidade',
      sortable: true,
      render: (o: Oportunidade) => (
        <div>
          <p className="font-medium text-gray-900">{o.titulo}</p>
          <p className="text-sm text-gray-500">{o.cliente_nome}</p>
        </div>
      ),
    },
    {
      key: 'etapa',
      header: 'Etapa',
      width: '130px',
      render: (o: Oportunidade) => {
        const config = etapaConfig[o.etapa];
        return (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${config?.cor || 'bg-gray-400'}`} />
            <span className="text-sm">{config?.label || o.etapa}</span>
          </div>
        );
      },
    },
    {
      key: 'valor',
      header: 'Valor',
      width: '130px',
      sortable: true,
      render: (o: Oportunidade) => (
        <span className="font-semibold text-green-600">{formatCurrency(o.valor)}</span>
      ),
    },
    {
      key: 'probabilidade',
      header: 'Prob.',
      width: '80px',
      render: (o: Oportunidade) => {
        const color = 
          o.probabilidade >= 70 ? 'text-green-600 bg-green-100' :
          o.probabilidade >= 40 ? 'text-yellow-600 bg-yellow-100' :
          'text-red-600 bg-red-100';
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${color}`}>
            {o.probabilidade}%
          </span>
        );
      },
    },
    {
      key: 'vendedor',
      header: 'Vendedor',
      width: '130px',
      render: (o: Oportunidade) => o.vendedor_nome,
    },
    {
      key: 'previsao',
      header: 'Previsão',
      width: '110px',
      render: (o: Oportunidade) => formatDate(o.data_previsao_fechamento),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (o: Oportunidade) => {
        switch (o.status) {
          case 'ganha':
            return <Badge variant="success">Ganha</Badge>;
          case 'perdida':
            return <Badge variant="danger">Perdida</Badge>;
          default:
            return <Badge variant="info">Aberta</Badge>;
        }
      },
    },
  ];

  const actions = (oportunidade: Oportunidade) => {
    const items = [
      {
        label: 'Ver Detalhes',
        icon: <Icons.eye className="w-4 h-4" />,
        onClick: () => navigate(`/crm/oportunidades/${oportunidade.id}`),
      },
      {
        label: 'Editar',
        icon: <Icons.edit className="w-4 h-4" />,
        onClick: () => navigate(`/crm/oportunidades/${oportunidade.id}/editar`),
      },
      {
        label: 'Ver no Pipeline',
        icon: <Icons.columns className="w-4 h-4" />,
        onClick: () => navigate('/crm/pipeline'),
      },
      { type: 'separator' as const },
      {
        label: 'Agendar Atividade',
        icon: <Icons.calendar className="w-4 h-4" />,
        onClick: () => navigate(`/crm/atividades/nova?oportunidade=${oportunidade.id}`),
      },
      {
        label: 'Criar Orçamento',
        icon: <Icons.fileText className="w-4 h-4" />,
        onClick: () => navigate(`/orcamentos/novo?oportunidade=${oportunidade.id}`),
      },
    ];

    if (oportunidade.status === 'aberta') {
      items.push(
        { type: 'separator' as const },
        {
          label: '🎉 Marcar como GANHA',
          icon: <Icons.checkCircle className="w-4 h-4" />,
          variant: 'success' as const,
          onClick: () => handleWin(oportunidade),
        },
        {
          label: 'Marcar como Perdida',
          icon: <Icons.xCircle className="w-4 h-4" />,
          variant: 'danger' as const,
          onClick: () => handleLose(oportunidade),
        }
      );
    }

    items.push(
      { type: 'separator' as const },
      {
        label: 'Excluir',
        icon: <Icons.trash className="w-4 h-4" />,
        variant: 'danger' as const,
        onClick: () => handleDelete(oportunidade.id),
      }
    );

    return items;
  };

  const stats = {
    total: oportunidades.length,
    abertas: oportunidades.filter(o => o.status === 'aberta').length,
    valorAberto: oportunidades.filter(o => o.status === 'aberta').reduce((sum, o) => sum + o.valor, 0),
    ganhas: oportunidades.filter(o => o.status === 'ganha').length,
    valorGanho: oportunidades.filter(o => o.status === 'ganha').reduce((sum, o) => sum + o.valor, 0),
    perdidas: oportunidades.filter(o => o.status === 'perdida').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Oportunidades</h1>
          <p className="text-gray-500">Gerencie suas oportunidades de vendas</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<Icons.columns className="w-4 h-4" />}
            onClick={() => navigate('/crm/pipeline')}
          >
            Ver Pipeline
          </Button>
          <Button
            leftIcon={<Icons.plus className="w-5 h-5" />}
            onClick={() => navigate('/crm/oportunidades/nova')}
          >
            Nova Oportunidade
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.target className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.abertas}</p>
              <p className="text-sm text-gray-500">Abertas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.dollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.valorAberto)}</p>
              <p className="text-sm text-gray-500">Em Pipeline</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.checkCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.ganhas}</p>
              <p className="text-sm text-gray-500">Ganhas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.trendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.valorGanho)}</p>
              <p className="text-sm text-gray-500">Valor Ganho</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar oportunidade ou cliente..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              value={etapaFilter}
              onChange={setEtapaFilter}
              options={etapaOptions}
              placeholder="Etapa"
            />
          </div>
          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              placeholder="Status"
            />
          </div>
          <div className="w-48">
            <Select
              value={vendedorFilter}
              onChange={setVendedorFilter}
              options={vendedorOptions}
              placeholder="Vendedor"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredOportunidades}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma oportunidade encontrada"
          onRowClick={(o) => navigate(`/crm/oportunidades/${o.id}`)}
        />
      </Card>
    </div>
  );
}

export default OportunidadesPage;
