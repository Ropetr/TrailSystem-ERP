// =============================================
// PLANAC ERP - Depreciação de Ativos
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

interface DepreciacaoMensal {
  id: string;
  ativo_id: string;
  ativo_codigo: string;
  ativo_descricao: string;
  categoria_nome: string;
  competencia: string;
  valor_original: number;
  valor_residual: number;
  depreciacao_mes: number;
  depreciacao_acumulada: number;
  valor_contabil: number;
  taxa_mensal: number;
  status: 'pendente' | 'calculado' | 'contabilizado';
}

interface ResumoDepreciacao {
  competencia: string;
  total_ativos: number;
  depreciacao_mes: number;
  depreciacao_acumulada: number;
  valor_contabil_total: number;
  status: 'aberto' | 'calculado' | 'fechado';
}

const statusConfig = {
  pendente: { label: 'Pendente', variant: 'warning' as const },
  calculado: { label: 'Calculado', variant: 'info' as const },
  contabilizado: { label: 'Contabilizado', variant: 'success' as const },
};

export function DepreciacaoPage() {
  const toast = useToast();
  const [depreciacoes, setDepreciacoes] = useState<DepreciacaoMensal[]>([]);
  const [resumo, setResumo] = useState<ResumoDepreciacao | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [competencia, setCompetencia] = useState(new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState('');
  
  // Modal histórico
  const [showHistoricoModal, setShowHistoricoModal] = useState(false);
  const [ativoHistorico, setAtivoHistorico] = useState<string | null>(null);
  const [historico, setHistorico] = useState<DepreciacaoMensal[]>([]);

  useEffect(() => {
    loadDepreciacoes();
  }, [competencia]);

  const loadDepreciacoes = async () => {
    try {
      const response = await api.get<{ success: boolean; data: DepreciacaoMensal[]; resumo: ResumoDepreciacao }>(
        `/patrimonio/depreciacao?competencia=${competencia}`
      );
      if (response.success) {
        setDepreciacoes(response.data);
        setResumo(response.resumo);
      }
    } catch (error) {
      toast.error('Erro ao carregar depreciações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalcular = async () => {
    try {
      await api.post(`/patrimonio/depreciacao/calcular?competencia=${competencia}`);
      toast.success('Depreciação calculada');
      loadDepreciacoes();
    } catch (error) {
      toast.error('Erro ao calcular depreciação');
    }
  };

  const handleContabilizar = async () => {
    if (!confirm('Deseja contabilizar a depreciação? Esta ação gerará lançamentos contábeis.')) return;

    try {
      await api.post(`/patrimonio/depreciacao/contabilizar?competencia=${competencia}`);
      toast.success('Depreciação contabilizada');
      loadDepreciacoes();
    } catch (error) {
      toast.error('Erro ao contabilizar');
    }
  };

  const handleVerHistorico = async (ativoId: string) => {
    try {
      const response = await api.get<{ success: boolean; data: DepreciacaoMensal[] }>(
        `/patrimonio/ativos/${ativoId}/depreciacao`
      );
      if (response.success) {
        setHistorico(response.data);
        setAtivoHistorico(ativoId);
        setShowHistoricoModal(true);
      }
    } catch (error) {
      toast.error('Erro ao carregar histórico');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  const filteredDepreciacoes = depreciacoes.filter((d) => {
    return d.ativo_descricao.toLowerCase().includes(search.toLowerCase()) ||
           d.ativo_codigo.toLowerCase().includes(search.toLowerCase());
  });

  const columns = [
    {
      key: 'ativo',
      header: 'Ativo',
      render: (d: DepreciacaoMensal) => (
        <div>
          <p className="font-medium">{d.ativo_descricao}</p>
          <p className="text-sm text-gray-500">{d.ativo_codigo} - {d.categoria_nome}</p>
        </div>
      ),
    },
    {
      key: 'valor_original',
      header: 'Valor Original',
      width: '120px',
      render: (d: DepreciacaoMensal) => formatCurrency(d.valor_original),
    },
    {
      key: 'taxa',
      header: 'Taxa Mensal',
      width: '100px',
      render: (d: DepreciacaoMensal) => formatPercent(d.taxa_mensal),
    },
    {
      key: 'depreciacao_mes',
      header: 'Depr. Mês',
      width: '120px',
      render: (d: DepreciacaoMensal) => (
        <span className="text-red-600 font-medium">{formatCurrency(d.depreciacao_mes)}</span>
      ),
    },
    {
      key: 'depreciacao_acumulada',
      header: 'Depr. Acumulada',
      width: '130px',
      render: (d: DepreciacaoMensal) => formatCurrency(d.depreciacao_acumulada),
    },
    {
      key: 'valor_contabil',
      header: 'Valor Contábil',
      width: '130px',
      render: (d: DepreciacaoMensal) => (
        <span className="font-bold text-planac-600">{formatCurrency(d.valor_contabil)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (d: DepreciacaoMensal) => {
        const config = statusConfig[d.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (dep: DepreciacaoMensal) => [
    {
      label: 'Ver Histórico',
      icon: <Icons.document className="w-4 h-4" />,
      onClick: () => handleVerHistorico(dep.ativo_id),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Depreciação</h1>
          <p className="text-gray-500">Cálculo e controle de depreciação mensal</p>
        </div>
        <div className="flex gap-2">
          <Input
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            className="w-40"
          />
        </div>
      </div>

      {/* Resumo */}
      {resumo && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold">Resumo - {competencia}</h3>
            <div className="flex gap-2">
              {resumo.status === 'aberto' && (
                <Button onClick={handleCalcular}>Calcular Depreciação</Button>
              )}
              {resumo.status === 'calculado' && (
                <>
                  <Button variant="secondary" onClick={handleCalcular}>Recalcular</Button>
                  <Button onClick={handleContabilizar}>Contabilizar</Button>
                </>
              )}
              {resumo.status === 'fechado' && (
                <Badge variant="success">Fechado</Badge>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Ativos em Depreciação</p>
              <p className="text-xl font-bold">{resumo.total_ativos}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Depreciação do Mês</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(resumo.depreciacao_mes)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Depreciação Acumulada</p>
              <p className="text-xl font-bold">{formatCurrency(resumo.depreciacao_acumulada)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Valor Contábil Total</p>
              <p className="text-xl font-bold text-planac-600">{formatCurrency(resumo.valor_contabil_total)}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Filtros */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por ativo..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="secondary" leftIcon={<Icons.printer className="w-5 h-5" />}>
            Exportar Relatório
          </Button>
        </div>
      </Card>

      {/* Tabela */}
      <Card padding="none">
        <DataTable
          data={filteredDepreciacoes}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma depreciação encontrada"
        />
      </Card>

      {/* Modal Histórico */}
      <Modal
        isOpen={showHistoricoModal}
        onClose={() => setShowHistoricoModal(false)}
        title="Histórico de Depreciação"
        size="lg"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {historico.map((h, index) => (
            <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{h.competencia}</p>
                <p className="text-sm text-gray-500">Taxa: {formatPercent(h.taxa_mensal)}</p>
              </div>
              <div className="text-right">
                <p className="text-red-600 font-medium">{formatCurrency(h.depreciacao_mes)}</p>
                <p className="text-sm text-gray-500">Acum: {formatCurrency(h.depreciacao_acumulada)}</p>
              </div>
            </div>
          ))}
          {historico.length === 0 && (
            <p className="text-center text-gray-500 py-8">Nenhum histórico encontrado</p>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default DepreciacaoPage;
