// =============================================
// PLANAC ERP - Data Comparison Popup Component
// Popup para comparar dados atuais vs consulta
// =============================================

import React, { useState, useMemo } from 'react';

interface CampoComparacao {
  campo: string;
  label: string;
  valorAtual: string | null | undefined;
  valorConsulta: string | null | undefined;
  grupo?: string;
}

interface DataComparisonPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAplicar: (camposSelecionados: string[]) => void;
  campos: CampoComparacao[];
  titulo?: string;
}

// Icones
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const ArrowRightIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export function DataComparisonPopup({
  isOpen,
  onClose,
  onAplicar,
  campos,
  titulo = 'Comparacao de Dados'
}: DataComparisonPopupProps) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  // Filtrar apenas campos com diferencas
  const camposComDiferenca = useMemo(() => {
    return campos.filter(c => {
      const atual = c.valorAtual ?? '';
      const consulta = c.valorConsulta ?? '';
      return atual !== consulta && consulta !== '';
    });
  }, [campos]);

  // Agrupar campos por grupo
  const gruposMap = useMemo(() => {
    const map = new Map<string, CampoComparacao[]>();
    camposComDiferenca.forEach(campo => {
      const grupo = campo.grupo || 'Geral';
      if (!map.has(grupo)) {
        map.set(grupo, []);
      }
      map.get(grupo)!.push(campo);
    });
    return map;
  }, [camposComDiferenca]);

  const grupos = Array.from(gruposMap.keys());

  // Handlers
  const toggleCampo = (campo: string) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(campo)) {
        novo.delete(campo);
      } else {
        novo.add(campo);
      }
      return novo;
    });
  };

  const selecionarTodos = () => {
    setSelecionados(new Set(camposComDiferenca.map(c => c.campo)));
  };

  const deselecionarTodos = () => {
    setSelecionados(new Set());
  };

  const selecionarGrupo = (grupo: string) => {
    const camposDoGrupo = gruposMap.get(grupo) || [];
    setSelecionados(prev => {
      const novo = new Set(prev);
      camposDoGrupo.forEach(c => novo.add(c.campo));
      return novo;
    });
  };

  const handleAplicar = () => {
    onAplicar(Array.from(selecionados));
    onClose();
  };

  if (!isOpen) return null;

  if (camposComDiferenca.length === 0) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckIcon />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Dados Atualizados</h3>
              <p className="text-gray-500 mb-4">Nao foram encontradas diferencas entre os dados atuais e os dados da consulta.</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-planac-500 text-white rounded-lg hover:bg-planac-600 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-planac-500 to-planac-600">
            <div>
              <h2 className="text-xl font-bold text-white">{titulo}</h2>
              <p className="text-sm text-planac-100">
                {camposComDiferenca.length} campo(s) com diferenca encontrado(s)
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Acoes rapidas */}
          <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={selecionarTodos}
                className="px-3 py-1.5 text-sm font-medium text-planac-600 hover:bg-planac-50 rounded-lg transition-colors"
              >
                Selecionar Todos
              </button>
              <button
                onClick={deselecionarTodos}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Limpar Selecao
              </button>
            </div>
            <div className="flex items-center gap-2">
              {grupos.map(grupo => (
                <button
                  key={grupo}
                  onClick={() => selecionarGrupo(grupo)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 hover:border-planac-300 hover:text-planac-600 rounded-lg transition-colors"
                >
                  Aplicar {grupo}
                </button>
              ))}
            </div>
          </div>

          {/* Tabela de comparacao */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    <input
                      type="checkbox"
                      checked={selecionados.size === camposComDiferenca.length}
                      onChange={(e) => e.target.checked ? selecionarTodos() : deselecionarTodos()}
                      className="w-4 h-4 text-planac-500 border-gray-300 rounded focus:ring-planac-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Atual
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                    
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor da Consulta
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {grupos.map(grupo => (
                  <React.Fragment key={grupo}>
                    {grupos.length > 1 && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-4 py-2">
                          <span className="text-xs font-semibold text-gray-600 uppercase">{grupo}</span>
                        </td>
                      </tr>
                    )}
                    {gruposMap.get(grupo)?.map(campo => (
                      <tr
                        key={campo.campo}
                        className={`hover:bg-gray-50 cursor-pointer ${selecionados.has(campo.campo) ? 'bg-planac-50' : ''}`}
                        onClick={() => toggleCampo(campo.campo)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selecionados.has(campo.campo)}
                            onChange={() => toggleCampo(campo.campo)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 text-planac-500 border-gray-300 rounded focus:ring-planac-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{campo.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-sm ${campo.valorAtual ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                            {campo.valorAtual || '(vazio)'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <ArrowRightIcon />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-green-600 font-medium">
                            {campo.valorConsulta || '(vazio)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {selecionados.size} de {camposComDiferenca.length} campo(s) selecionado(s)
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAplicar}
                disabled={selecionados.size === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-planac-500 rounded-lg hover:bg-planac-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Aplicar Selecionados
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataComparisonPopup;
