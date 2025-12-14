// =============================================
// PLANAC ERP - Tickets de Suporte
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

interface Ticket {
  id: string;
  numero: string;
  titulo: string;
  descricao: string;
  categoria: 'duvida' | 'problema' | 'solicitacao' | 'reclamacao' | 'sugestao';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  status: 'aberto' | 'em_andamento' | 'aguardando_cliente' | 'aguardando_terceiro' | 'resolvido' | 'fechado';
  cliente_id: string;
  cliente_nome: string;
  cliente_email: string;
  atendente_id?: string;
  atendente_nome?: string;
  data_abertura: string;
  data_primeira_resposta?: string;
  data_resolucao?: string;
  data_fechamento?: string;
  sla_primeira_resposta: number;
  sla_resolucao: number;
  sla_estourado: boolean;
  canal: 'email' | 'telefone' | 'chat' | 'whatsapp' | 'portal';
  tags?: string[];
  mensagens: {
    id: string;
    tipo: 'cliente' | 'atendente' | 'sistema';
    autor: string;
    conteudo: string;
    data: string;
    anexos?: string[];
  }[];
}

interface Atendente {
  id: string;
  nome: string;
  tickets_abertos: number;
}

const categoriaConfig = {
  duvida: { label: 'Dúvida', icon: '❓' },
  problema: { label: 'Problema', icon: '🔴' },
  solicitacao: { label: 'Solicitação', icon: '📝' },
  reclamacao: { label: 'Reclamação', icon: '😤' },
  sugestao: { label: 'Sugestão', icon: '💡' },
};

const prioridadeConfig = {
  baixa: { label: 'Baixa', variant: 'default' as const },
  media: { label: 'Média', variant: 'info' as const },
  alta: { label: 'Alta', variant: 'warning' as const },
  urgente: { label: 'Urgente', variant: 'danger' as const },
};

const statusConfig = {
  aberto: { label: 'Aberto', variant: 'danger' as const },
  em_andamento: { label: 'Em Andamento', variant: 'info' as const },
  aguardando_cliente: { label: 'Aguard. Cliente', variant: 'warning' as const },
  aguardando_terceiro: { label: 'Aguard. Terceiro', variant: 'warning' as const },
  resolvido: { label: 'Resolvido', variant: 'success' as const },
  fechado: { label: 'Fechado', variant: 'default' as const },
};

