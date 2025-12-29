// =============================================
// PLANAC ERP - Fluxo de Caixa
// =============================================

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface MovimentacaoFinanceira {
  id: string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  descricao: string;
  valor: number;
  data: string;
  conta_bancaria?: string;
  origem?: string;
  origem_id?: string;
}

interface FluxoDia {
  data: string;
  saldo_inicial: number;
  entradas: number;
  saidas: number;
  saldo_final: number;
  movimentacoes: MovimentacaoFinanceira[];
}

interface PrevisaoFluxo {
  data: string;
  entradas_previstas: number;
  saidas_previstas: number;
  saldo_previsto: number;
}

type VisualizacaoType = 'diario' | 'semanal' | 'mensal';
type TipoFluxoType = 'realizado' | 'previsto' | 'comparativo';

export function FluxoCaixaPage() {
  const toast = useToast();
  const [fluxoDiario, setFluxoDiario] = useState<FluxoDia[]>([]);
  const [previsoes, setPrevisoes] = useState<PrevisaoFluxo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visualizacao, setVisualizacao] = useState<VisualizacaoType>('diario');
  const [tipoFluxo, setTipoFluxo] = useState<TipoFluxoType>('realizado');
  const [periodoInicio, setPeriodoInicio] = useState(() => {
    const hoje = new Date();
    hoje.setDate(1); // Primeiro dia do mês
    return hoje.toISOString().split('T')[0];
  });
  const [periodoFim, setPeriodoFim] = useState(() => {
    const hoje = new Date();
    hoje.setMonth(hoje.getMonth() + 1, 0); // Último dia do mês
    return hoje.toISOString().split('T')[0];
  });
  const [contaBancaria, setContaBancaria] = useState('');
  const [diaExpandido, setDiaExpandido] = useState<string | null>(null);

  useEffect(() => {
    loadFluxo();
  }, [periodoInicio, periodoFim, contaBancaria, tipoFluxo]);

  const loadFluxo = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        data_inicio: periodoInicio,
        data_fim: periodoFim,
      });
      if (contaBancaria) params.append('conta_bancaria_id', contaBancaria);

      if (tipoFluxo === 'realizado' || tipoFluxo === 'comparativo') {
        const response = await api.get<{ success: boolean; data: FluxoDia[] }>(
          `/financeiro/fluxo-caixa?${params}`
        );
        if (response.success) {
          setFluxoDiario(response.data);
        }
      }

      if (tipoFluxo === 'previsto' || tipoFluxo === 'comparativo') {
        const response = await api.get<{ success: boolean; data: PrevisaoFluxo[] }>(
          `/financeiro/fluxo-caixa/previsao?${params}`
        );
        if (response.success) {
          setPrevisoes(response.data);
        }
      }
    } catch (error) {
      toast.error('Erro ao carregar fluxo de caixa');
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

  const formatDate = (date: string) => {
    return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formatDateFull = (date: string) => {
    return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  // Agrupar por semana ou mês
  const agruparFluxo = () => {
    if (visualizacao === 'diario') return fluxoDiario;
    
    const agrupado: Record<string, FluxoDia> = {};
    
    fluxoDiario.forEach((dia) => {
      let chave: string;
      const data = new Date(dia.data + 'T12:00:00');
      
      if (visualizacao === 'semanal') {
        // Início da semana (domingo)
        const inicioSemana = new Date(data);
        inicioSemana.setDate(data.getDate() - data.getDay());
        chave = inicioSemana.toISOString().split('T')[0];
      } else {
        // Mês/Ano
        chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-01`;
      }
      
      if (!agrupado[chave]) {
        agrupado[chave] = {
          data: chave,
          saldo_inicial: dia.saldo_inicial,
          entradas: 0,
          saidas: 0,
          saldo_final: 0,
          movimentacoes: [],
        };
      }
      
      agrupado[chave].entradas += dia.entradas;
      agrupado[chave].saidas += dia.saidas;
      agrupado[chave].saldo_final = dia.saldo_final;
      agrupado[chave].movimentacoes.push(...dia.movimentacoes);
    });
    
    return Object.values(agrupado).sort((a, b) => a.data.localeCompare(b.data));
  };

  // Estatísticas do período
  const calcularStats = () => {
    const dados = fluxoDiario;
    if (dados.length === 0) {
      return {
        saldoInicial: 0,
        saldoFinal: 0,
        totalEntradas: 0,
        totalSaidas: 0,
        saldoPeriodo: 0,
      };
    }

    const totalEntradas = dados.reduce((acc, d) => acc + d.entradas, 0);
    const totalSaidas = dados.reduce((acc, d) => acc + d.saidas, 0);

    return {
      saldoInicial: dados[0].saldo_inicial,
      saldoFinal: dados[dados.length - 1].saldo_final,
      totalEntradas,
      totalSaidas,
      saldoPeriodo: totalEntradas - totalSaidas,
    };
  };

  const stats = calcularStats();
  const fluxoAgrupado = agruparFluxo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h1>
          <p className="text-gray-500">Acompanhe entradas e saídas financeiras</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={<Icons.printer className="w-5 h-5" />}
          >
            Exportar
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <Input
              type="date"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
            />
          </div>
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Até</label>
            <Input
              type="date"
              value={periodoFim}
              onChange={(e) => setPeriodoFim(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Select
              label="Visualização"
              value={visualizacao}
              onChange={(v) => setVisualizacao(v as VisualizacaoType)}
              options={[
                { value: 'diario', label: 'Diário' },
                { value: 'semanal', label: 'Semanal' },
                { value: 'mensal', label: 'Mensal' },
              ]}
            />
          </div>
          <div className="w-40">
            <Select
              label="Tipo"
              value={tipoFluxo}
              onChange={(v) => setTipoFluxo(v as TipoFluxoType)}
              options={[
                { value: 'realizado', label: 'Realizado' },
                { value: 'previsto', label: 'Previsto' },
                { value: 'comparativo', label: 'Comparativo' },
              ]}
            />
          </div>
          <div className="w-48">
            <Select
              label="Conta Bancária"
              value={contaBancaria}
              onChange={setContaBancaria}
              options={[
                { value: '', label: 'Todas as contas' },
                { value: '1', label: 'Banco do Brasil' },
                { value: '2', label: 'Itaú' },
                { value: '3', label: 'Caixa Econômica' },
              ]}
            />
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Saldo Inicial</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.saldoInicial)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total Entradas</p>
          <p className="text-xl font-bold text-green-600">+ {formatCurrency(stats.totalEntradas)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total Saídas</p>
          <p className="text-xl font-bold text-red-600">- {formatCurrency(stats.totalSaidas)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Saldo do Período</p>
          <p className={`text-xl font-bold ${stats.saldoPeriodo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(stats.saldoPeriodo)}
          </p>
        </Card>
        <Card padding="sm" className="bg-planac-50">
          <p className="text-sm text-planac-600">Saldo Final</p>
          <p className="text-xl font-bold text-planac-700">{formatCurrency(stats.saldoFinal)}</p>
        </Card>
      </div>

      {/* Fluxo por Dia/Semana/Mês */}
      <Card padding="none">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-planac-500" />
          </div>
        ) : fluxoAgrupado.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icons.document className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma movimentação no período</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {fluxoAgrupado.map((dia) => (
              <div key={dia.data}>
                {/* Linha do dia/semana/mês */}
                <button
                  onClick={() => setDiaExpandido(diaExpandido === dia.data ? null : dia.data)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <p className="font-medium text-gray-900">
                        {visualizacao === 'diario' ? formatDate(dia.data) : 
                         visualizacao === 'semanal' ? `Semana de ${formatDate(dia.data)}` :
                         new Date(dia.data + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-500">
                        {dia.movimentacoes.length} movimentação(ões)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Entradas</p>
                      <p className="font-medium text-green-600">+ {formatCurrency(dia.entradas)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Saídas</p>
                      <p className="font-medium text-red-600">- {formatCurrency(dia.saidas)}</p>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="text-sm text-gray-500">Saldo</p>
                      <p className={`font-bold ${dia.saldo_final >= 0 ? 'text-planac-600' : 'text-red-600'}`}>
                        {formatCurrency(dia.saldo_final)}
                      </p>
                    </div>
                    <Icons.chevronLeft 
                      className={`w-5 h-5 text-gray-400 transition-transform ${diaExpandido === dia.data ? '-rotate-90' : ''}`} 
                    />
                  </div>
                </button>
                
                {/* Detalhes expandidos */}
                {diaExpandido === dia.data && dia.movimentacoes.length > 0 && (
                  <div className="bg-gray-50 px-6 py-4">
                    <table className="w-full">
                      <thead>
                        <tr className="text-xs text-gray-500 uppercase">
                          <th className="text-left py-2">Descrição</th>
                          <th className="text-left py-2">Categoria</th>
                          <th className="text-left py-2">Conta</th>
                          <th className="text-right py-2">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dia.movimentacoes.map((mov) => (
                          <tr key={mov.id} className="text-sm">
                            <td className="py-2">{mov.descricao}</td>
                            <td className="py-2">
                              <Badge variant={mov.tipo === 'entrada' ? 'success' : 'danger'}>
                                {mov.categoria}
                              </Badge>
                            </td>
                            <td className="py-2 text-gray-500">{mov.conta_bancaria || '-'}</td>
                            <td className={`py-2 text-right font-medium ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                              {mov.tipo === 'entrada' ? '+' : '-'} {formatCurrency(mov.valor)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Gráfico de Evolução (placeholder) */}
      <Card>
        <h3 className="text-lg font-medium mb-4">Evolução do Saldo</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          <div className="text-center text-gray-500">
            <Icons.document className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>Gráfico de evolução do saldo</p>
            <p className="text-sm">(Integração com biblioteca de gráficos)</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default FluxoCaixaPage;
