// =============================================
// PLANAC ERP - Conciliação Bancária
// =============================================

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import api from '@/services/api';

interface ExtratoItem {
  id: string;
  data: string;
  descricao: string;
  tipo: 'credito' | 'debito';
  valor: number;
  saldo: number;
  status: 'pendente' | 'conciliado' | 'ignorado';
  movimentacao_id?: string;
  movimentacao_descricao?: string;
}

interface MovimentacaoPendente {
  id: string;
  data: string;
  descricao: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  origem: string;
  conciliado: boolean;
}

interface ContaBancaria {
  id: string;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  saldo_sistema: number;
  saldo_banco?: number;
}

export function ConciliacaoPage() {
  const toast = useToast();
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [contaSelecionada, setContaSelecionada] = useState<string>('');
  const [extrato, setExtrato] = useState<ExtratoItem[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoPendente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [periodoInicio, setPeriodoInicio] = useState(() => {
    const hoje = new Date();
    hoje.setDate(1);
    return hoje.toISOString().split('T')[0];
  });
  const [periodoFim, setPeriodoFim] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Modal de importação
  const [showImportModal, setShowImportModal] = useState(false);
  const [arquivoOFX, setArquivoOFX] = useState<File | null>(null);
  
  // Modal de conciliação manual
  const [showConciliarModal, setShowConciliarModal] = useState(false);
  const [extratoSelecionado, setExtratoSelecionado] = useState<ExtratoItem | null>(null);
  const [movSelecionada, setMovSelecionada] = useState<string>('');

  useEffect(() => {
    loadContas();
  }, []);

  useEffect(() => {
    if (contaSelecionada) {
      loadDados();
    }
  }, [contaSelecionada, periodoInicio, periodoFim]);

  const loadContas = async () => {
    try {
      const response = await api.get<{ success: boolean; data: ContaBancaria[] }>('/financeiro/contas-bancarias');
      if (response.success) {
        setContas(response.data);
        if (response.data.length > 0) {
          setContaSelecionada(response.data[0].id);
        }
      }
    } catch (error) {
      toast.error('Erro ao carregar contas bancárias');
    }
  };

  const loadDados = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        conta_bancaria_id: contaSelecionada,
        data_inicio: periodoInicio,
        data_fim: periodoFim,
      });

      const [extratoRes, movRes] = await Promise.all([
        api.get<{ success: boolean; data: ExtratoItem[] }>(`/financeiro/conciliacao/extrato?${params}`),
        api.get<{ success: boolean; data: MovimentacaoPendente[] }>(`/financeiro/conciliacao/movimentacoes?${params}`),
      ]);

      if (extratoRes.success) setExtrato(extratoRes.data);
      if (movRes.success) setMovimentacoes(movRes.data);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportarOFX = async () => {
    if (!arquivoOFX) {
      toast.error('Selecione um arquivo OFX');
      return;
    }

    const formData = new FormData();
    formData.append('arquivo', arquivoOFX);
    formData.append('conta_bancaria_id', contaSelecionada);

    try {
      await api.post('/financeiro/conciliacao/importar-ofx', formData);
      toast.success('Extrato importado com sucesso');
      setShowImportModal(false);
      setArquivoOFX(null);
      loadDados();
    } catch (error) {
      toast.error('Erro ao importar arquivo OFX');
    }
  };

  const handleConciliarAutomatico = async () => {
    try {
      const response = await api.post<{ success: boolean; data: { conciliados: number } }>(
        '/financeiro/conciliacao/automatico',
        { conta_bancaria_id: contaSelecionada }
      );
      
      if (response.success) {
        toast.success(`${response.data.conciliados} lançamentos conciliados automaticamente`);
        loadDados();
      }
    } catch (error) {
      toast.error('Erro na conciliação automática');
    }
  };

  const handleConciliarManual = async () => {
    if (!extratoSelecionado || !movSelecionada) {
      toast.error('Selecione uma movimentação');
      return;
    }

    try {
      await api.post('/financeiro/conciliacao/manual', {
        extrato_id: extratoSelecionado.id,
        movimentacao_id: movSelecionada,
      });
      
      toast.success('Lançamento conciliado');
      setShowConciliarModal(false);
      setExtratoSelecionado(null);
      setMovSelecionada('');
      loadDados();
    } catch (error) {
      toast.error('Erro ao conciliar');
    }
  };

  const handleIgnorar = async (item: ExtratoItem) => {
    try {
      await api.post(`/financeiro/conciliacao/extrato/${item.id}/ignorar`);
      toast.success('Lançamento ignorado');
      loadDados();
    } catch (error) {
      toast.error('Erro ao ignorar lançamento');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const contaAtual = contas.find(c => c.id === contaSelecionada);
  
  // Estatísticas
  const stats = {
    pendentes: extrato.filter(e => e.status === 'pendente').length,
    conciliados: extrato.filter(e => e.status === 'conciliado').length,
    diferenca: (contaAtual?.saldo_banco || 0) - (contaAtual?.saldo_sistema || 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Conciliação Bancária</h1>
          <p className="text-gray-500">Compare o extrato bancário com suas movimentações</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={<Icons.document className="w-5 h-5" />}
            onClick={() => setShowImportModal(true)}
          >
            Importar OFX
          </Button>
          <Button
            leftIcon={<Icons.check className="w-5 h-5" />}
            onClick={handleConciliarAutomatico}
          >
            Conciliar Automático
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="w-64">
            <Select
              label="Conta Bancária"
              value={contaSelecionada}
              onChange={setContaSelecionada}
              options={contas.map(c => ({
                value: c.id,
                label: `${c.banco} - Ag ${c.agencia} / CC ${c.conta}`,
              }))}
            />
          </div>
          <div className="w-40">
            <Input
              label="De"
              type="date"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
            />
          </div>
          <div className="w-40">
            <Input
              label="Até"
              type="date"
              value={periodoFim}
              onChange={(e) => setPeriodoFim(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Stats */}
      {contaAtual && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <p className="text-sm text-gray-500">Saldo no Sistema</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(contaAtual.saldo_sistema)}</p>
          </Card>
          <Card padding="sm">
            <p className="text-sm text-gray-500">Saldo no Banco</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(contaAtual.saldo_banco || 0)}</p>
          </Card>
          <Card padding="sm">
            <p className="text-sm text-gray-500">Diferença</p>
            <p className={`text-xl font-bold ${stats.diferenca === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(stats.diferenca)}
            </p>
          </Card>
          <Card padding="sm">
            <p className="text-sm text-gray-500">Pendentes / Conciliados</p>
            <p className="text-xl font-bold">
              <span className="text-orange-600">{stats.pendentes}</span>
              {' / '}
              <span className="text-green-600">{stats.conciliados}</span>
            </p>
          </Card>
        </div>
      )}

      {/* Duas colunas: Extrato e Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Extrato Bancário */}
        <Card padding="none">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium">Extrato Bancário</h3>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-planac-500" />
            </div>
          ) : extrato.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum lançamento no extrato</p>
              <p className="text-sm">Importe um arquivo OFX</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-auto">
              {extrato.map((item) => (
                <div
                  key={item.id}
                  className={`px-4 py-3 flex items-center justify-between hover:bg-gray-50 ${
                    item.status === 'conciliado' ? 'bg-green-50' : 
                    item.status === 'ignorado' ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{formatDate(item.data)}</span>
                      <Badge 
                        variant={item.status === 'conciliado' ? 'success' : item.status === 'ignorado' ? 'default' : 'warning'}
                      >
                        {item.status === 'conciliado' ? 'Conciliado' : item.status === 'ignorado' ? 'Ignorado' : 'Pendente'}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">{item.descricao}</p>
                    {item.movimentacao_descricao && (
                      <p className="text-xs text-green-600 mt-1">↳ {item.movimentacao_descricao}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-medium ${item.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                      {item.tipo === 'credito' ? '+' : '-'} {formatCurrency(item.valor)}
                    </p>
                    {item.status === 'pendente' && (
                      <div className="flex gap-1 mt-1">
                        <button
                          onClick={() => {
                            setExtratoSelecionado(item);
                            setShowConciliarModal(true);
                          }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Conciliar
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleIgnorar(item)}
                          className="text-xs text-gray-500 hover:underline"
                        >
                          Ignorar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Movimentações do Sistema */}
        <Card padding="none">
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium">Movimentações do Sistema</h3>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-planac-500" />
            </div>
          ) : movimentacoes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhuma movimentação pendente</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 max-h-[500px] overflow-auto">
              {movimentacoes.map((mov) => (
                <div
                  key={mov.id}
                  className={`px-4 py-3 flex items-center justify-between hover:bg-gray-50 ${
                    mov.conciliado ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">{formatDate(mov.data)}</span>
                      <Badge variant={mov.conciliado ? 'success' : 'info'}>
                        {mov.origem}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">{mov.descricao}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`font-medium ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {mov.tipo === 'entrada' ? '+' : '-'} {formatCurrency(mov.valor)}
                    </p>
                    {mov.conciliado && (
                      <span className="text-xs text-green-600">✓ Conciliado</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Modal Importar OFX */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importar Extrato OFX"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800 text-sm">
              Importe o arquivo OFX do extrato bancário. A maioria dos bancos permite exportar este formato no internet banking.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo OFX
            </label>
            <input
              type="file"
              accept=".ofx,.OFX"
              onChange={(e) => setArquivoOFX(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-planac-50 file:text-planac-700 hover:file:bg-planac-100"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowImportModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImportarOFX} disabled={!arquivoOFX}>
              Importar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Conciliar Manual */}
      <Modal
        isOpen={showConciliarModal}
        onClose={() => {
          setShowConciliarModal(false);
          setExtratoSelecionado(null);
          setMovSelecionada('');
        }}
        title="Conciliar Lançamento"
        size="lg"
      >
        {extratoSelecionado && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500">Lançamento do Extrato</p>
              <p className="font-medium">{extratoSelecionado.descricao}</p>
              <p className={`text-lg font-bold ${extratoSelecionado.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                {extratoSelecionado.tipo === 'credito' ? '+' : '-'} {formatCurrency(extratoSelecionado.valor)}
              </p>
              <p className="text-sm text-gray-500">{formatDate(extratoSelecionado.data)}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione a movimentação correspondente
              </label>
              <div className="border rounded-lg divide-y max-h-64 overflow-auto">
                {movimentacoes
                  .filter(m => !m.conciliado)
                  .filter(m => 
                    (extratoSelecionado.tipo === 'credito' && m.tipo === 'entrada') ||
                    (extratoSelecionado.tipo === 'debito' && m.tipo === 'saida')
                  )
                  .map((mov) => (
                    <label
                      key={mov.id}
                      className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 ${
                        movSelecionada === mov.id ? 'bg-planac-50' : ''
                      }`}
                    >
                      <input
                        type="radio"
                        name="movimentacao"
                        value={mov.id}
                        checked={movSelecionada === mov.id}
                        onChange={(e) => setMovSelecionada(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className="text-sm">{mov.descricao}</p>
                        <p className="text-xs text-gray-500">{formatDate(mov.data)} - {mov.origem}</p>
                      </div>
                      <span className={`font-medium ${mov.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(mov.valor)}
                      </span>
                    </label>
                  ))
                }
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowConciliarModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConciliarManual} disabled={!movSelecionada}>
                Conciliar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ConciliacaoPage;
