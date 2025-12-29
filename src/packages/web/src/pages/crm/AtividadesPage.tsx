// =============================================
// PLANAC ERP - CRM Atividades Page
// =============================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import api from '@/services/api';

interface Atividade {
  id: string;
  tipo: 'ligacao' | 'email' | 'reuniao' | 'visita' | 'tarefa' | 'follow_up';
  titulo: string;
  descricao?: string;
  oportunidade_id?: string;
  oportunidade_titulo?: string;
  cliente_id?: string;
  cliente_nome?: string;
  vendedor_id: string;
  vendedor_nome: string;
  data_prevista: string;
  data_realizada?: string;
  duracao_minutos?: number;
  status: 'pendente' | 'concluida' | 'cancelada' | 'atrasada';
  resultado?: string;
  proxima_acao?: string;
  created_at: string;
}

const tipoOptions = [
  { value: '', label: 'Todos os tipos' },
  { value: 'ligacao', label: '📞 Ligação' },
  { value: 'email', label: '📧 Email' },
  { value: 'reuniao', label: '📅 Reunião' },
  { value: 'visita', label: '🏢 Visita' },
  { value: 'tarefa', label: '✅ Tarefa' },
  { value: 'follow_up', label: '🔄 Follow-up' },
];

const statusOptions = [
  { value: '', label: 'Todos os status' },
  { value: 'pendente', label: 'Pendentes' },
  { value: 'atrasada', label: 'Atrasadas' },
  { value: 'concluida', label: 'Concluídas' },
  { value: 'cancelada', label: 'Canceladas' },
];

const periodoOptions = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'amanha', label: 'Amanhã' },
  { value: 'semana', label: 'Esta Semana' },
  { value: 'mes', label: 'Este Mês' },
  { value: 'atrasadas', label: 'Atrasadas' },
  { value: 'todas', label: 'Todas' },
];

