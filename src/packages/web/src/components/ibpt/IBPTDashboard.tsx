// =============================================
// PLANAC ERP - Dashboard IBPT
// Visualização de estatísticas e consulta
// =============================================

import { useState, useEffect } from 'react';

// ===== TIPOS =====

interface CacheStats {
  total_registros: number;
  registros_validos: number;
  registros_expirados: number;
  registros_expirando_7_dias: number;
  ultima_atualizacao: string | null;
  versao_mais_recente: string | null;
  por_uf?: Array<{ uf: string; total: number }>;
}

interface ConsultaResultado {
  codigo: string;
  descricao: string;
  valor_produto: number;
  origem: string;
  aliquota_federal: number;
  aliquota_estadual: number;
  aliquota_municipal: number;
  valor_tributo_federal: number;
  valor_tributo_estadual: number;
  valor_tributo_municipal: number;
  valor_tributo_total: number;
  vigencia_fim: string;
  fonte: string;
  cache_hit: boolean;
}

interface JobExecucao {
  id: number;
  job_name: string;
  executed_at: string;
  status: string;
  resultado: string;
}

// ===== COMPONENTE =====

interface IBPTDashboardProps {
  apiBaseUrl?: string;
}

export default function IBPTDashboard({ apiBaseUrl = '/api/v1' }: IBPTDashboardProps) {
  // Estados
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [jobs, setJobs] = useState<JobExecucao[]>([]);
  const [loading, setLoading] = useState(true);

  // Consulta
  const [ncm, setNcm] = useState('');
  const [uf, setUf] = useState('PR');
  const [valor, setValor] = useState('100');
  const [consultando, setConsultando] = useState(false);
  const [resultado, setResultado] = useState<ConsultaResultado | null>(null);
  const [erroConsulta, setErroConsulta] = useState<string | null>(null);

  // ===== CARREGAR DADOS =====

  useEffect(() => {
    const carregar = async () => {
      try {
        const [statsRes, jobsRes] = await Promise.all([
          fetch(`${apiBaseUrl}/ibpt/cache/estatisticas`),
          fetch(`${apiBaseUrl}/jobs/execucoes?job_name=atualizar_ibpt&limit=10`).catch(() => null),
        ]);

        if (statsRes.ok) {
          setStats(await statsRes.json());
        }

        if (jobsRes?.ok) {
          const data = await jobsRes.json();
          setJobs(data.data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard IBPT:', err);
      } finally {
        setLoading(false);
      }
    };

    carregar();
  }, [apiBaseUrl]);

  // ===== CONSULTAR NCM =====

  const consultarNCM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ncm) return;

    setConsultando(true);
    setErroConsulta(null);
    setResultado(null);

    try {
      const params = new URLSearchParams({
        uf,
        valor,
        descricao: 'Consulta manual',
        unidade: 'UN',
      });

      const response = await fetch(`${apiBaseUrl}/ibpt/consultar/${ncm.replace(/\D/g, '')}?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na consulta');
      }

      setResultado(data);
    } catch (err: any) {
      setErroConsulta(err.message);
    } finally {
      setConsultando(false);
    }
  };

  // ===== UFS =====

  const UFS = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
  ];

  // ===== CALCULAR PERCENTUAIS =====

  const calcPercent = (part: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((part / total) * 100);
  };

  // ===== RENDER =====

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard IBPT</h1>
        <p className="text-gray-600">Monitoramento do cache e consultas de tributos</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-3xl font-bold text-blue-600">
            {stats?.total_registros.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600">Total no Cache</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-3xl font-bold text-green-600">
            {stats?.registros_validos.toLocaleString() || 0}
          </div>
          <div className="text-sm text-gray-600">Registros Válidos</div>
          {stats && (
            <div className="text-xs text-green-500">
              {calcPercent(stats.registros_validos, stats.total_registros)}% do total
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-3xl font-bold text-yellow-600">
            {stats?.registros_expirando_7_dias || 0}
          </div>
          <div className="text-sm text-gray-600">Expirando (7 dias)</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="text-3xl font-bold text-red-600">
            {stats?.registros_expirados || 0}
          </div>
          <div className="text-sm text-gray-600">Expirados</div>
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Consulta Rápida */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">🔍 Consulta Rápida NCM</h2>

          <form onSubmit={consultarNCM} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-medium text-gray-600 mb-1">NCM</label>
                <input
                  type="text"
                  value={ncm}
                  onChange={(e) => setNcm(e.target.value)}
                  placeholder="22030000"
                  maxLength={8}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">UF</label>
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
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={consultando || !ncm}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium"
            >
              {consultando ? 'Consultando...' : 'Consultar Tributos'}
            </button>
          </form>

          {/* Resultado */}
          {erroConsulta && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {erroConsulta}
            </div>
          )}

          {resultado && (
            <div className="mt-4 space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="font-mono font-bold">{resultado.codigo}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      resultado.cache_hit ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {resultado.cache_hit ? 'Cache' : 'API'}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {resultado.valor_tributo_total.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">tributo total</div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{resultado.descricao}</p>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-blue-100 rounded p-2">
                    <div className="font-bold text-blue-700">{resultado.aliquota_federal.toFixed(2)}%</div>
                    <div className="text-blue-600">Federal</div>
                    <div className="text-blue-800 font-semibold">R$ {resultado.valor_tributo_federal.toFixed(2)}</div>
                  </div>
                  <div className="bg-green-100 rounded p-2">
                    <div className="font-bold text-green-700">{resultado.aliquota_estadual.toFixed(2)}%</div>
                    <div className="text-green-600">Estadual</div>
                    <div className="text-green-800 font-semibold">R$ {resultado.valor_tributo_estadual.toFixed(2)}</div>
                  </div>
                  <div className="bg-purple-100 rounded p-2">
                    <div className="font-bold text-purple-700">{resultado.aliquota_municipal.toFixed(2)}%</div>
                    <div className="text-purple-600">Municipal</div>
                    <div className="text-purple-800 font-semibold">R$ {resultado.valor_tributo_municipal.toFixed(2)}</div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex justify-between">
                  <span>Fonte: {resultado.fonte}</span>
                  {resultado.vigencia_fim && (
                    <span>Vigência: {new Date(resultado.vigencia_fim).toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
              </div>

              {/* Texto para NF-e */}
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-xs font-medium text-yellow-700 mb-1">Texto para infCpl (NF-e):</div>
                <code className="text-xs text-yellow-800 break-all">
                  Val Aprox Tributos R$ {resultado.valor_tributo_total.toFixed(2)} ({resultado.valor_tributo_federal.toFixed(2)} Federal, {resultado.valor_tributo_estadual.toFixed(2)} Estadual{resultado.valor_tributo_municipal > 0 ? `, ${resultado.valor_tributo_municipal.toFixed(2)} Municipal` : ''}) Fonte: IBPT - Lei 12.741/2012
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Distribuição por UF */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">📊 Distribuição por UF</h2>

          {stats?.por_uf && stats.por_uf.length > 0 ? (
            <div className="space-y-2">
              {stats.por_uf.slice(0, 10).map((item) => (
                <div key={item.uf} className="flex items-center gap-3">
                  <div className="w-10 font-mono font-bold text-gray-700">{item.uf}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${calcPercent(item.total, stats.total_registros)}%` }}
                    />
                  </div>
                  <div className="w-20 text-right text-sm text-gray-600">
                    {item.total.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum dado por UF disponível
            </div>
          )}
        </div>
      </div>

      {/* Informações do Cache */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">ℹ️ Informações do Sistema</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Versão da Tabela:</span>
            <div className="font-semibold">{stats?.versao_mais_recente || 'N/A'}</div>
          </div>
          <div>
            <span className="text-gray-500">Última Atualização:</span>
            <div className="font-semibold">
              {stats?.ultima_atualizacao 
                ? new Date(stats.ultima_atualizacao).toLocaleString('pt-BR')
                : 'N/A'
              }
            </div>
          </div>
          <div>
            <span className="text-gray-500">Taxa de Cache:</span>
            <div className="font-semibold text-green-600">
              {stats ? `${calcPercent(stats.registros_validos, stats.total_registros)}%` : 'N/A'}
            </div>
          </div>
          <div>
            <span className="text-gray-500">Job Automático:</span>
            <div className="font-semibold">04:00 (Brasília)</div>
          </div>
        </div>
      </div>

      {/* Últimas Execuções */}
      {jobs.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-semibold mb-4">🕐 Últimas Atualizações</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Data/Hora</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobs.map((job) => {
                  const resultado = job.resultado ? JSON.parse(job.resultado) : {};
                  return (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-600">
                        {new Date(job.executed_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          job.status === 'sucesso' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">
                        {resultado.atualizados !== undefined 
                          ? `${resultado.atualizados} atualizados, ${resultado.erros || 0} erros`
                          : resultado.acao || '-'
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
