// =============================================
// PLANAC ERP - CRM Leads Page
// =============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import api from '@/services/api';

interface Lead {
  id: string;
  nome: string;
  empresa?: string;
  email?: string;
  telefone?: string;
  origem: 'indicacao' | 'site' | 'telefone' | 'visita' | 'evento' | 'rede_social' | 'outro';
  status: 'novo' | 'contatado' | 'qualificado' | 'desqualificado' | 'convertido';
  score: number;
  vendedor_id?: string;
  vendedor_nome?: string;
  interesse?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

const origemOptions = [
  { value: '', label: 'Todas as origens' },
  { value: 'indicacao', label: '👥 Indicação' },
  { value: 'site', label: '🌐 Site' },
  { value: 'telefone', label: '📞 Telefone' },
  { value: 'visita', label: '🏢 Visita' },
  { value: 'evento', label: '🎪 Evento' },
  { value: 'rede_social', label: '📱 Rede Social' },
  { value: 'outro', label: '📋 Outro' },
];

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'novo', label: 'Novo' },
  { value: 'contatado', label: 'Contatado' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'desqualificado', label: 'Desqualificado' },
  { value: 'convertido', label: 'Convertido' },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'info' | 'success' | 'warning' | 'danger' }> = {
  novo: { label: 'Novo', variant: 'info' },
  contatado: { label: 'Contatado', variant: 'warning' },
  qualificado: { label: 'Qualificado', variant: 'success' },
  desqualificado: { label: 'Desqualificado', variant: 'danger' },
  convertido: { label: 'Convertido', variant: 'default' },
};

const origemConfig: Record<string, string> = {
  indicacao: '👥 Indicação',
  site: '🌐 Site',
  telefone: '📞 Telefone',
  visita: '🏢 Visita',
  evento: '🎪 Evento',
  rede_social: '📱 Rede Social',
  outro: '📋 Outro',
};

