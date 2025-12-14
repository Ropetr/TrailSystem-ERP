// =============================================
// PLANAC ERP - Gestão de Entregas
// =============================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface Entrega {
  id: string;
  codigo: string;
  pedido_id: string;
  pedido_numero: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
    cep: string;
  };
  data_previsao: string;
  data_entrega?: string;
  horario_preferencial?: string;
  status: 'pendente' | 'em_rota' | 'entregue' | 'tentativa' | 'devolvido' | 'cancelado';
  motorista_id?: string;
  motorista_nome?: string;
  veiculo_placa?: string;
  rota_id?: string;
  ordem_rota?: number;
  volumes: number;
  peso: number;
  valor_frete: number;
  observacao?: string;
  ocorrencias: Array<{
    data: string;
    tipo: string;
    descricao: string;
  }>;
}

const statusConfig = {
  pendente: { label: 'Pendente', variant: 'warning' as const },
  em_rota: { label: 'Em Rota', variant: 'info' as const },
  entregue: { label: 'Entregue', variant: 'success' as const },
  tentativa: { label: 'Tentativa', variant: 'danger' as const },
  devolvido: { label: 'Devolvido', variant: 'danger' as const },
  cancelado: { label: 'Cancelado', variant: 'default' as const },
};

export function EntregasPage() {
  const toast = useToast();
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dataFilter, setDataFilter] = useState(new Date().toISOString().split('T')[0]);
  
  // Modal de detalhes
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [entregaDetalhes, setEntregaDetalhes] = useState<Entrega | null>(null);
  
  // Modal de ocorrência
  const [showOcorrenciaModal, setShowOcorrenciaModal] = useState(false);
  const [ocorrenciaForm, setOcorrenciaForm] = useState({
    tipo: '',
    descricao: '',
  });

  useEffect(() => {
    loadEntregas();
  }, [dataFilter]);

  const loadEntregas = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Entrega[] }>(
        `/logistica/entregas?data=${dataFilter}`
      );
      if (response.success) {
        setEntregas(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar entregas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmarEntrega = async (entrega: Entrega) => {
    try {
      await api.post(`/logistica/entregas/${entrega.id}/confirmar`);
      toast.success('Entrega confirmada');
      loadEntregas();
    } catch (error) {
      toast.error('Erro ao confirmar entrega');
    }
  };

  const handleRegistrarOcorrencia = async () => {
    if (!entregaDetalhes || !ocorrenciaForm.tipo || !ocorrenciaForm.descricao) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      await api.post(`/logistica/entregas/${entregaDetalhes.id}/ocorrencia`, ocorrenciaForm);
      toast.success('Ocorrência registrada');
      setShowOcorrenciaModal(false);
      setOcorrenciaForm({ tipo: '', descricao: '' });
      loadEntregas();
    } catch (error) {
      toast.error('Erro ao registrar ocorrência');
    }
  };

  const handleReagendar = async (entrega: Entrega, novaData: string) => {
    try {
      await api.post(`/logistica/entregas/${entrega.id}/reagendar`, { data_previsao: novaData });
      toast.success('Entrega reagendada');
      loadEntregas();
    } catch (error) {
      toast.error('Erro ao reagendar');
    }
  };

  const filteredEntregas = entregas.filter((entrega) => {
    const matchSearch =
      entrega.codigo?.includes(search) ||
      entrega.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      entrega.pedido_numero?.includes(search) ||
      entrega.endereco?.bairro?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || entrega.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');
  const formatTime = (date: string) => new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Estatísticas
  const stats = {
    total: filteredEntregas.length,
    pendentes: filteredEntregas.filter(e => e.status === 'pendente').length,
    emRota: filteredEntregas.filter(e => e.status === 'em_rota').length,
    entregues: filteredEntregas.filter(e => e.status === 'entregue').length,
    problemas: filteredEntregas.filter(e => ['tentativa', 'devolvido'].includes(e.status)).length,
  };

  const columns = [
    {
      key: 'codigo',
      header: 'Código',
      width: '100px',
      render: (e: Entrega) => <span className="font-mono font-bold">{e.codigo}</span>,
    },
    {
      key: 'cliente',
      header: 'Cliente / Endereço',
      render: (e: Entrega) => (
        <div>
          <p className="font-medium text-gray-900">{e.cliente_nome}</p>
          <p className="text-sm text-gray-500">
            {e.endereco.logradouro}, {e.endereco.numero} - {e.endereco.bairro}
          </p>
        </div>
      ),
    },
    {
      key: 'motorista',
      header: 'Motorista',
      width: '150px',
      render: (e: Entrega) => e.motorista_nome ? (
        <div>
          <p className="text-sm">{e.motorista_nome}</p>
          <p className="text-xs text-gray-500">{e.veiculo_placa}</p>
        </div>
      ) : <span className="text-gray-400">-</span>,
    },
    {
      key: 'volumes',
      header: 'Vol/Peso',
      width: '80px',
      render: (e: Entrega) => (
        <div className="text-sm">
          <p>{e.volumes} vol</p>
          <p className="text-gray-500">{e.peso}kg</p>
        </div>
      ),
    },
    {
      key: 'horario',
      header: 'Horário',
      width: '100px',
      render: (e: Entrega) => (
        <span className="text-sm">{e.horario_preferencial || 'Comercial'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (e: Entrega) => {
        const config = statusConfig[e.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (entrega: Entrega) => {
    const items = [
      {
        label: 'Ver Detalhes',
        icon: <Icons.eye className="w-4 h-4" />,
        onClick: () => {
          setEntregaDetalhes(entrega);
          setShowDetalhesModal(true);
        },
      },
    ];

    if (entrega.status === 'em_rota') {
      items.push({
        label: 'Confirmar Entrega',
        icon: <Icons.check className="w-4 h-4" />,
        variant: 'success' as const,
        onClick: () => handleConfirmarEntrega(entrega),
      });
    }

    if (['pendente', 'em_rota'].includes(entrega.status)) {
      items.push({
        label: 'Registrar Ocorrência',
        icon: <Icons.x className="w-4 h-4" />,
        onClick: () => {
          setEntregaDetalhes(entrega);
          setShowOcorrenciaModal(true);
        },
      });
    }

    if (entrega.status === 'tentativa') {
      items.push({
        label: 'Reagendar',
        icon: <Icons.edit className="w-4 h-4" />,
        onClick: () => {},
      });
    }

    items.push({
      label: 'Rastrear',
      icon: <Icons.eye className="w-4 h-4" />,
      onClick: () => window.open(`/rastreio/${entrega.codigo}`, '_blank'),
    });

    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Entregas</h1>
          <p className="text-gray-500">Acompanhe e gerencie as entregas do dia</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={dataFilter}
            onChange={(e) => setDataFilter(e.target.value)}
            className="w-40"
          />
          <Button variant="secondary" leftIcon={<Icons.printer className="w-5 h-5" />}>
            Romaneio
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Pendentes</p>
          <p className="text-2xl font-bold text-orange-600">{stats.pendentes}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Em Rota</p>
          <p className="text-2xl font-bold text-blue-600">{stats.emRota}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Entregues</p>
          <p className="text-2xl font-bold text-green-600">{stats.entregues}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Problemas</p>
          <p className="text-2xl font-bold text-red-600">{stats.problemas}</p>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por código, cliente, pedido, bairro..."
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
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredEntregas}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma entrega encontrada"
        />
      </Card>

      {/* Modal Detalhes */}
      <Modal
        isOpen={showDetalhesModal}
        onClose={() => setShowDetalhesModal(false)}
        title={`Entrega ${entregaDetalhes?.codigo}`}
        size="lg"
      >
        {entregaDetalhes && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Cliente</p>
                <p className="font-medium">{entregaDetalhes.cliente_nome}</p>
                <p className="text-sm text-gray-500">{entregaDetalhes.cliente_telefone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Pedido</p>
                <p className="font-medium">{entregaDetalhes.pedido_numero}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Endereço de Entrega</p>
              <p className="font-medium">
                {entregaDetalhes.endereco.logradouro}, {entregaDetalhes.endereco.numero}
                {entregaDetalhes.endereco.complemento && ` - ${entregaDetalhes.endereco.complemento}`}
              </p>
              <p className="text-sm text-gray-500">
                {entregaDetalhes.endereco.bairro} - {entregaDetalhes.endereco.cidade}/{entregaDetalhes.endereco.uf}
              </p>
              <p className="text-sm text-gray-500">CEP: {entregaDetalhes.endereco.cep}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500">Volumes</p>
                <p className="font-medium">{entregaDetalhes.volumes}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Peso</p>
                <p className="font-medium">{entregaDetalhes.peso} kg</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Frete</p>
                <p className="font-medium">{formatCurrency(entregaDetalhes.valor_frete)}</p>
              </div>
            </div>
            
            {entregaDetalhes.ocorrencias.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Histórico de Ocorrências</p>
                <div className="space-y-2">
                  {entregaDetalhes.ocorrencias.map((oc, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <Badge variant="default">{oc.tipo}</Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(oc.data)} {formatTime(oc.data)}
                        </span>
                      </div>
                      <p className="text-sm mt-1">{oc.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Ocorrência */}
      <Modal
        isOpen={showOcorrenciaModal}
        onClose={() => setShowOcorrenciaModal(false)}
        title="Registrar Ocorrência"
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Tipo de Ocorrência"
            value={ocorrenciaForm.tipo}
            onChange={(v) => setOcorrenciaForm({ ...ocorrenciaForm, tipo: v })}
            options={[
              { value: '', label: 'Selecione...' },
              { value: 'ausente', label: 'Cliente Ausente' },
              { value: 'endereco_incorreto', label: 'Endereço Incorreto' },
              { value: 'recusa', label: 'Recusa de Recebimento' },
              { value: 'avaria', label: 'Mercadoria Avariada' },
              { value: 'acesso_restrito', label: 'Acesso Restrito' },
              { value: 'outro', label: 'Outro' },
            ]}
          />
          
          <Input
            label="Descrição"
            value={ocorrenciaForm.descricao}
            onChange={(e) => setOcorrenciaForm({ ...ocorrenciaForm, descricao: e.target.value })}
            placeholder="Descreva a ocorrência..."
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowOcorrenciaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarOcorrencia}>
              Registrar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default EntregasPage;
