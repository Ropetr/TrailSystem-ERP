// =============================================
// PLANAC ERP - CRM Dashboard Page
// =============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface DashboardMetrics {
  total_oportunidades: number;
  valor_total_pipeline: number;
  oportunidades_mes: number;
  valor_ganho_mes: number;
  taxa_conversao: number;
  ticket_medio: number;
  oportunidades_por_etapa: {
    etapa: string;
    quantidade: number;
    valor: number;
  }[];
  oportunidades_por_vendedor: {
    vendedor_id: string;
    vendedor_nome: string;
    quantidade: number;
    valor: number;
  }[];
  proximas_atividades: {
    id: string;
    tipo: string;
    titulo: string;
    data_prevista: string;
    oportunidade_titulo: string;
    cliente_nome: string;
  }[];
  oportunidades_atrasadas: {
    id: string;
    titulo: string;
    cliente_nome: string;
    dias_parado: number;
    valor: number;
  }[];
}

const periodoOptions = [
  { value: 'mes', label: 'Este Mês' },
  { value: 'trimestre', label: 'Este Trimestre' },
  { value: 'ano', label: 'Este Ano' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
];

const etapaCores: Record<string, string> = {
  'prospeccao': 'bg-gray-500',
  'qualificacao': 'bg-blue-500',
  'proposta': 'bg-yellow-500',
  'negociacao': 'bg-orange-500',
  'fechamento': 'bg-green-500',
};

export function CRMDashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');

  useEffect(() => {
    loadMetrics();
  }, [periodo]);

  const loadMetrics = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: DashboardMetrics }>(
        `/crm/dashboard?periodo=${periodo}`
      );
      if (response.success) {
        setMetrics(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar métricas do CRM');
      // Dados mock para desenvolvimento
      setMetrics({
        total_oportunidades: 45,
        valor_total_pipeline: 850000,
        oportunidades_mes: 12,
        valor_ganho_mes: 125000,
        taxa_conversao: 32,
        ticket_medio: 18500,
        oportunidades_por_etapa: [
          { etapa: 'Prospecção', quantidade: 15, valor: 180000 },
          { etapa: 'Qualificação', quantidade: 12, valor: 220000 },
          { etapa: 'Proposta', quantidade: 8, valor: 200000 },
          { etapa: 'Negociação', quantidade: 6, valor: 150000 },
          { etapa: 'Fechamento', quantidade: 4, valor: 100000 },
        ],
        oportunidades_por_vendedor: [
          { vendedor_id: '1', vendedor_nome: 'João Silva', quantidade: 15, valor: 280000 },
          { vendedor_id: '2', vendedor_nome: 'Maria Santos', quantidade: 12, valor: 230000 },
          { vendedor_id: '3', vendedor_nome: 'Pedro Costa', quantidade: 10, valor: 190000 },
          { vendedor_id: '4', vendedor_nome: 'Ana Oliveira', quantidade: 8, valor: 150000 },
        ],
        proximas_atividades: [
          { id: '1', tipo: 'ligacao', titulo: 'Follow-up proposta', data_prevista: '2024-12-15T10:00:00', oportunidade_titulo: 'Obra Shopping Center', cliente_nome: 'Construtora ABC' },
          { id: '2', tipo: 'reuniao', titulo: 'Apresentação técnica', data_prevista: '2024-12-15T14:00:00', oportunidade_titulo: 'Hotel Marina', cliente_nome: 'Rede Hoteleira XYZ' },
          { id: '3', tipo: 'email', titulo: 'Enviar orçamento revisado', data_prevista: '2024-12-16T09:00:00', oportunidade_titulo: 'Reforma Escritório', cliente_nome: 'Tech Solutions' },
        ],
        oportunidades_atrasadas: [
          { id: '1', titulo: 'Galpão Industrial', cliente_nome: 'Indústria Metal', dias_parado: 15, valor: 85000 },
          { id: '2', titulo: 'Clínica Médica', cliente_nome: 'Clínica Saúde+', dias_parado: 10, valor: 42000 },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAtividadeIcon = (tipo: string) => {
    switch (tipo) {
      case 'ligacao': return <Icons.phone className="w-4 h-4" />;
      case 'reuniao': return <Icons.calendar className="w-4 h-4" />;
      case 'email': return <Icons.mail className="w-4 h-4" />;
      case 'visita': return <Icons.mapPin className="w-4 h-4" />;
      default: return <Icons.clock className="w-4 h-4" />;
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icons.spinner className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const maxValorEtapa = Math.max(...metrics.oportunidades_por_etapa.map(e => e.valor));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM - Dashboard</h1>
          <p className="text-gray-500">Visão geral do seu funil de vendas</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={periodo}
            onChange={setPeriodo}
            options={periodoOptions}
            className="w-48"
          />
          <Button
            variant="outline"
            leftIcon={<Icons.refresh className="w-4 h-4" />}
            onClick={loadMetrics}
          >
            Atualizar
          </Button>
          <Button
            leftIcon={<Icons.plus className="w-5 h-5" />}
            onClick={() => navigate('/crm/oportunidades/nova')}
          >
            Nova Oportunidade
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Pipeline Total</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(metrics.valor_total_pipeline)}
                </p>
                <p className="text-blue-100 text-sm mt-1">
                  {metrics.total_oportunidades} oportunidades
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Icons.trendingUp className="w-8 h-8" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Ganho no Mês</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(metrics.valor_ganho_mes)}
                </p>
                <p className="text-green-100 text-sm mt-1">
                  {metrics.oportunidades_mes} fechamentos
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Icons.dollarSign className="w-8 h-8" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Taxa de Conversão</p>
                <p className="text-3xl font-bold mt-1">
                  {metrics.taxa_conversao}%
                </p>
                <p className="text-purple-100 text-sm mt-1">
                  Média do período
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Icons.target className="w-8 h-8" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Ticket Médio</p>
                <p className="text-3xl font-bold mt-1">
                  {formatCurrency(metrics.ticket_medio)}
                </p>
                <p className="text-orange-100 text-sm mt-1">
                  Por oportunidade
                </p>
              </div>
              <div className="p-3 bg-white/20 rounded-lg">
                <Icons.shoppingCart className="w-8 h-8" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Funil de Vendas + Ranking Vendedores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funil de Vendas */}
        <Card>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Funil de Vendas</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/crm/pipeline')}
              >
                Ver Pipeline <Icons.arrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {metrics.oportunidades_por_etapa.map((etapa, index) => (
              <div key={etapa.etapa} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700">{etapa.etapa}</span>
                  <span className="text-gray-500">
                    {etapa.quantidade} • {formatCurrency(etapa.valor)}
                  </span>
                </div>
                <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${Object.values(etapaCores)[index]} transition-all duration-500 flex items-center justify-end pr-2`}
                    style={{ width: `${(etapa.valor / maxValorEtapa) * 100}%` }}
                  >
                    <span className="text-xs font-medium text-white">
                      {((etapa.valor / metrics.valor_total_pipeline) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Ranking Vendedores */}
        <Card>
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Ranking de Vendedores</h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {metrics.oportunidades_por_vendedor.map((vendedor, index) => (
                <div
                  key={vendedor.vendedor_id}
                  className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{vendedor.vendedor_nome}</p>
                    <p className="text-sm text-gray-500">
                      {vendedor.quantidade} oportunidades
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(vendedor.valor)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Atividades + Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximas Atividades */}
        <Card>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Próximas Atividades</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/crm/atividades')}
              >
                Ver Todas <Icons.arrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
          <div className="divide-y">
            {metrics.proximas_atividades.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Icons.calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Nenhuma atividade agendada</p>
              </div>
            ) : (
              metrics.proximas_atividades.map((atividade) => (
                <div
                  key={atividade.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/crm/atividades/${atividade.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {getAtividadeIcon(atividade.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{atividade.titulo}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {atividade.oportunidade_titulo} • {atividade.cliente_nome}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="info" size="sm">
                        {formatDate(atividade.data_prevista)}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Oportunidades Paradas */}
        <Card>
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Icons.alertTriangle className="w-5 h-5 text-yellow-500" />
                Oportunidades Paradas
              </h2>
            </div>
          </div>
          <div className="divide-y">
            {metrics.oportunidades_atrasadas.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Icons.checkCircle className="w-12 h-12 mx-auto mb-2 text-green-300" />
                <p>Todas as oportunidades estão em dia!</p>
              </div>
            ) : (
              metrics.oportunidades_atrasadas.map((op) => (
                <div
                  key={op.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/crm/oportunidades/${op.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{op.titulo}</p>
                      <p className="text-sm text-gray-500">{op.cliente_nome}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="danger" size="sm">
                        {op.dias_parado} dias parado
                      </Badge>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {formatCurrency(op.valor)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gray-50">
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Ações Rápidas</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Icons.plus className="w-4 h-4" />}
              onClick={() => navigate('/crm/leads/novo')}
            >
              Novo Lead
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Icons.target className="w-4 h-4" />}
              onClick={() => navigate('/crm/oportunidades/nova')}
            >
              Nova Oportunidade
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Icons.calendar className="w-4 h-4" />}
              onClick={() => navigate('/crm/atividades/nova')}
            >
              Agendar Atividade
            </Button>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Icons.fileText className="w-4 h-4" />}
              onClick={() => navigate('/crm/relatorios')}
            >
              Relatórios
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default CRMDashboardPage;