export function LeadsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [origemFilter, setOrigemFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: Lead[] }>('/crm/leads');
      if (response.success) {
        setLeads(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar leads');
      // Mock data
      setLeads([
        { id: '1', nome: 'Carlos Mendes', empresa: 'Construtora Delta', email: 'carlos@delta.com.br', telefone: '(43) 99999-1111', origem: 'indicacao', status: 'novo', score: 85, interesse: 'Obra comercial grande porte', created_at: '2024-12-14T10:00:00', updated_at: '2024-12-14T10:00:00' },
        { id: '2', nome: 'Ana Paula Silva', empresa: 'Arquitetura S.A.', email: 'ana@arqsa.com.br', telefone: '(43) 99999-2222', origem: 'site', status: 'contatado', score: 70, vendedor_id: '1', vendedor_nome: 'João Silva', interesse: 'Projeto residencial', created_at: '2024-12-13T14:00:00', updated_at: '2024-12-14T09:00:00' },
        { id: '3', nome: 'Roberto Costa', empresa: 'RBC Engenharia', email: 'roberto@rbc.eng.br', telefone: '(43) 99999-3333', origem: 'evento', status: 'qualificado', score: 92, vendedor_id: '2', vendedor_nome: 'Maria Santos', interesse: 'Galpão industrial - 2000m²', created_at: '2024-12-12T11:00:00', updated_at: '2024-12-14T08:00:00' },
        { id: '4', nome: 'Fernanda Oliveira', telefone: '(43) 99999-4444', origem: 'telefone', status: 'novo', score: 45, interesse: 'Reforma residencial pequena', created_at: '2024-12-14T08:30:00', updated_at: '2024-12-14T08:30:00' },
        { id: '5', nome: 'Marcos Pereira', empresa: 'Hotel Estrela', email: 'marcos@hotelestrela.com.br', telefone: '(43) 99999-5555', origem: 'rede_social', status: 'contatado', score: 78, vendedor_id: '1', vendedor_nome: 'João Silva', interesse: 'Reforma de 50 quartos', created_at: '2024-12-11T16:00:00', updated_at: '2024-12-13T10:00:00' },
        { id: '6', nome: 'Juliana Martins', empresa: 'Clínica Vida', email: 'juliana@clinicavida.com.br', telefone: '(43) 99999-6666', origem: 'visita', status: 'desqualificado', score: 25, observacoes: 'Orçamento muito baixo', created_at: '2024-12-10T09:00:00', updated_at: '2024-12-12T14:00:00' },
        { id: '7', nome: 'Paulo Henrique', empresa: 'PH Incorporadora', email: 'ph@phincorp.com.br', telefone: '(43) 99999-7777', origem: 'indicacao', status: 'convertido', score: 95, vendedor_id: '3', vendedor_nome: 'Pedro Costa', interesse: 'Condomínio 20 casas', created_at: '2024-12-01T10:00:00', updated_at: '2024-12-10T15:00:00' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este lead?')) return;

    try {
      await api.delete(`/crm/leads/${id}`);
      toast.success('Lead excluído com sucesso');
      loadLeads();
    } catch (error) {
      toast.error('Erro ao excluir lead');
    }
  };

  const handleConvert = (lead: Lead) => {
    setSelectedLead(lead);
    setShowConvertModal(true);
  };

  const confirmConvert = async () => {
    if (!selectedLead) return;

    try {
      await api.post(`/crm/leads/${selectedLead.id}/converter`);
      toast.success('Lead convertido em oportunidade!');
      setShowConvertModal(false);
      navigate(`/crm/oportunidades/nova?lead=${selectedLead.id}`);
    } catch (error) {
      toast.error('Erro ao converter lead');
    }
  };

  const handleChangeStatus = async (lead: Lead, novoStatus: string) => {
    try {
      await api.put(`/crm/leads/${lead.id}`, { status: novoStatus });
      toast.success('Status atualizado');
      loadLeads();
    } catch (error) {
      toast.error('Erro ao atualizar status');
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchSearch =
      l.nome?.toLowerCase().includes(search.toLowerCase()) ||
      l.empresa?.toLowerCase().includes(search.toLowerCase()) ||
      l.email?.toLowerCase().includes(search.toLowerCase()) ||
      l.telefone?.includes(search);

    const matchOrigem = !origemFilter || l.origem === origemFilter;
    const matchStatus = !statusFilter || l.status === statusFilter;

    return matchSearch && matchOrigem && matchStatus;
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const columns = [
    {
      key: 'score',
      header: 'Score',
      width: '80px',
      render: (l: Lead) => (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getScoreColor(l.score)}`}>
          {l.score}
        </div>
      ),
    },
    {
      key: 'nome',
      header: 'Lead',
      sortable: true,
      render: (l: Lead) => (
        <div>
          <p className="font-medium text-gray-900">{l.nome}</p>
          {l.empresa && <p className="text-sm text-gray-500">{l.empresa}</p>}
        </div>
      ),
    },
    {
      key: 'contato',
      header: 'Contato',
      render: (l: Lead) => (
        <div className="text-sm">
          {l.email && (
            <p className="flex items-center gap-1 text-gray-600">
              <Icons.mail className="w-3 h-3" /> {l.email}
            </p>
          )}
          {l.telefone && (
            <p className="flex items-center gap-1 text-gray-600">
              <Icons.phone className="w-3 h-3" /> {l.telefone}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'origem',
      header: 'Origem',
      width: '130px',
      render: (l: Lead) => <span className="text-sm">{origemConfig[l.origem]}</span>,
    },
    {
      key: 'interesse',
      header: 'Interesse',
      render: (l: Lead) => (
        <p className="text-sm text-gray-600 truncate max-w-[200px]" title={l.interesse}>
          {l.interesse || '-'}
        </p>
      ),
    },
    {
      key: 'vendedor',
      header: 'Responsável',
      width: '130px',
      render: (l: Lead) => l.vendedor_nome || (
        <span className="text-gray-400 italic">Não atribuído</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (l: Lead) => {
        const config = statusConfig[l.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (lead: Lead) => {
    const items = [
      {
        label: 'Ver Detalhes',
        icon: <Icons.eye className="w-4 h-4" />,
        onClick: () => navigate(`/crm/leads/${lead.id}`),
      },
      {
        label: 'Editar',
        icon: <Icons.edit className="w-4 h-4" />,
        onClick: () => navigate(`/crm/leads/${lead.id}/editar`),
      },
    ];

    if (lead.status !== 'convertido' && lead.status !== 'desqualificado') {
      items.push(
        { type: 'separator' as const },
        {
          label: 'Converter em Oportunidade',
          icon: <Icons.arrowRight className="w-4 h-4" />,
          variant: 'success' as const,
          onClick: () => handleConvert(lead),
        }
      );
    }

    if (lead.status === 'novo') {
      items.push({
        label: 'Marcar como Contatado',
        icon: <Icons.phone className="w-4 h-4" />,
        onClick: () => handleChangeStatus(lead, 'contatado'),
      });
    }

    items.push(
      { type: 'separator' as const },
      {
        label: 'Desqualificar',
        icon: <Icons.xCircle className="w-4 h-4" />,
        variant: 'danger' as const,
        onClick: () => handleChangeStatus(lead, 'desqualificado'),
      },
      {
        label: 'Excluir',
        icon: <Icons.trash className="w-4 h-4" />,
        variant: 'danger' as const,
        onClick: () => handleDelete(lead.id),
      }
    );

    return items;
  };

  const stats = {
    total: leads.length,
    novos: leads.filter(l => l.status === 'novo').length,
    qualificados: leads.filter(l => l.status === 'qualificado').length,
    convertidos: leads.filter(l => l.status === 'convertido').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500">Gerencie seus leads e potenciais clientes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            leftIcon={<Icons.download className="w-4 h-4" />}
          >
            Importar
          </Button>
          <Button
            leftIcon={<Icons.plus className="w-5 h-5" />}
            onClick={() => navigate('/crm/leads/novo')}
          >
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total de Leads</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icons.star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.novos}</p>
              <p className="text-sm text-gray-500">Novos</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.checkCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.qualificados}</p>
              <p className="text-sm text-gray-500">Qualificados</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Icons.arrowRight className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.convertidos}</p>
              <p className="text-sm text-gray-500">Convertidos</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por nome, empresa, email, telefone..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select
              value={origemFilter}
              onChange={setOrigemFilter}
              options={origemOptions}
              placeholder="Origem"
            />
          </div>
          <div className="w-48">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              placeholder="Status"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredLeads}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum lead encontrado"
          onRowClick={(l) => navigate(`/crm/leads/${l.id}`)}
        />
      </Card>

      {/* Convert Modal */}
      <Modal
        isOpen={showConvertModal}
        onClose={() => setShowConvertModal(false)}
        title="Converter Lead em Oportunidade"
      >
        {selectedLead && (
          <div className="space-y-4">
            <p className="text-gray-600">
              Você está prestes a converter o lead <strong>{selectedLead.nome}</strong>
              {selectedLead.empresa && ` (${selectedLead.empresa})`} em uma oportunidade de venda.
            </p>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Interesse identificado:</p>
              <p className="font-medium">{selectedLead.interesse || 'Não informado'}</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600">
                <Icons.info className="w-4 h-4 inline mr-1" />
                Ao converter, você será direcionado para criar a oportunidade com os dados do lead já preenchidos.
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConvertModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={confirmConvert}
              >
                Converter e Criar Oportunidade
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default LeadsPage;