const tipoConfig: Record<string, { icon: string; label: string; cor: string }> = {
  ligacao: { icon: '📞', label: 'Ligação', cor: 'bg-blue-100 text-blue-600' },
  email: { icon: '📧', label: 'Email', cor: 'bg-purple-100 text-purple-600' },
  reuniao: { icon: '📅', label: 'Reunião', cor: 'bg-green-100 text-green-600' },
  visita: { icon: '🏢', label: 'Visita', cor: 'bg-orange-100 text-orange-600' },
  tarefa: { icon: '✅', label: 'Tarefa', cor: 'bg-gray-100 text-gray-600' },
  follow_up: { icon: '🔄', label: 'Follow-up', cor: 'bg-yellow-100 text-yellow-600' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'info' | 'success' | 'warning' | 'danger' }> = {
  pendente: { label: 'Pendente', variant: 'info' },
  atrasada: { label: 'Atrasada', variant: 'danger' },
  concluida: { label: 'Concluída', variant: 'success' },
  cancelada: { label: 'Cancelada', variant: 'default' },
};

export function AtividadesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('semana');
  const [showConcluirModal, setShowConcluirModal] = useState(false);
  const [selectedAtividade, setSelectedAtividade] = useState<Atividade | null>(null);
  const [resultado, setResultado] = useState('');
  const [proximaAcao, setProximaAcao] = useState('');
  const [viewMode, setViewMode] = useState<'lista' | 'calendario'>('lista');

  useEffect(() => {
    loadAtividades();
  }, [periodoFilter, statusFilter, tipoFilter]);

  const loadAtividades = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (periodoFilter) params.append('periodo', periodoFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (tipoFilter) params.append('tipo', tipoFilter);

      const response = await api.get<{ success: boolean; data: Atividade[] }>(
        `/crm/atividades?${params.toString()}`
      );
      if (response.success) {
        setAtividades(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar atividades');
      // Mock data
      const hoje = new Date();
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      const ontem = new Date(hoje);
      ontem.setDate(ontem.getDate() - 1);
      const semanaPassada = new Date(hoje);
      semanaPassada.setDate(semanaPassada.getDate() - 7);

      setAtividades([
        { id: '1', tipo: 'ligacao', titulo: 'Follow-up proposta Shopping', oportunidade_id: '1', oportunidade_titulo: 'Obra Shopping Center', cliente_nome: 'Construtora ABC', vendedor_id: '1', vendedor_nome: 'João Silva', data_prevista: hoje.toISOString(), status: 'pendente', created_at: ontem.toISOString() },
        { id: '2', tipo: 'reuniao', titulo: 'Apresentação técnica Steel Frame', oportunidade_id: '2', oportunidade_titulo: 'Hotel Marina', cliente_nome: 'Rede Hoteleira XYZ', vendedor_id: '2', vendedor_nome: 'Maria Santos', data_prevista: hoje.toISOString(), duracao_minutos: 60, status: 'pendente', created_at: ontem.toISOString() },
        { id: '3', tipo: 'email', titulo: 'Enviar orçamento revisado', oportunidade_id: '3', oportunidade_titulo: 'Escritório Tech', cliente_nome: 'Tech Solutions', vendedor_id: '1', vendedor_nome: 'João Silva', data_prevista: amanha.toISOString(), status: 'pendente', created_at: hoje.toISOString() },
        { id: '4', tipo: 'visita', titulo: 'Visita técnica - medição', oportunidade_id: '4', oportunidade_titulo: 'Clínica Saúde+', cliente_nome: 'Clínica Saúde+', vendedor_id: '3', vendedor_nome: 'Pedro Costa', data_prevista: amanha.toISOString(), duracao_minutos: 120, status: 'pendente', created_at: hoje.toISOString() },
        { id: '5', tipo: 'follow_up', titulo: 'Verificar decisão do cliente', oportunidade_id: '5', oportunidade_titulo: 'Galpão Industrial', cliente_nome: 'Indústria Metal', vendedor_id: '2', vendedor_nome: 'Maria Santos', data_prevista: semanaPassada.toISOString(), status: 'atrasada', created_at: semanaPassada.toISOString() },
        { id: '6', tipo: 'ligacao', titulo: 'Confirmar recebimento proposta', oportunidade_id: '1', oportunidade_titulo: 'Obra Shopping Center', cliente_nome: 'Construtora ABC', vendedor_id: '1', vendedor_nome: 'João Silva', data_prevista: ontem.toISOString(), data_realizada: ontem.toISOString(), status: 'concluida', resultado: 'Cliente recebeu e está analisando. Retornar em 3 dias.', created_at: semanaPassada.toISOString() },
        { id: '7', tipo: 'tarefa', titulo: 'Preparar apresentação comercial', vendedor_id: '2', vendedor_nome: 'Maria Santos', data_prevista: hoje.toISOString(), status: 'pendente', descricao: 'Incluir casos de sucesso e fotos de obras', created_at: ontem.toISOString() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConcluir = (atividade: Atividade) => {
    setSelectedAtividade(atividade);
    setResultado('');
    setProximaAcao('');
    setShowConcluirModal(true);
  };

  const confirmConcluir = async () => {
    if (!selectedAtividade) return;

    try {
      await api.put(`/crm/atividades/${selectedAtividade.id}`, {
        status: 'concluida',
        data_realizada: new Date().toISOString(),
        resultado,
        proxima_acao: proximaAcao,
      });
      toast.success('Atividade concluída!');
      setShowConcluirModal(false);
      loadAtividades();

      // Se tem próxima ação, oferecer criar nova atividade
      if (proximaAcao) {
        const criar = confirm('Deseja criar uma nova atividade para a próxima ação?');
        if (criar) {
          navigate(`/crm/atividades/nova?oportunidade=${selectedAtividade.oportunidade_id}&titulo=${encodeURIComponent(proximaAcao)}`);
        }
      }
    } catch (error) {
      toast.error('Erro ao concluir atividade');
    }
  };

  const handleCancelar = async (atividade: Atividade) => {
    if (!confirm('Deseja cancelar esta atividade?')) return;

    try {
      await api.put(`/crm/atividades/${atividade.id}`, { status: 'cancelada' });
      toast.success('Atividade cancelada');
      loadAtividades();
    } catch (error) {
      toast.error('Erro ao cancelar atividade');
    }
  };

  const handleReagendar = async (atividade: Atividade) => {
    const novaData = prompt('Nova data (DD/MM/AAAA HH:MM):');
    if (!novaData) return;

    // Parse da data brasileira
    const [dataPart, horaPart] = novaData.split(' ');
    const [dia, mes, ano] = dataPart.split('/');
    const [hora, minuto] = (horaPart || '09:00').split(':');
    const dataISO = new Date(
      parseInt(ano), 
      parseInt(mes) - 1, 
      parseInt(dia), 
      parseInt(hora), 
      parseInt(minuto)
    ).toISOString();

    try {
      await api.put(`/crm/atividades/${atividade.id}`, { 
        data_prevista: dataISO,
        status: 'pendente'
      });
      toast.success('Atividade reagendada');
      loadAtividades();
    } catch (error) {
      toast.error('Erro ao reagendar atividade');
    }
  };

  const filteredAtividades = atividades.filter((a) => {
    const matchSearch =
      a.titulo.toLowerCase().includes(search.toLowerCase()) ||
      a.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      a.oportunidade_titulo?.toLowerCase().includes(search.toLowerCase());

    return matchSearch;
  });

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const isAtrasada = (atividade: Atividade) => {
    if (atividade.status === 'concluida' || atividade.status === 'cancelada') return false;
    return new Date(atividade.data_prevista) < new Date();
  };

  const groupByDate = (atividades: Atividade[]) => {
    const groups: Record<string, Atividade[]> = {};
    atividades.forEach((a) => {
      const date = formatDate(a.data_prevista);
      if (!groups[date]) groups[date] = [];
      groups[date].push(a);
    });
    return groups;
  };

  const stats = {
    total: atividades.length,
    pendentes: atividades.filter(a => a.status === 'pendente').length,
    atrasadas: atividades.filter(a => a.status === 'atrasada' || isAtrasada(a)).length,
    concluidas: atividades.filter(a => a.status === 'concluida').length,
  };

  const groupedAtividades = groupByDate(filteredAtividades);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Atividades</h1>
          <p className="text-gray-500">Gerencie suas tarefas e follow-ups</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('lista')}
              className={`px-3 py-2 text-sm ${viewMode === 'lista' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
            >
              <Icons.list className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('calendario')}
              className={`px-3 py-2 text-sm ${viewMode === 'calendario' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
            >
              <Icons.calendar className="w-4 h-4" />
            </button>
          </div>
          <Button
            leftIcon={<Icons.plus className="w-5 h-5" />}
            onClick={() => navigate('/crm/atividades/nova')}
          >
            Nova Atividade
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Icons.clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pendentes}</p>
              <p className="text-sm text-gray-500">Pendentes</p>
            </div>
          </div>
        </Card>
        <Card padding="sm" className={stats.atrasadas > 0 ? 'border-red-200 bg-red-50' : ''}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Icons.alertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.atrasadas}</p>
              <p className="text-sm text-gray-500">Atrasadas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.checkCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.concluidas}</p>
              <p className="text-sm text-gray-500">Concluídas</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar atividade, cliente, oportunidade..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              value={periodoFilter}
              onChange={setPeriodoFilter}
              options={periodoOptions}
              placeholder="Período"
            />
          </div>
          <div className="w-40">
            <Select
              value={tipoFilter}
              onChange={setTipoFilter}
              options={tipoOptions}
              placeholder="Tipo"
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
        </div>
      </Card>

      {/* Activities List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Icons.spinner className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedAtividades).map(([date, atividades]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                <Icons.calendar className="w-4 h-4" />
                {date === formatDate(new Date().toISOString()) ? 'Hoje' : 
                 date === formatDate(new Date(Date.now() + 86400000).toISOString()) ? 'Amanhã' : date}
                <Badge variant="default" size="sm">{atividades.length}</Badge>
              </h3>
              <div className="space-y-2">
                {atividades.map((atividade) => {
                  const tipo = tipoConfig[atividade.tipo];
                  const atrasada = isAtrasada(atividade);
                  const status = atrasada && atividade.status === 'pendente' ? 'atrasada' : atividade.status;
                  const statusInfo = statusConfig[status];

                  return (
                    <Card
                      key={atividade.id}
                      className={`hover:shadow-md transition-shadow cursor-pointer ${
                        atrasada ? 'border-red-200 bg-red-50' : ''
                      } ${atividade.status === 'concluida' ? 'opacity-60' : ''}`}
                      onClick={() => navigate(`/crm/atividades/${atividade.id}`)}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Tipo Icon */}
                          <div className={`p-3 rounded-lg ${tipo.cor}`}>
                            <span className="text-xl">{tipo.icon}</span>
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{atividade.titulo}</h4>
                                {atividade.oportunidade_titulo && (
                                  <p className="text-sm text-gray-500">
                                    <Icons.target className="w-3 h-3 inline mr-1" />
                                    {atividade.oportunidade_titulo}
                                    {atividade.cliente_nome && ` • ${atividade.cliente_nome}`}
                                  </p>
                                )}
                              </div>
                              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                            </div>

                            {atividade.descricao && (
                              <p className="text-sm text-gray-600 mt-2">{atividade.descricao}</p>
                            )}

                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Icons.clock className="w-3 h-3" />
                                {formatDateTime(atividade.data_prevista)}
                              </span>
                              {atividade.duracao_minutos && (
                                <span className="flex items-center gap-1">
                                  <Icons.timer className="w-3 h-3" />
                                  {atividade.duracao_minutos} min
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Icons.user className="w-3 h-3" />
                                {atividade.vendedor_nome}
                              </span>
                            </div>

                            {atividade.resultado && (
                              <div className="mt-2 p-2 bg-green-50 rounded text-sm text-green-700">
                                <strong>Resultado:</strong> {atividade.resultado}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          {atividade.status !== 'concluida' && atividade.status !== 'cancelada' && (
                            <div className="flex flex-col gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleConcluir(atividade)}
                                className="text-green-600"
                              >
                                <Icons.check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleReagendar(atividade)}
                                className="text-blue-600"
                              >
                                <Icons.calendar className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancelar(atividade)}
                                className="text-red-600"
                              >
                                <Icons.x className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {Object.keys(groupedAtividades).length === 0 && (
            <Card>
              <div className="p-8 text-center text-gray-500">
                <Icons.calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma atividade encontrada</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => navigate('/crm/atividades/nova')}
                >
                  Criar Atividade
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Concluir Modal */}
      <Modal
        isOpen={showConcluirModal}
        onClose={() => setShowConcluirModal(false)}
        title="Concluir Atividade"
        size="md"
      >
        {selectedAtividade && (
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{selectedAtividade.titulo}</p>
              {selectedAtividade.oportunidade_titulo && (
                <p className="text-sm text-gray-500">{selectedAtividade.oportunidade_titulo}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resultado / O que foi feito?
              </label>
              <Textarea
                value={resultado}
                onChange={(e) => setResultado(e.target.value)}
                placeholder="Descreva o resultado da atividade..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Próxima ação (opcional)
              </label>
              <Input
                value={proximaAcao}
                onChange={(e) => setProximaAcao(e.target.value)}
                placeholder="Ex: Enviar proposta revisada"
              />
              <p className="text-xs text-gray-500 mt-1">
                Se preenchido, você poderá criar uma nova atividade automaticamente
              </p>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConcluirModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={confirmConcluir}
              >
                <Icons.check className="w-4 h-4 mr-2" />
                Concluir Atividade
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AtividadesPage;
