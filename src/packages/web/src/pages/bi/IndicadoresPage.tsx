// =============================================
// PLANAC ERP - Indicadores e KPIs
// =============================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface Indicador {
  id: string;
  codigo: string;
  nome: string;
  categoria: 'vendas' | 'financeiro' | 'operacional' | 'clientes' | 'estoque';
  valor_atual: number;
  valor_anterior: number;
  meta?: number;
  unidade: 'moeda' | 'percentual' | 'numero' | 'dias';
  tendencia: 'alta' | 'baixa' | 'estavel';
  historico: Array<{ periodo: string; valor: number }>;
}

interface AlertaIndicador {
  indicador_id: string;
  indicador_nome: string;
  tipo: 'critico' | 'atencao' | 'info';
  mensagem: string;
  valor_atual: number;
  limite: number;
}

const categoriaConfig = {
  vendas: { label: 'Vendas', icon: '📈', color: 'text-blue-600' },
  financeiro: { label: 'Financeiro', icon: '💰', color: 'text-green-600' },
  operacional: { label: 'Operacional', icon: '⚙️', color: 'text-purple-600' },
  clientes: { label: 'Clientes', icon: '👥', color: 'text-cyan-600' },
  estoque: { label: 'Estoque', icon: '📦', color: 'text-orange-600' },
};

const alertaTipoConfig = {
  critico: { label: 'Crítico', variant: 'danger' as const, icon: '🔴' },
  atencao: { label: 'Atenção', variant: 'warning' as const, icon: '🟡' },
  info: { label: 'Info', variant: 'info' as const, icon: '🔵' },
};

