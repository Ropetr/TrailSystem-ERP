// =============================================
// PLANAC ERP - Lançamentos Contábeis
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

interface ContaContabil {
  id: string;
  codigo: string;
  nome: string;
  tipo: 'ativo' | 'passivo' | 'receita' | 'despesa' | 'patrimonio';
  natureza: 'devedora' | 'credora';
  nivel: number;
  aceita_lancamento: boolean;
}

interface Lancamento {
  id: string;
  numero: string;
  data: string;
  data_competencia: string;
  tipo: 'manual' | 'automatico';
  origem?: string;
  historico: string;
  partidas: Array<{
    conta_id: string;
    conta_codigo: string;
    conta_nome: string;
    tipo: 'debito' | 'credito';
    valor: number;
  }>;
  total_debito: number;
  total_credito: number;
  status: 'rascunho' | 'confirmado' | 'estornado';
  usuario_criacao: string;
  created_at: string;
}

const statusConfig = {
  rascunho: { label: 'Rascunho', variant: 'warning' as const },
  confirmado: { label: 'Confirmado', variant: 'success' as const },
  estornado: { label: 'Estornado', variant: 'danger' as const },
};

const tipoContaConfig = {
  ativo: { label: 'Ativo', color: 'bg-blue-100 text-blue-700' },
  passivo: { label: 'Passivo', color: 'bg-red-100 text-red-700' },
  receita: { label: 'Receita', color: 'bg-green-100 text-green-700' },
  despesa: { label: 'Despesa', color: 'bg-orange-100 text-orange-700' },
  patrimonio: { label: 'Patrimônio', color: 'bg-purple-100 text-purple-700' },
};

