// =============================================
// PLANAC ERP - Balanço Patrimonial
// =============================================

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface ContaBalanco {
  codigo: string;
  descricao: string;
  nivel: number;
  valor: number;
  filhos?: ContaBalanco[];
}

interface BalancoData {
  data_base: string;
  ativo: {
    circulante: ContaBalanco[];
    nao_circulante: ContaBalanco[];
    total: number;
  };
  passivo: {
    circulante: ContaBalanco[];
    nao_circulante: ContaBalanco[];
    total: number;
  };
  patrimonio_liquido: {
    contas: ContaBalanco[];
    total: number;
  };
  total_passivo_pl: number;
}

export function BalancoPage() {
  const toast = useToast();
  const [balanco, setBalanco] = useState<BalancoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataBase, setDataBase] = useState(new Date().toISOString().split('T')[0]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['ativo_circulante', 'passivo_circulante', 'pl']));

  useEffect(() => {
    loadBalanco();
  }, [dataBase]);

  const loadBalanco = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ success: boolean; data: BalancoData }>(
        `/contabil/balanco?data=${dataBase}`
      );
      if (response.success) {
        setBalanco(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar balanço');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const renderConta = (conta: ContaBalanco, depth: number = 0) => {
    const hasFilhos = conta.filhos && conta.filhos.length > 0;
    
    return (
      <React.Fragment key={conta.codigo}>
        <tr className={depth === 0 ? 'bg-gray-50 font-semibold' : ''}>
          <td className="p-2">
            <div style={{ paddingLeft: `${depth * 20}px` }}>
              <span className="text-xs text-gray-400 mr-2">{conta.codigo}</span>
              {conta.descricao}
            </div>
          </td>
          <td className="p-2 text-right font-mono">
            {conta.valor !== 0 ? formatCurrency(conta.valor) : '-'}
          </td>
        </tr>
        {hasFilhos && conta.filhos!.map(filho => renderConta(filho, depth + 1))}
      </React.Fragment>
    );
  };

  const renderGrupo = (titulo: string, contas: ContaBalanco[], total: number, sectionKey: string, color: string) => {
    const isExpanded = expandedSections.has(sectionKey);
    
    return (
      <div className="mb-4">
        <button
          className={`w-full text-left p-3 ${color} rounded-t-lg flex items-center justify-between`}
          onClick={() => toggleSection(sectionKey)}
        >
          <span className="font-bold text-white">{titulo}</span>
          <div className="flex items-center gap-4">
            <span className="font-bold text-white">{formatCurrency(total)}</span>
            <span className="text-white">{isExpanded ? '▼' : '▶'}</span>
          </div>
        </button>
        
        {isExpanded && (
          <div className="border border-t-0 rounded-b-lg overflow-hidden">
            <table className="w-full">
              <tbody className="divide-y">
                {contas.map(conta => renderConta(conta))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-planac-500" />
      </div>
    );
  }

  if (!balanco) return null;

  const diferencaBalanco = Math.abs(balanco.ativo.total - balanco.total_passivo_pl);
  const balancoFechado = diferencaBalanco < 0.01;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Balanço Patrimonial</h1>
          <p className="text-gray-500">Posição patrimonial e financeira</p>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Base</label>
            <input
              type="date"
              value={dataBase}
              onChange={(e) => setDataBase(e.target.value)}
              className="border rounded-lg px-3 py-2"
            />
          </div>
          <Button variant="secondary" onClick={loadBalanco}>
            <Icons.refresh className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {/* Status do Balanço */}
      <Card padding="sm" className={balancoFechado ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
        <div className="flex items-center gap-3">
          {balancoFechado ? (
            <>
              <Icons.check className="w-6 h-6 text-green-600" />
              <span className="text-green-800 font-medium">Balanço fechado - Ativo = Passivo + PL</span>
            </>
          ) : (
            <>
              <Icons.x className="w-6 h-6 text-red-600" />
              <span className="text-red-800 font-medium">
                Diferença de {formatCurrency(diferencaBalanco)} - Verifique os lançamentos
              </span>
            </>
          )}
        </div>
      </Card>

      {/* Balanço */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ATIVO */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <h2 className="text-xl font-bold text-blue-700">ATIVO</h2>
              <span className="text-xl font-bold text-blue-700">{formatCurrency(balanco.ativo.total)}</span>
            </div>
            
            {renderGrupo(
              'Ativo Circulante',
              balanco.ativo.circulante,
              balanco.ativo.circulante.reduce((acc, c) => acc + c.valor, 0),
              'ativo_circulante',
              'bg-blue-500'
            )}
            
            {renderGrupo(
              'Ativo Não Circulante',
              balanco.ativo.nao_circulante,
              balanco.ativo.nao_circulante.reduce((acc, c) => acc + c.valor, 0),
              'ativo_nao_circulante',
              'bg-blue-600'
            )}
          </Card>
        </div>

        {/* PASSIVO + PL */}
        <div>
          <Card>
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <h2 className="text-xl font-bold text-red-700">PASSIVO + PL</h2>
              <span className="text-xl font-bold text-red-700">{formatCurrency(balanco.total_passivo_pl)}</span>
            </div>
            
            {renderGrupo(
              'Passivo Circulante',
              balanco.passivo.circulante,
              balanco.passivo.circulante.reduce((acc, c) => acc + c.valor, 0),
              'passivo_circulante',
              'bg-red-500'
            )}
            
            {renderGrupo(
              'Passivo Não Circulante',
              balanco.passivo.nao_circulante,
              balanco.passivo.nao_circulante.reduce((acc, c) => acc + c.valor, 0),
              'passivo_nao_circulante',
              'bg-red-600'
            )}
            
            {renderGrupo(
              'Patrimônio Líquido',
              balanco.patrimonio_liquido.contas,
              balanco.patrimonio_liquido.total,
              'pl',
              'bg-purple-600'
            )}
          </Card>
        </div>
      </div>

      {/* Indicadores */}
      <Card>
        <h3 className="font-bold mb-4">Indicadores de Liquidez</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Liquidez Corrente</p>
            <p className="text-2xl font-bold">
              {balanco.passivo.circulante.reduce((acc, c) => acc + c.valor, 0) > 0
                ? (balanco.ativo.circulante.reduce((acc, c) => acc + c.valor, 0) / balanco.passivo.circulante.reduce((acc, c) => acc + c.valor, 0)).toFixed(2)
                : '∞'}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Liquidez Geral</p>
            <p className="text-2xl font-bold">
              {balanco.passivo.total > 0
                ? (balanco.ativo.total / balanco.passivo.total).toFixed(2)
                : '∞'}
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Endividamento</p>
            <p className="text-2xl font-bold">
              {balanco.ativo.total > 0
                ? ((balanco.passivo.total / balanco.ativo.total) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Composição PL</p>
            <p className="text-2xl font-bold">
              {balanco.total_passivo_pl > 0
                ? ((balanco.patrimonio_liquido.total / balanco.total_passivo_pl) * 100).toFixed(1)
                : 0}%
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default BalancoPage;
