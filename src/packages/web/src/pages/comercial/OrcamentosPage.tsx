// =============================================
// PLANAC ERP - Orçamentos Page (DEBUG)
// =============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';

interface Orcamento {
  id: string;
  numero: string;
  cliente_nome: string;
  valor_total: number;
  status: string;
}

export function OrcamentosPage() {
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Iniciando...');

  useEffect(() => {
    loadOrcamentos();
  }, []);

  const loadOrcamentos = async () => {
    try {
      setDebugInfo('Chamando API...');
      const response = await api.get<{ success: boolean; data: Orcamento[] }>('/orcamentos');
      setDebugInfo(`API respondeu: success=${response.success}, registros=${response.data?.length || 0}`);
      
      if (response.success) {
        setOrcamentos(response.data || []);
      } else {
        setError('API retornou success=false');
      }
    } catch (err: any) {
      setError(`Erro: ${err.message || 'Desconhecido'}`);
      setDebugInfo(`Erro ao chamar API: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
        <p className="text-gray-500">Gerencie seus orçamentos</p>
      </div>

      {/* Debug Info */}
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Debug:</strong> {debugInfo}
        </p>
        <p className="text-sm text-blue-600">
          Loading: {isLoading ? 'Sim' : 'Não'} | 
          Erro: {error || 'Nenhum'} | 
          Total: {orcamentos.length}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Carregando...</span>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow border">
          {/* Toolbar */}
          <div className="p-4 border-b flex justify-between items-center">
            <span className="text-sm text-gray-500">{orcamentos.length} orçamento(s)</span>
            <button
              onClick={() => navigate('/comercial/orcamentos/novo')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              + Novo Orçamento
            </button>
          </div>

          {/* Table */}
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Número</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orcamentos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    Nenhum orçamento encontrado
                  </td>
                </tr>
              ) : (
                orcamentos.map((orc) => (
                  <tr key={orc.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/comercial/orcamentos/${orc.id}`)}>
                    <td className="px-4 py-3 font-mono text-sm">{orc.numero}</td>
                    <td className="px-4 py-3">{orc.cliente_nome || '-'}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{formatCurrency(orc.valor_total)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100">{orc.status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default OrcamentosPage;
