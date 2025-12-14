// =============================================
// PLANAC ERP - Dashboard Gerencial
// =============================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface DashboardData {
  periodo: string;
  vendas: {
    total: number;
    quantidade: number;
    ticket_medio: number;
    variacao: number;
  };
  financeiro: {
    receitas: number;
    despesas: number;
    saldo: number;
    contas_receber: number;
    contas_pagar: number;
  };
  estoque: {
    valor_total: number;
    itens_baixo_estoque: number;
    giro_medio: number;
  };
  clientes: {
    total: number;
    novos_periodo: number;
    ativos: number;
  };
  vendas_por_dia: Array<{ data: string; valor: number; quantidade: number }>;
  vendas_por_categoria: Array<{ categoria: string; valor: number; percentual: number }>;
  top_produtos: Array<{ nome: string; quantidade: number; valor: number }>;
  top_vendedores: Array<{ nome: string; vendas: number; valor: number }>;
  metas: {
    vendas_meta: number;
    vendas_realizado: number;
    clientes_meta: number;
    clientes_realizado: number;
  };
}

export function DashboardPage() {
  const toast = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes_atual');

  useEffect(() => {
    loadDashboard();
  }, [periodo]);

  const loadDashboard = async () => {
    try {
      const response = await api.get<{ success: boolean; data: DashboardData }>(
        `/bi/dashboard?periodo=${periodo}`
      );
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const calcularProgressoMeta = (realizado: number, meta: number) => {
    if (meta === 0) return 0;
    return Math.min(100, (realizado / meta) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-planac-500" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Gerencial</h1>
          <p className="text-gray-500">Visão geral do negócio</p>
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
          <Button variant="secondary" leftIcon={<Icons.refresh className="w-5 h-5" />} onClick={loadDashboard}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-100 text-sm">Vendas</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(data.vendas.total)}</p>
              <p className="text-sm mt-2">{data.vendas.quantidade} pedidos</p>
            </div>
            <Badge variant={data.vendas.variacao >= 0 ? 'success' : 'danger'} className="bg-white/20">
              {formatPercent(data.vendas.variacao)}
            </Badge>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div>
            <p className="text-green-100 text-sm">Receitas</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(data.financeiro.receitas)}</p>
            <p className="text-sm mt-2">A receber: {formatCurrency(data.financeiro.contas_receber)}</p>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <div>
            <p className="text-red-100 text-sm">Despesas</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(data.financeiro.despesas)}</p>
            <p className="text-sm mt-2">A pagar: {formatCurrency(data.financeiro.contas_pagar)}</p>
          </div>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div>
            <p className="text-purple-100 text-sm">Saldo</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(data.financeiro.saldo)}</p>
            <p className="text-sm mt-2">Ticket médio: {formatCurrency(data.vendas.ticket_medio)}</p>
          </div>
        </Card>
      </div>

      {/* Metas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <h3 className="font-bold mb-4">Meta de Vendas</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Realizado: {formatCurrency(data.metas.vendas_realizado)}</span>
              <span>Meta: {formatCurrency(data.metas.vendas_meta)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  calcularProgressoMeta(data.metas.vendas_realizado, data.metas.vendas_meta) >= 100
                    ? 'bg-green-500'
                    : 'bg-planac-500'
                }`}
                style={{ width: `${calcularProgressoMeta(data.metas.vendas_realizado, data.metas.vendas_meta)}%` }}
              />
            </div>
            <p className="text-right text-sm font-medium">
              {calcularProgressoMeta(data.metas.vendas_realizado, data.metas.vendas_meta).toFixed(1)}%
            </p>
          </div>
        </Card>
        
        <Card>
          <h3 className="font-bold mb-4">Meta de Clientes Novos</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Conquistados: {data.metas.clientes_realizado}</span>
              <span>Meta: {data.metas.clientes_meta}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  calcularProgressoMeta(data.metas.clientes_realizado, data.metas.clientes_meta) >= 100
                    ? 'bg-green-500'
                    : 'bg-blue-500'
                }`}
                style={{ width: `${calcularProgressoMeta(data.metas.clientes_realizado, data.metas.clientes_meta)}%` }}
              />
            </div>
            <p className="text-right text-sm font-medium">
              {calcularProgressoMeta(data.metas.clientes_realizado, data.metas.clientes_meta).toFixed(1)}%
            </p>
          </div>
        </Card>
      </div>

      {/* Gráficos e Listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vendas por Dia (simulado como lista) */}
        <Card>
          <h3 className="font-bold mb-4">Vendas por Dia</h3>
          <div className="space-y-2">
            {data.vendas_por_dia.slice(-7).map((dia, i) => {
              const maxValor = Math.max(...data.vendas_por_dia.map(d => d.valor));
              const percent = (dia.valor / maxValor) * 100;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-20">
                    {new Date(dia.data).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' })}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-planac-500 h-full rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${percent}%` }}
                    >
                      <span className="text-xs text-white font-medium">{formatCurrency(dia.valor)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Vendas por Categoria */}
        <Card>
          <h3 className="font-bold mb-4">Vendas por Categoria</h3>
          <div className="space-y-3">
            {data.vendas_por_categoria.slice(0, 5).map((cat, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{cat.categoria}</span>
                  <span className="font-medium">{formatCurrency(cat.valor)} ({cat.percentual.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-planac-500 h-2 rounded-full"
                    style={{ width: `${cat.percentual}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Produtos */}
        <Card>
          <h3 className="font-bold mb-4">Top Produtos</h3>
          <div className="space-y-3">
            {data.top_produtos.slice(0, 5).map((prod, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-planac-100 flex items-center justify-center text-sm font-bold text-planac-600">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{prod.nome}</p>
                    <p className="text-xs text-gray-500">{prod.quantidade} un</p>
                  </div>
                </div>
                <span className="font-bold text-planac-600">{formatCurrency(prod.valor)}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Vendedores */}
        <Card>
          <h3 className="font-bold mb-4">Top Vendedores</h3>
          <div className="space-y-3">
            {data.top_vendedores.slice(0, 5).map((vend, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                    i === 0 ? 'bg-yellow-400 text-yellow-900' :
                    i === 1 ? 'bg-gray-300 text-gray-700' :
                    i === 2 ? 'bg-orange-300 text-orange-800' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{vend.nome}</p>
                    <p className="text-xs text-gray-500">{vend.vendas} vendas</p>
                  </div>
                </div>
                <span className="font-bold text-green-600">{formatCurrency(vend.valor)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Indicadores Secundários */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Icons.document className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Estoque Baixo</p>
              <p className="text-xl font-bold text-orange-600">{data.estoque.itens_baixo_estoque}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Icons.user className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Clientes Ativos</p>
              <p className="text-xl font-bold text-blue-600">{data.clientes.ativos}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Icons.plus className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Novos Clientes</p>
              <p className="text-xl font-bold text-green-600">{data.clientes.novos_periodo}</p>
            </div>
          </div>
        </Card>
        
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Icons.refresh className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Giro Estoque</p>
              <p className="text-xl font-bold text-purple-600">{data.estoque.giro_medio.toFixed(1)}x</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
