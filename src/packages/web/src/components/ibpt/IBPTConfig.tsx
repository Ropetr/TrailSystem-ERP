// =============================================
// PLANAC ERP - Componente Configuração IBPT
// Configurar token, visualizar status, importar CSV
// =============================================

import React from 'react';
import { useState, useEffect, useCallback } from 'react';

// ===== TIPOS =====

interface IBPTConfig {
  configurado: boolean;
  uf: string | null;
  cnpj: string | null;
  token_parcial: string | null;
}

interface CacheEstatisticas {
  total_registros: number;
  registros_validos: number;
  registros_expirados: number;
  registros_expirando_7_dias: number;
  ultima_atualizacao: string | null;
  versao_mais_recente: string | null;
  token_configurado: boolean;
  por_uf?: Array<{ uf: string; total: number }>;
}

interface StatusAtualizacao {
  necessita_atualizacao: boolean;
  motivo: string;
  registros_expirando: number;
  registros_expirados: number;
  ultima_atualizacao: string | null;
}

interface ImportacaoHistorico {
  id: number;
  uf: string;
  versao: string;
  vigencia_fim: string;
  registros_total: number;
  registros_inseridos: number;
  registros_erro: number;
  importado_em: string;
  fonte: string;
}

// ===== COMPONENTE PRINCIPAL =====

interface IBPTConfigProps {
  cnpj: string;
  apiBaseUrl?: string;
}

