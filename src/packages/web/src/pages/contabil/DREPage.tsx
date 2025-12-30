// =============================================
// PLANAC ERP - DRE (Demonstração do Resultado)
// =============================================

import React from 'react';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface LinhaDRE {
  codigo: string;
  descricao: string;
  nivel: number;
  tipo: 'receita' | 'deducao' | 'custo' | 'despesa' | 'resultado';
  valor_periodo: number;
  valor_anterior?: number;
  percentual_receita?: number;
  formula?: string;
  filhos?: LinhaDRE[];
}

interface DREData {
  periodo: string;
  periodo_comparacao?: string;
  linhas: LinhaDRE[];
  receita_liquida: number;
  lucro_bruto: number;
  resultado_operacional: number;
  lucro_liquido: number;
}

export function DREPage() {
  const toast = useToast();
  const [dreData, setDreData] = useState<DREData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7));
  const [comparar, setComparar] = useState(true);
  const [expandedLines, setExpandedLines] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDRE();
  }, [periodo, comparar]);

  const loadDRE = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: DREData }>(
        `/contabil/dre?periodo=${periodo}&comparar=${comparar}`
      );
      if (response.success) {
        setDreData(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar DRE');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatPercent = (value?: number) => {
    if (value === undefined) return '-';
    return `${value.toFixed(1)}%`;
  };

  const toggleExpand = (codigo: string) => {
    const newExpanded = new Set(expandedLines);
    if (newExpanded.has(codigo)) {
      newExpanded.delete(codigo);
    } else {
      newExpanded.add(codigo);
    }
    setExpandedLines(newExpanded);
  };

  const calcularVariacao = (atual: number, anterior?: number) => {
    if (!anterior || anterior === 0) return null;
    return ((atual - anterior) / Math.abs(anterior)) * 100;
  };

  const renderLinha = (linha: LinhaDRE, depth: number = 0) => {
    const hasChildren = linha.filhos && linha.filhos.length > 0;
    const isExpanded = expandedLines.has(linha.codigo);
    const variacao = calcularVariacao(linha.valor_periodo, linha.valor_anterior);
    const isNegative = linha.valor_periodo < 0;
    const isResult = linha.tipo === 'resultado';
    
    return (
      <React.Fragment key={linha.codigo}>
        <tr className={`
          ${isResult ? 'bg-planac-50 font-bold' : depth === 0 ? 'bg-gray-50' : ''}
          ${isResult ? 'border-t-2 border-planac-200' : ''}
          hover:bg-gray-100
        `}>
          <td className="p-2">
            <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(linha.codigo)}
                  className="mr-2 text-gray-400 hover:text-gray-600"
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              )}
              <span className={`text-xs text-gray-400 mr-2 ${hasChildren ? '' : 'ml-5'}`}>
                {linha.codigo}
              </span>
              <span className={linha.nivel <= 1 ? 'font-semibold' : ''}>
                {linha.descricao}
              </span>
            </div>
          </td>
          <td className={`p-2 text-right font-mono ${isNegative ? 'text-red-600' : ''}`}>
            {linha.valor_periodo !== 0 ? formatCurrency(linha.valor_periodo) : '-'}
          </td>
          {comparar && linha.valor_anterior !== undefined && (
            <td className="p-2 text-right font-mono text-gray-500">
              {linha.valor_anterior !== 0 ? formatCurrency(linha.valor_anterior) : '-'}
            </td>
          )}
          {comparar && (
            <td className={`p-2 text-right text-sm ${
              variacao !== null ? (variacao >= 0 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'
            }`}>
              {variacao !== null ? `${variacao >= 0 ? '+' : ''}${variacao.toFixed(1)}%` : '-'}
            </td>
          )}
          <td className="p-2 text-right text-sm text-gray-500">
            {formatPercent(linha.percentual_receita)}
          </td>
        </tr>
        {hasChildren && isExpanded && linha.filhos!.map(filho => renderLinha(filho, depth + 1))}
      </React.Fragment>
    );
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Demonstração do Resultado (DRE)</h1>
          <p className="text-gray-500">Análise de receitas, custos e despesas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" leftIcon={<Icons.printer className="w-5 h-5" />}>
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
            <input
              type="month"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2 pb-2">
            <input
              type="checkbox"
              checked={comparar}
              onChange={(e) => setComparar(e.target.checked)}
            />
            <span className="text-sm">Comparar com período anterior</span>
          </label>
          <Button variant="secondary" onClick={loadDRE}>
            <Icons.refresh className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {/* Indicadores Resumidos */}
      {dreData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card padding="sm" className="border-l-4 border-l-blue-500">
            <p className="text-sm text-gray-500">Receita Líquida</p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(dreData.receita_liquida)}</p>
          </Card>
          <Card padding="sm" className="border-l-4 border-l-green-500">
            <p className="text-sm text-gray-500">Lucro Bruto</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(dreData.lucro_bruto)}</p>
            <p className="text-xs text-gray-400">
              Margem: {dreData.receita_liquida > 0 ? ((dreData.lucro_bruto / dreData.receita_liquida) * 100).toFixed(1) : 0}%
            </p>
          </Card>
          <Card padding="sm" className="border-l-4 border-l-orange-500">
            <p className="text-sm text-gray-500">Resultado Operacional</p>
            <p className={`text-xl font-bold ${dreData.resultado_operacional >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
              {formatCurrency(dreData.resultado_operacional)}
            </p>
          </Card>
          <Card padding="sm" className="border-l-4 border-l-planac-500">
            <p className="text-sm text-gray-500">Lucro Líquido</p>
            <p className={`text-xl font-bold ${dreData.lucro_liquido >= 0 ? 'text-planac-600' : 'text-red-600'}`}>
              {formatCurrency(dreData.lucro_liquido)}
            </p>
            <p className="text-xs text-gray-400">
              Margem: {dreData.receita_liquida > 0 ? ((dreData.lucro_liquido / dreData.receita_liquida) * 100).toFixed(1) : 0}%
            </p>
          </Card>
        </div>
      )}

      {/* Tabela DRE */}
      {dreData && (
        <Card padding="none">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-bold">
              DRE - {new Date(periodo + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-3">Descrição</th>
                  <th className="text-right p-3 w-40">Período Atual</th>
                  {comparar && <th className="text-right p-3 w-40">Período Anterior</th>}
                  {comparar && <th className="text-right p-3 w-24">Variação</th>}
                  <th className="text-right p-3 w-24">% Receita</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dreData.linhas.map(linha => renderLinha(linha))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Legenda */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span>Valores positivos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 rounded"></div>
            <span>Valores negativos / Deduções</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-planac-100 rounded"></div>
            <span>Resultados</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default DREPage;