export function LancamentosPage() {
  const toast = useToast();
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [contas, setContas] = useState<ContaContabil[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState(new Date().toISOString().slice(0, 7) + '-01');
  const [periodoFim, setPeriodoFim] = useState(new Date().toISOString().split('T')[0]);
  
  // Modal de lançamento
  const [showLancamentoModal, setShowLancamentoModal] = useState(false);
  const [lancamentoEdit, setLancamentoEdit] = useState<Lancamento | null>(null);
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split('T')[0],
    data_competencia: new Date().toISOString().split('T')[0],
    historico: '',
    partidas: [
      { conta_id: '', tipo: 'debito' as const, valor: '' },
      { conta_id: '', tipo: 'credito' as const, valor: '' },
    ],
  });

  useEffect(() => {
    loadLancamentos();
    loadContas();
  }, [periodoInicio, periodoFim]);

  const loadLancamentos = async () => {
    try {
      const response = await api.get<{ success: boolean; data: Lancamento[] }>(
        `/contabil/lancamentos?inicio=${periodoInicio}&fim=${periodoFim}`
      );
      if (response.success) {
        setLancamentos(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar lançamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const loadContas = async () => {
    try {
      const response = await api.get<{ success: boolean; data: ContaContabil[] }>('/contabil/plano-contas');
      if (response.success) {
        setContas(response.data.filter(c => c.aceita_lancamento));
      }
    } catch (error) {
      console.error('Erro ao carregar contas');
    }
  };

  const handleSalvar = async () => {
    // Validações
    if (!formData.historico.trim()) {
      toast.error('Informe o histórico do lançamento');
      return;
    }

    const partidasValidas = formData.partidas.filter(p => p.conta_id && p.valor);
    if (partidasValidas.length < 2) {
      toast.error('Informe ao menos uma partida de débito e uma de crédito');
      return;
    }

    const totalDebito = partidasValidas.filter(p => p.tipo === 'debito').reduce((acc, p) => acc + parseFloat(p.valor || '0'), 0);
    const totalCredito = partidasValidas.filter(p => p.tipo === 'credito').reduce((acc, p) => acc + parseFloat(p.valor || '0'), 0);

    if (Math.abs(totalDebito - totalCredito) > 0.01) {
      toast.error('Total de débitos deve ser igual ao total de créditos');
      return;
    }

    try {
      const payload = {
        data: formData.data,
        data_competencia: formData.data_competencia,
        historico: formData.historico,
        partidas: partidasValidas.map(p => ({
          conta_id: p.conta_id,
          tipo: p.tipo,
          valor: parseFloat(p.valor),
        })),
      };

      if (lancamentoEdit) {
        await api.put(`/contabil/lancamentos/${lancamentoEdit.id}`, payload);
        toast.success('Lançamento atualizado');
      } else {
        await api.post('/contabil/lancamentos', payload);
        toast.success('Lançamento criado');
      }

      setShowLancamentoModal(false);
      resetForm();
      loadLancamentos();
    } catch (error) {
      toast.error('Erro ao salvar lançamento');
    }
  };

  const handleConfirmar = async (lancamento: Lancamento) => {
    try {
      await api.post(`/contabil/lancamentos/${lancamento.id}/confirmar`);
      toast.success('Lançamento confirmado');
      loadLancamentos();
    } catch (error) {
      toast.error('Erro ao confirmar');
    }
  };

  const handleEstornar = async (lancamento: Lancamento) => {
    if (!confirm('Deseja realmente estornar este lançamento?')) return;

    try {
      await api.post(`/contabil/lancamentos/${lancamento.id}/estornar`);
      toast.success('Lançamento estornado');
      loadLancamentos();
    } catch (error) {
      toast.error('Erro ao estornar');
    }
  };

  const resetForm = () => {
    setLancamentoEdit(null);
    setFormData({
      data: new Date().toISOString().split('T')[0],
      data_competencia: new Date().toISOString().split('T')[0],
      historico: '',
      partidas: [
        { conta_id: '', tipo: 'debito', valor: '' },
        { conta_id: '', tipo: 'credito', valor: '' },
      ],
    });
  };

  const addPartida = () => {
    setFormData({
      ...formData,
      partidas: [...formData.partidas, { conta_id: '', tipo: 'debito', valor: '' }],
    });
  };

  const removePartida = (index: number) => {
    if (formData.partidas.length <= 2) return;
    setFormData({
      ...formData,
      partidas: formData.partidas.filter((_, i) => i !== index),
    });
  };

  const updatePartida = (index: number, field: string, value: any) => {
    const novasPartidas = [...formData.partidas];
    novasPartidas[index] = { ...novasPartidas[index], [field]: value };
    setFormData({ ...formData, partidas: novasPartidas });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

  const filteredLancamentos = lancamentos.filter((l) => {
    return l.historico?.toLowerCase().includes(search.toLowerCase()) ||
           l.numero?.includes(search);
  });

  // Totais
  const totais = {
    debitos: lancamentos.filter(l => l.status === 'confirmado').reduce((acc, l) => acc + l.total_debito, 0),
    creditos: lancamentos.filter(l => l.status === 'confirmado').reduce((acc, l) => acc + l.total_credito, 0),
  };

  const columns = [
    {
      key: 'numero',
      header: 'Nº',
      width: '80px',
      render: (l: Lancamento) => <span className="font-mono text-sm">{l.numero}</span>,
    },
    {
      key: 'data',
      header: 'Data',
      width: '100px',
      render: (l: Lancamento) => (
        <div>
          <p className="text-sm">{formatDate(l.data)}</p>
          {l.data !== l.data_competencia && (
            <p className="text-xs text-gray-500">Comp: {formatDate(l.data_competencia)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'historico',
      header: 'Histórico',
      render: (l: Lancamento) => (
        <div>
          <p className="text-sm">{l.historico}</p>
          {l.tipo === 'automatico' && (
            <p className="text-xs text-gray-500">Auto: {l.origem}</p>
          )}
        </div>
      ),
    },
    {
      key: 'debito',
      header: 'Débito',
      width: '120px',
      render: (l: Lancamento) => (
        <span className="font-medium text-blue-600">{formatCurrency(l.total_debito)}</span>
      ),
    },
    {
      key: 'credito',
      header: 'Crédito',
      width: '120px',
      render: (l: Lancamento) => (
        <span className="font-medium text-red-600">{formatCurrency(l.total_credito)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (l: Lancamento) => {
        const config = statusConfig[l.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (lancamento: Lancamento) => {
    const items = [];
    
    if (lancamento.status === 'rascunho') {
      items.push({
        label: 'Editar',
        icon: <Icons.edit className="w-4 h-4" />,
        onClick: () => {
          setLancamentoEdit(lancamento);
          setFormData({
            data: lancamento.data,
            data_competencia: lancamento.data_competencia,
            historico: lancamento.historico,
            partidas: lancamento.partidas.map(p => ({
              conta_id: p.conta_id,
              tipo: p.tipo,
              valor: p.valor.toString(),
            })),
          });
          setShowLancamentoModal(true);
        },
      });
      items.push({
        label: 'Confirmar',
        icon: <Icons.check className="w-4 h-4" />,
        onClick: () => handleConfirmar(lancamento),
      });
    }
    
    if (lancamento.status === 'confirmado') {
      items.push({
        label: 'Estornar',
        icon: <Icons.x className="w-4 h-4" />,
        variant: 'danger' as const,
        onClick: () => handleEstornar(lancamento),
      });
    }
    
    items.push({
      label: 'Ver Detalhes',
      icon: <Icons.eye className="w-4 h-4" />,
      onClick: () => {},
    });
    
    return items;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lançamentos Contábeis</h1>
          <p className="text-gray-500">Registre e gerencie os lançamentos do período</p>
        </div>
        <Button leftIcon={<Icons.plus className="w-5 h-5" />} onClick={() => { resetForm(); setShowLancamentoModal(true); }}>
          Novo Lançamento
        </Button>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total Débitos</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totais.debitos)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Total Créditos</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totais.creditos)}</p>
        </Card>
        <Card padding="sm">
          <p className="text-sm text-gray-500">Lançamentos</p>
          <p className="text-2xl font-bold">{lancamentos.length}</p>
        </Card>
      </div>

      {/* Filtros */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por histórico ou número..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Input
            label="De"
            type="date"
            value={periodoInicio}
            onChange={(e) => setPeriodoInicio(e.target.value)}
            className="w-40"
          />
          <Input
            label="Até"
            type="date"
            value={periodoFim}
            onChange={(e) => setPeriodoFim(e.target.value)}
            className="w-40"
          />
          <Button variant="secondary" leftIcon={<Icons.printer className="w-5 h-5" />}>
            Razão
          </Button>
        </div>
      </Card>

      {/* Tabela */}
      <Card padding="none">
        <DataTable
          data={filteredLancamentos}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhum lançamento encontrado"
        />
      </Card>

      {/* Modal Lançamento */}
      <Modal
        isOpen={showLancamentoModal}
        onClose={() => setShowLancamentoModal(false)}
        title={lancamentoEdit ? 'Editar Lançamento' : 'Novo Lançamento'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Data"
              type="date"
              value={formData.data}
              onChange={(e) => setFormData({ ...formData, data: e.target.value })}
            />
            <Input
              label="Data Competência"
              type="date"
              value={formData.data_competencia}
              onChange={(e) => setFormData({ ...formData, data_competencia: e.target.value })}
            />
          </div>
          
          <Input
            label="Histórico *"
            value={formData.historico}
            onChange={(e) => setFormData({ ...formData, historico: e.target.value })}
            placeholder="Descrição do lançamento..."
          />
          
          {/* Partidas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Partidas</label>
              <Button size="sm" variant="secondary" onClick={addPartida}>
                + Adicionar Linha
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Conta</th>
                    <th className="text-center p-2 w-24">D/C</th>
                    <th className="text-right p-2 w-32">Valor</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {formData.partidas.map((partida, index) => (
                    <tr key={index}>
                      <td className="p-2">
                        <Select
                          value={partida.conta_id}
                          onChange={(v) => updatePartida(index, 'conta_id', v)}
                          options={[
                            { value: '', label: 'Selecione...' },
                            ...contas.map(c => ({ value: c.id, label: `${c.codigo} - ${c.nome}` })),
                          ]}
                        />
                      </td>
                      <td className="p-2 text-center">
                        <Select
                          value={partida.tipo}
                          onChange={(v) => updatePartida(index, 'tipo', v)}
                          options={[
                            { value: 'debito', label: 'D' },
                            { value: 'credito', label: 'C' },
                          ]}
                        />
                      </td>
                      <td className="p-2">
                        <Input
                          type="number"
                          step="0.01"
                          value={partida.valor}
                          onChange={(e) => updatePartida(index, 'valor', e.target.value)}
                          className="text-right"
                        />
                      </td>
                      <td className="p-2">
                        <button
                          type="button"
                          onClick={() => removePartida(index)}
                          className="text-red-500 hover:text-red-700"
                          disabled={formData.partidas.length <= 2}
                        >
                          <Icons.x className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="p-2 font-medium">Totais</td>
                    <td></td>
                    <td className="p-2 text-right">
                      <div className="text-blue-600">
                        D: {formatCurrency(formData.partidas.filter(p => p.tipo === 'debito').reduce((acc, p) => acc + parseFloat(p.valor || '0'), 0))}
                      </div>
                      <div className="text-red-600">
                        C: {formatCurrency(formData.partidas.filter(p => p.tipo === 'credito').reduce((acc, p) => acc + parseFloat(p.valor || '0'), 0))}
                      </div>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowLancamentoModal(false)}>Cancelar</Button>
            <Button onClick={handleSalvar}>{lancamentoEdit ? 'Atualizar' : 'Salvar'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default LancamentosPage;