export default function IBPTConfig({ cnpj, apiBaseUrl = '/api/v1' }: IBPTConfigProps) {
  // Estados
  const [config, setConfig] = useState<IBPTConfig | null>(null);
  const [estatisticas, setEstatisticas] = useState<CacheEstatisticas | null>(null);
  const [statusAtualizacao, setStatusAtualizacao] = useState<StatusAtualizacao | null>(null);
  const [importacoes, setImportacoes] = useState<ImportacaoHistorico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [token, setToken] = useState('');
  const [uf, setUf] = useState('PR');
  const [saving, setSaving] = useState(false);
  const [atualizando, setAtualizando] = useState(false);
  
  // Import states
  const [arquivoCSV, setArquivoCSV] = useState<File | null>(null);
  const [importandoCSV, setImportandoCSV] = useState(false);
  const [ufImportacao, setUfImportacao] = useState('PR');

  // ===== CARREGAR DADOS =====

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [configRes, estatRes, statusRes, importRes] = await Promise.all([
        fetch(`${apiBaseUrl}/ibpt/config`),
        fetch(`${apiBaseUrl}/ibpt/cache/estatisticas`),
        fetch(`${apiBaseUrl}/ibpt/status/atualizacao`),
        fetch(`${apiBaseUrl}/ibpt/importacoes`),
      ]);

      if (configRes.ok) {
        const data = await configRes.json();
        setConfig(data);
        if (data.uf) setUf(data.uf);
      }

      if (estatRes.ok) {
        setEstatisticas(await estatRes.json());
      }

      if (statusRes.ok) {
        setStatusAtualizacao(await statusRes.json());
      }

      if (importRes.ok) {
        const data = await importRes.json();
        setImportacoes(data.data || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ===== SALVAR CONFIGURAÇÃO =====

  const salvarConfiguracao = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/empresas-config/${cnpj}/ibpt`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, uf }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar');
      }

      setToken('');
      await carregarDados();
      alert('Configuração IBPT salva com sucesso!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ===== FORÇAR ATUALIZAÇÃO =====

  const forcarAtualizacao = async () => {
    if (!confirm('Deseja forçar a atualização da tabela IBPT agora?')) return;
    
    setAtualizando(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/ibpt/atualizar`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na atualização');
      }

      alert(`Atualização concluída!\n\nAtualizados: ${data.registros_atualizados}\nErros: ${data.registros_erro}`);
      await carregarDados();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAtualizando(false);
    }
  };

  // ===== IMPORTAR CSV =====

  const importarCSV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!arquivoCSV) return;

    setImportandoCSV(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('arquivo', arquivoCSV);
      formData.append('uf', ufImportacao);

      const response = await fetch(`${apiBaseUrl}/ibpt/importar/csv`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na importação');
      }

      alert(
        `Importação concluída!\n\n` +
        `Processados: ${data.registros_processados}\n` +
        `Inseridos: ${data.registros_inseridos}\n` +
        `Erros: ${data.registros_erro}\n` +
        `Versão: ${data.versao || 'N/A'}`
      );

      setArquivoCSV(null);
      await carregarDados();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setImportandoCSV(false);
    }
  };

  // ===== LIMPAR CACHE ANTIGO =====

  const limparCacheAntigo = async () => {
    if (!confirm('Deseja remover registros com mais de 180 dias expirados?')) return;

    try {
      const response = await fetch(`${apiBaseUrl}/ibpt/cache/antigos?dias=180`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao limpar');
      }

      alert(`${data.registros_removidos} registros removidos.`);
      await carregarDados();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // ===== UFS BRASILEIRAS =====

  const UFS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ];

  // ===== RENDER =====

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando configurações IBPT...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Configuração IBPT
          </h1>
          <p className="text-gray-600">
            Lei da Transparência Fiscal (Lei 12.741/2012)
          </p>
        </div>
        <button
          onClick={carregarDados}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700"
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Erro global */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <strong>Erro:</strong> {error}
        </div>
      )}

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card: Status da Configuração */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className={config?.configurado ? '🟢' : '🔴'}>●</span>
            Status da Configuração
          </h2>

          {config?.configurado ? (
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Token:</span>
                <span className="font-mono">{config.token_parcial}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">UF:</span>
                <span className="font-semibold">{config.uf}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">CNPJ:</span>
                <span className="font-mono text-sm">{config.cnpj}</span>
              </div>
              <div className="pt-3 border-t">
                <p className="text-green-600 text-sm">
                  ✅ Pronto para calcular tributos automaticamente
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-yellow-600 mb-2">⚠️ Token não configurado</p>
              <p className="text-gray-500 text-sm">
                Configure o token para habilitar o cálculo automático de tributos
              </p>
            </div>
          )}
        </div>

        {/* Card: Estatísticas do Cache */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">📊 Cache IBPT</h2>

          {estatisticas ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {estatisticas.total_registros.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-600">Total no Cache</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {estatisticas.registros_validos.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600">Válidos</div>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {estatisticas.registros_expirados}
                  </div>
                  <div className="text-xs text-red-600">Expirados</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {estatisticas.registros_expirando_7_dias}
                  </div>
                  <div className="text-xs text-yellow-600">Expirando (7d)</div>
                </div>
              </div>

              {estatisticas.versao_mais_recente && (
                <div className="text-sm text-gray-600 pt-2 border-t">
                  Versão: <strong>{estatisticas.versao_mais_recente}</strong>
                  {estatisticas.ultima_atualizacao && (
                    <span className="ml-2">
                      | Atualizado: {new Date(estatisticas.ultima_atualizacao).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Sem dados disponíveis</p>
          )}
        </div>

        {/* Card: Configurar Token */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">🔑 Configurar Token IBPT</h2>

          <form onSubmit={salvarConfiguracao} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Token IBPT
              </label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Cole seu token do deolhonoimposto.ibpt.org.br"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Obtenha em: <a href="https://deolhonoimposto.ibpt.org.br" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">deolhonoimposto.ibpt.org.br</a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UF Padrão
              </label>
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {UFS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={saving || !token}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar Configuração'}
            </button>
          </form>
        </div>

        {/* Card: Status de Atualização */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">🔄 Atualização Automática</h2>

          {statusAtualizacao ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                statusAtualizacao.necessita_atualizacao 
                  ? 'bg-yellow-50 border border-yellow-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <p className={statusAtualizacao.necessita_atualizacao ? 'text-yellow-700' : 'text-green-700'}>
                  {statusAtualizacao.necessita_atualizacao ? '⚠️' : '✅'} {statusAtualizacao.motivo}
                </p>
              </div>

              {statusAtualizacao.ultima_atualizacao && (
                <p className="text-sm text-gray-600">
                  Última atualização: {new Date(statusAtualizacao.ultima_atualizacao).toLocaleString('pt-BR')}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={forcarAtualizacao}
                  disabled={atualizando || !config?.configurado}
                  className="flex-1 py-2 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {atualizando ? 'Atualizando...' : '🔄 Atualizar Agora'}
                </button>
                <button
                  onClick={limparCacheAntigo}
                  className="py-2 px-4 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors"
                  title="Limpar cache antigo"
                >
                  🗑️
                </button>
              </div>

              <p className="text-xs text-gray-500">
                A atualização automática roda diariamente às 04:00 (Brasília)
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">Carregando...</p>
          )}
        </div>
      </div>

      {/* Card: Importar CSV */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">📁 Importar Tabela CSV (Opcional)</h2>
        
        <form onSubmit={importarCSV} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arquivo CSV do IBPT
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setArquivoCSV(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Baixe a tabela em deolhonoimposto.ibpt.org.br → Empresas → Download
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UF do Arquivo
              </label>
              <select
                value={ufImportacao}
                onChange={(e) => setUfImportacao(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {UFS.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={importandoCSV || !arquivoCSV}
            className="py-2 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
          >
            {importandoCSV ? 'Importando...' : '📤 Importar CSV'}
          </button>
        </form>
      </div>

      {/* Histórico de Importações */}
      {importacoes.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">📋 Histórico de Importações</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">UF</th>
                  <th className="px-4 py-2 text-left">Versão</th>
                  <th className="px-4 py-2 text-left">Vigência Fim</th>
                  <th className="px-4 py-2 text-right">Registros</th>
                  <th className="px-4 py-2 text-right">Erros</th>
                  <th className="px-4 py-2 text-left">Data</th>
                  <th className="px-4 py-2 text-left">Fonte</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {importacoes.slice(0, 10).map((imp) => (
                  <tr key={imp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{imp.uf}</td>
                    <td className="px-4 py-2">{imp.versao || '-'}</td>
                    <td className="px-4 py-2">
                      {imp.vigencia_fim ? new Date(imp.vigencia_fim).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="px-4 py-2 text-right">{imp.registros_inseridos.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">
                      <span className={imp.registros_erro > 0 ? 'text-red-600' : 'text-green-600'}>
                        {imp.registros_erro}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {new Date(imp.importado_em).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        imp.fonte === 'API' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {imp.fonte}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Lei da Transparência */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-800 mb-2">ℹ️ Sobre a Lei da Transparência Fiscal</h3>
        <p className="text-blue-700 text-sm">
          A Lei 12.741/2012 determina que todo documento fiscal deve informar o valor aproximado 
          dos tributos incidentes sobre o produto ou serviço. O campo <code className="bg-blue-100 px-1 rounded">vTotTrib</code> na 
          NF-e e o texto em <code className="bg-blue-100 px-1 rounded">infCpl</code> são obrigatórios. 
          A fonte oficial das alíquotas é o IBPT (Instituto Brasileiro de Planejamento e Tributação).
        </p>
      </div>
    </div>
  );
}