export function IndicadoresPage() {
  const toast = useToast();
  const [indicadores, setIndicadores] = useState<Indicador[]>([]);
  const [alertas, setAlertas] = useState<AlertaIndicador[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes_atual');
  const [categoriaFilter, setCategoriaFilter] = useState('');

  useEffect(() => {
    loadIndicadores();
    loadAlertas();
  }, [periodo]);

  const loadIndicadores = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Indicador[] }>(
        `/bi/indicadores?periodo=${periodo}`
      );
      if (response.success) {
        setIndicadores(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar indicadores');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAlertas = async () => {
    try {
      const response = await api.get<{ success: boolean; data: AlertaIndicador[] }>('/bi/alertas');
      if (response.success) {
        setAlertas(response.data);
      }
    } catch (error) {
      console.error('Erro ao carregar alertas');
    }
  };

  const formatarValor = (valor: number, unidade: string) => {
    switch (unidade) {
      case 'moeda':
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
      case 'percentual':
        return `${valor.toFixed(1)}%`;
      case 'dias':
        return `${valor.toFixed(0)} dias`;
      default:
        return new Intl.NumberFormat('pt-BR').format(valor);
    }
  };

  const calcularVariacao = (atual: number, anterior: number) => {
    if (anterior === 0) return 0;
    return ((atual - anterior) / anterior) * 100;
  };

  const calcularProgressoMeta = (atual: number, meta: number) => {
    if (meta === 0) return 0;
    return Math.min(100, (atual / meta) * 100);
  };

  const filteredIndicadores = indicadores.filter((ind) => {
    return !categoriaFilter || ind.categoria === categoriaFilter;
  });

  const indicadoresPorCategoria = Object.entries(categoriaConfig).map(([key, config]) => ({
    categoria: key as keyof typeof categoriaConfig,
    ...config,
    indicadores: indicadores.filter(i => i.categoria === key),
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-planac-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Indicadores e KPIs</h1>
          <p className="text-gray-500">Acompanhe os principais indicadores do negócio</p>
        </div>
        <div className="flex gap-2">
          <Select
            value={periodo}
            onChange={setPeriodo}
            options={[
              { value: 'hoje', label: 'Hoje' },
              { value: 'semana', label: 'Esta Semana' },
              { value: 'mes_atual', label: 'Este Mês' },
              { value: 'trimestre', label: 'Trimestre' },
              { value: 'ano', label: 'Este Ano' },
            ]}
          />
          <Button variant="secondary" onClick={loadIndicadores}>
            <Icons.refresh className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <Card className="border-l-4 border-l-orange-500">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <span>⚠️</span> Alertas Ativos
          </h3>
          <div className="space-y-2">
            {alertas.slice(0, 3).map((alerta, i) => {
              const config = alertaTipoConfig[alerta.tipo];
              return (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span>{config.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{alerta.indicador_nome}</p>
                      <p className="text-xs text-gray-500">{alerta.mensagem}</p>
                    </div>
                  </div>
                  <Badge variant={config.variant}>{config.label}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filtro por Categoria */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={categoriaFilter === '' ? 'primary' : 'secondary'}
          onClick={() => setCategoriaFilter('')}
        >
          Todos
        </Button>
        {Object.entries(categoriaConfig).map(([key, config]) => (
          <Button
            key={key}
            size="sm"
            variant={categoriaFilter === key ? 'primary' : 'secondary'}
            onClick={() => setCategoriaFilter(key)}
          >
            {config.icon} {config.label}
          </Button>
        ))}
      </div>

      {/* Indicadores por Categoria */}
      {(categoriaFilter ? [{ categoria: categoriaFilter, ...categoriaConfig[categoriaFilter as keyof typeof categoriaConfig], indicadores: filteredIndicadores }] : indicadoresPorCategoria).map((grupo) => (
        <div key={grupo.categoria}>
          <h3 className={`text-lg font-bold mb-3 ${grupo.color}`}>
            {grupo.icon} {grupo.label}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {grupo.indicadores.map((ind) => {
              const variacao = calcularVariacao(ind.valor_atual, ind.valor_anterior);
              const temMeta = ind.meta !== undefined && ind.meta > 0;
              const progressoMeta = temMeta ? calcularProgressoMeta(ind.valor_atual, ind.meta!) : 0;
              
              return (
                <Card key={ind.id} padding="md">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-gray-500">{ind.nome}</p>
                    <span className={`text-xs font-medium ${
                      ind.tendencia === 'alta' ? 'text-green-500' :
                      ind.tendencia === 'baixa' ? 'text-red-500' :
                      'text-gray-400'
                    }`}>
                      {ind.tendencia === 'alta' ? '↑' : ind.tendencia === 'baixa' ? '↓' : '→'}
                    </span>
                  </div>
                  
                  <p className="text-2xl font-bold mb-1">
                    {formatarValor(ind.valor_atual, ind.unidade)}
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs mb-3">
                    <span className={`font-medium ${variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%
                    </span>
                    <span className="text-gray-400">vs período anterior</span>
                  </div>
                  
                  {temMeta && (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Meta: {formatarValor(ind.meta!, ind.unidade)}</span>
                        <span>{progressoMeta.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${
                            progressoMeta >= 100 ? 'bg-green-500' :
                            progressoMeta >= 70 ? 'bg-planac-500' :
                            progressoMeta >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(progressoMeta, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Mini gráfico de histórico */}
                  {ind.historico.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-end gap-0.5 h-8">
                        {ind.historico.slice(-12).map((h, i) => {
                          const max = Math.max(...ind.historico.map(x => x.valor));
                          const height = max > 0 ? (h.valor / max) * 100 : 0;
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-planac-200 rounded-t transition-all hover:bg-planac-400"
                              style={{ height: `${Math.max(height, 5)}%` }}
                              title={`${h.periodo}: ${formatarValor(h.valor, ind.unidade)}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Indicadores Principais Destacados */}
      <Card className="bg-gradient-to-r from-planac-600 to-planac-700 text-white">
        <h3 className="font-bold text-lg mb-4">📊 Resumo Executivo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {indicadores.slice(0, 4).map((ind) => (
            <div key={ind.id}>
              <p className="text-planac-100 text-sm">{ind.nome}</p>
              <p className="text-3xl font-bold">{formatarValor(ind.valor_atual, ind.unidade)}</p>
              <p className={`text-sm ${calcularVariacao(ind.valor_atual, ind.valor_anterior) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                {calcularVariacao(ind.valor_atual, ind.valor_anterior) >= 0 ? '↑' : '↓'} {Math.abs(calcularVariacao(ind.valor_atual, ind.valor_anterior)).toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default IndicadoresPage;