export function TicketsPage() {
  const toast = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [atendentes, setAtendentes] = useState<Atendente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [prioridadeFilter, setPrioridadeFilter] = useState('');
  const [atendenteFilter, setAtendenteFilter] = useState('');
  
  // Modal de detalhes/resposta
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketSelecionado, setTicketSelecionado] = useState<Ticket | null>(null);
  const [resposta, setResposta] = useState('');
  
  // Modal novo ticket
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [novoTicket, setNovoTicket] = useState({
    titulo: '',
    descricao: '',
    categoria: 'duvida',
    prioridade: 'media',
    cliente_id: '',
    canal: 'portal',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [ticketsRes, atendentesRes] = await Promise.all([
        api.get<{ success: boolean; data: Ticket[] }>('/suporte/tickets'),
        api.get<{ success: boolean; data: Atendente[] }>('/suporte/atendentes'),
      ]);
      
      if (ticketsRes.success) setTickets(ticketsRes.data);
      if (atendentesRes.success) setAtendentes(atendentesRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAbrirTicket = (ticket: Ticket) => {
    setTicketSelecionado(ticket);
    setShowTicketModal(true);
  };

  const handleResponder = async () => {
    if (!ticketSelecionado || !resposta.trim()) {
      toast.error('Digite uma resposta');
      return;
    }

    try {
      await api.post(`/suporte/tickets/${ticketSelecionado.id}/resposta`, {
        conteudo: resposta,
      });
      toast.success('Resposta enviada');
      setResposta('');
      loadData();
      // Recarregar ticket
      const res = await api.get<{ success: boolean; data: Ticket }>(`/suporte/tickets/${ticketSelecionado.id}`);
      if (res.success) setTicketSelecionado(res.data);
    } catch (error) {
      toast.error('Erro ao enviar resposta');
    }
  };

  const handleAtribuir = async (ticketId: string, atendenteId: string) => {
    try {
      await api.post(`/suporte/tickets/${ticketId}/atribuir`, { atendente_id: atendenteId });
      toast.success('Ticket atribuído');
      loadData();
    } catch (error) {
      toast.error('Erro ao atribuir ticket');
    }
  };

  const handleAlterarStatus = async (ticketId: string, novoStatus: string) => {
    try {
      await api.put(`/suporte/tickets/${ticketId}/status`, { status: novoStatus });
      toast.success('Status alterado');
      loadData();
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const handleCriarTicket = async () => {
    if (!novoTicket.titulo || !novoTicket.descricao || !novoTicket.cliente_id) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }

    try {
      await api.post('/suporte/tickets', novoTicket);
      toast.success('Ticket criado');
      setShowNovoModal(false);
      setNovoTicket({ titulo: '', descricao: '', categoria: 'duvida', prioridade: 'media', cliente_id: '', canal: 'portal' });
      loadData();
    } catch (error) {
      toast.error('Erro ao criar ticket');
    }
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const calcularTempoAberto = (dataAbertura: string) => {
    const abertura = new Date(dataAbertura);
    const agora = new Date();
    const diffMs = agora.getTime() - abertura.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffHoras / 24);
    
    if (diffDias > 0) return `${diffDias}d ${diffHoras % 24}h`;
    return `${diffHoras}h`;
  };

  const filteredTickets = tickets.filter((t) => {
    const matchSearch = t.numero.includes(search) ||
      t.titulo.toLowerCase().includes(search.toLowerCase()) ||
      t.cliente_nome.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || t.status === statusFilter;
    const matchPrioridade = !prioridadeFilter || t.prioridade === prioridadeFilter;
    const matchAtendente = !atendenteFilter || t.atendente_id === atendenteFilter;
    return matchSearch && matchStatus && matchPrioridade && matchAtendente;
  });

  // Stats
  const stats = {
    abertos: tickets.filter(t => t.status === 'aberto').length,
    emAndamento: tickets.filter(t => t.status === 'em_andamento').length,
    aguardando: tickets.filter(t => ['aguardando_cliente', 'aguardando_terceiro'].includes(t.status)).length,
    slaEstourado: tickets.filter(t => t.sla_estourado && !['resolvido', 'fechado'].includes(t.status)).length,
  };

  const columns = [
    {
      key: 'ticket',
      header: 'Ticket',
      render: (t: Ticket) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg">{categoriaConfig[t.categoria].icon}</span>
            <span className="font-bold">#{t.numero}</span>
            {t.sla_estourado && <Badge variant="danger" className="text-xs">SLA</Badge>}
          </div>
          <p className="text-sm text-gray-700 truncate max-w-[250px]">{t.titulo}</p>
        </div>
      ),
    },
    {
      key: 'cliente',
      header: 'Cliente',
      width: '150px',
      render: (t: Ticket) => (
        <div>
          <p className="text-sm font-medium">{t.cliente_nome}</p>
          <p className="text-xs text-gray-500">{t.canal}</p>
        </div>
      ),
    },
    {
      key: 'prioridade',
      header: 'Prioridade',
      width: '100px',
      render: (t: Ticket) => {
        const config = prioridadeConfig[t.prioridade];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'atendente',
      header: 'Atendente',
      width: '120px',
      render: (t: Ticket) => t.atendente_nome || <span className="text-gray-400">Não atribuído</span>,
    },
    {
      key: 'tempo',
      header: 'Tempo',
      width: '80px',
      render: (t: Ticket) => (
        <span className={t.sla_estourado ? 'text-red-600 font-medium' : ''}>
          {calcularTempoAberto(t.data_abertura)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (t: Ticket) => {
        const config = statusConfig[t.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (ticket: Ticket) => [
    { label: 'Abrir', icon: <Icons.eye className="w-4 h-4" />, onClick: () => handleAbrirTicket(ticket) },
    ...(ticket.status !== 'fechado' ? [
      { label: 'Atribuir', icon: <Icons.user className="w-4 h-4" />, onClick: () => {} },
    ] : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets de Suporte</h1>
          <p className="text-gray-500">Gerencie os chamados dos clientes</p>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => setShowNovoModal(true)}>
          Novo Ticket
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm" className="border-l-4 border-l-red-500">
          <p className="text-sm text-gray-500">Abertos</p>
          <p className="text-2xl font-bold text-red-600">{stats.abertos}</p>
        </Card>
        <Card padding="sm" className="border-l-4 border-l-blue-500">
          <p className="text-sm text-gray-500">Em Andamento</p>
          <p className="text-2xl font-bold text-blue-600">{stats.emAndamento}</p>
        </Card>
        <Card padding="sm" className="border-l-4 border-l-yellow-500">
          <p className="text-sm text-gray-500">Aguardando</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.aguardando}</p>
        </Card>
        <Card padding="sm" className="border-l-4 border-l-red-600">
          <p className="text-sm text-gray-500">SLA Estourado</p>
          <p className="text-2xl font-bold text-red-600">{stats.slaEstourado}</p>
        </Card>
      </div>

      {/* Filtros */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por número, título, cliente..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onChange={setStatusFilter}
            options={[{ value: '', label: 'Todos Status' }, ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label }))]} />
          <Select value={prioridadeFilter} onChange={setPrioridadeFilter}
            options={[{ value: '', label: 'Todas Prioridades' }, ...Object.entries(prioridadeConfig).map(([k, v]) => ({ value: k, label: v.label }))]} />
          <Select value={atendenteFilter} onChange={setAtendenteFilter}
            options={[{ value: '', label: 'Todos Atendentes' }, ...atendentes.map(a => ({ value: a.id, label: a.nome }))]} />
        </div>
      </Card>

      {/* Tabela */}
      <Card padding="none">
        <DataTable data={filteredTickets} columns={columns} actions={actions} isLoading={isLoading} emptyMessage="Nenhum ticket encontrado" />
      </Card>

      {/* Modal Ticket */}
      <Modal isOpen={showTicketModal} onClose={() => setShowTicketModal(false)} title={`Ticket #${ticketSelecionado?.numero}`} size="xl">
        {ticketSelecionado && (
          <div className="space-y-4">
            {/* Info do ticket */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">Cliente</p>
                <p className="font-medium">{ticketSelecionado.cliente_nome}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Categoria</p>
                <p className="font-medium">{categoriaConfig[ticketSelecionado.categoria].icon} {categoriaConfig[ticketSelecionado.categoria].label}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Prioridade</p>
                <Badge variant={prioridadeConfig[ticketSelecionado.prioridade].variant}>{prioridadeConfig[ticketSelecionado.prioridade].label}</Badge>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <Select size="sm" value={ticketSelecionado.status} onChange={(v) => handleAlterarStatus(ticketSelecionado.id, v)}
                  options={Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label }))} />
              </div>
            </div>

            {/* Título e descrição */}
            <div>
              <h4 className="font-bold text-lg">{ticketSelecionado.titulo}</h4>
              <p className="text-gray-600 mt-2">{ticketSelecionado.descricao}</p>
            </div>

            {/* Mensagens */}
            <div className="border-t pt-4">
              <h5 className="font-medium mb-3">Histórico de Mensagens</h5>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {ticketSelecionado.mensagens.map((msg) => (
                  <div key={msg.id} className={`p-3 rounded-lg ${
                    msg.tipo === 'cliente' ? 'bg-gray-100' : msg.tipo === 'atendente' ? 'bg-blue-50' : 'bg-yellow-50'
                  }`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{msg.autor}</span>
                      <span className="text-xs text-gray-500">{formatDateTime(msg.data)}</span>
                    </div>
                    <p className="text-sm">{msg.conteudo}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Responder */}
            {ticketSelecionado.status !== 'fechado' && (
              <div className="border-t pt-4">
                <Input label="Resposta" value={resposta} onChange={(e) => setResposta(e.target.value)} placeholder="Digite sua resposta..." />
                <div className="flex justify-end gap-2 mt-3">
                  <Button variant="secondary" onClick={() => setShowTicketModal(false)}>Fechar</Button>
                  <Button onClick={handleResponder}>Enviar Resposta</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Novo Ticket */}
      <Modal isOpen={showNovoModal} onClose={() => setShowNovoModal(false)} title="Novo Ticket" size="md">
        <div className="space-y-4">
          <Input label="Título *" value={novoTicket.titulo} onChange={(e) => setNovoTicket({ ...novoTicket, titulo: e.target.value })} />
          <Input label="Descrição *" value={novoTicket.descricao} onChange={(e) => setNovoTicket({ ...novoTicket, descricao: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Categoria" value={novoTicket.categoria} onChange={(v) => setNovoTicket({ ...novoTicket, categoria: v })}
              options={Object.entries(categoriaConfig).map(([k, v]) => ({ value: k, label: v.label }))} />
            <Select label="Prioridade" value={novoTicket.prioridade} onChange={(v) => setNovoTicket({ ...novoTicket, prioridade: v })}
              options={Object.entries(prioridadeConfig).map(([k, v]) => ({ value: k, label: v.label }))} />
          </div>
          <Select label="Canal" value={novoTicket.canal} onChange={(v) => setNovoTicket({ ...novoTicket, canal: v })}
            options={[
              { value: 'portal', label: 'Portal' },
              { value: 'email', label: 'E-mail' },
              { value: 'telefone', label: 'Telefone' },
              { value: 'chat', label: 'Chat' },
              { value: 'whatsapp', label: 'WhatsApp' },
            ]} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowNovoModal(false)}>Cancelar</Button>
            <Button onClick={handleCriarTicket}>Criar Ticket</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default TicketsPage;
