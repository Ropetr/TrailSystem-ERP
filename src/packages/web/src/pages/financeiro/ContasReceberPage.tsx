// =============================================
// PLANAC ERP - Contas a Receber
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

interface ContaReceber {
  id: string;
  numero_documento: string;
  cliente_id: string;
  cliente_nome: string;
  descricao: string;
  origem: 'venda' | 'servico' | 'outros';
  venda_id?: string;
  valor_original: number;
  valor_recebido: number;
  valor_aberto: number;
  data_emissao: string;
  data_vencimento: string;
  data_recebimento?: string;
  status: 'aberta' | 'parcial' | 'recebida' | 'vencida' | 'cancelada';
  forma_pagamento?: string;
  boleto_id?: string;
  boleto_codigo_barras?: string;
}

const statusConfig = {
  aberta: { label: 'Aberta', variant: 'info' as const },
  parcial: { label: 'Parcial', variant: 'warning' as const },
  recebida: { label: 'Recebida', variant: 'success' as const },
  vencida: { label: 'Vencida', variant: 'danger' as const },
  cancelada: { label: 'Cancelada', variant: 'default' as const },
};

const origemConfig = {
  venda: { label: 'Venda', variant: 'success' as const },
  servico: { label: 'Serviço', variant: 'info' as const },
  outros: { label: 'Outros', variant: 'default' as const },
};

export function ContasReceberPage() {
  const toast = useToast();
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  
  // Modal de recebimento
  const [showRecebimentoModal, setShowRecebimentoModal] = useState(false);
  const [contaReceber, setContaReceber] = useState<ContaReceber | null>(null);
  const [recebimentoForm, setRecebimentoForm] = useState({
    valor: 0,
    data_recebimento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'pix',
    conta_bancaria_id: '',
    juros: 0,
    multa: 0,
    desconto: 0,
  });

  // Modal de emissão de boleto
  const [showBoletoModal, setShowBoletoModal] = useState(false);
  const [contaBoleto, setContaBoleto] = useState<ContaReceber | null>(null);

  useEffect(() => {
    loadContas();
  }, []);

  const loadContas = async () => {
    try {
      const response = await api.get<{ success: boolean; data: ContaReceber[] }>('/financeiro/contas-receber');
      if (response.success) {
        setContas(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar contas a receber');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceber = async () => {
    if (!contaReceber || !recebimentoForm.valor) {
      toast.error('Informe o valor do recebimento');
      return;
    }

    try {
      const valorTotal = recebimentoForm.valor + 
        (recebimentoForm.juros || 0) + 
        (recebimentoForm.multa || 0) - 
        (recebimentoForm.desconto || 0);

      await api.post(`/financeiro/contas-receber/${contaReceber.id}/receber`, {
        ...recebimentoForm,
        valor: valorTotal,
      });
      
      toast.success('Recebimento registrado com sucesso');
      setShowRecebimentoModal(false);
      setContaReceber(null);
      loadContas();
    } catch (error) {
      toast.error('Erro ao registrar recebimento');
    }
  };

  const handleEmitirBoleto = async () => {
    if (!contaBoleto) return;

    try {
      const response = await api.post<{ success: boolean; data: any }>(
        `/financeiro/contas-receber/${contaBoleto.id}/boleto`
      );
      
      if (response.success) {
        toast.success('Boleto emitido com sucesso');
        // Abrir PDF do boleto
        if (response.data.url_pdf) {
          window.open(response.data.url_pdf, '_blank');
        }
        setShowBoletoModal(false);
        loadContas();
      }
    } catch (error) {
      toast.error('Erro ao emitir boleto');
    }
  };

  const handleEnviarCobranca = async (conta: ContaReceber) => {
    try {
      await api.post(`/financeiro/contas-receber/${conta.id}/enviar-cobranca`);
      toast.success('Cobrança enviada por e-mail e WhatsApp');
    } catch (error) {
      toast.error('Erro ao enviar cobrança');
    }
  };

  const filteredContas = contas.filter((conta) => {
    const matchSearch =
      conta.numero_documento?.toLowerCase().includes(search.toLowerCase()) ||
      conta.cliente_nome?.toLowerCase().includes(search.toLowerCase()) ||
      conta.descricao?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = !statusFilter || conta.status === statusFilter;

    const dataVenc = new Date(conta.data_vencimento);
    const matchPeriodoInicio = !periodoInicio || dataVenc >= new Date(periodoInicio);
    const matchPeriodoFim = !periodoFim || dataVenc <= new Date(periodoFim + 'T23:59:59');

    return matchSearch && matchStatus && matchPeriodoInicio && matchPeriodoFim;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getDiasVencimento = (dataVencimento: string) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(dataVencimento);
    vencimento.setHours(0, 0, 0, 0);
    return Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Estatísticas
  const stats = {
    total: filteredContas.reduce((acc, c) => acc + c.valor_aberto, 0),
    vencidas: filteredContas.filter(c => c.status === 'vencida').reduce((acc, c) => acc + c.valor_aberto, 0),
    aVencer7dias: filteredContas.filter(c => {
      const dias = getDiasVencimento(c.data_vencimento);
      return c.status === 'aberta' && dias >= 0 && dias <= 7;
    }).reduce((acc, c) => acc + c.valor_aberto, 0),
    recebidoMes: filteredContas.filter(c => {
      if (c.status !== 'recebida' || !c.data_recebimento) return false;
      const dataRec = new Date(c.data_recebimento);
      const hoje = new Date();
      return dataRec.getMonth() === hoje.getMonth() && dataRec.getFullYear() === hoje.getFullYear();
    }).reduce((acc, c) => acc + c.valor_recebido, 0),
  };

  const columns = [
    {
      key: 'vencimento',
      header: 'Vencimento',
      width: '100px',
      sortable: true,
      render: (conta: ContaReceber) => {
        const dias = getDiasVencimento(conta.data_vencimento);
        return (
          <div>
            <p className="font-medium">{formatDate(conta.data_vencimento)}</p>
            {['aberta', 'parcial'].includes(conta.status) && (
              <p className={`text-xs ${dias < 0 ? 'text-red-500' : dias <= 3 ? 'text-orange-500' : 'text-gray-500'}`}>
                {dias < 0 ? `${Math.abs(dias)}d atrasado` : dias === 0 ? 'Hoje' : `${dias}d restantes`}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (conta: ContaReceber) => (
        <div>
          <p className="font-medium text-gray-900">{conta.cliente_nome}</p>
          <p className="text-sm text-gray-500">{conta.descricao}</p>
        </div>
      ),
    },
    {
      key: 'origem',
      header: 'Origem',
      width: '100px',
      render: (conta: ContaReceber) => {
        const config = origemConfig[conta.origem];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: 'documento',
      header: 'Documento',
      width: '120px',
      render: (conta: ContaReceber) => (
        <div>
          <span className="font-mono text-sm">{conta.numero_documento || '-'}</span>
          {conta.boleto_id && (
            <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
              <Icons.document className="w-3 h-3" /> Boleto
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      width: '130px',
      sortable: true,
      render: (conta: ContaReceber) => (
        <div>
          <p className="font-bold">{formatCurrency(conta.valor_aberto)}</p>
          {conta.valor_recebido > 0 && (
            <p className="text-xs text-green-600">Recebido: {formatCurrency(conta.valor_recebido)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (conta: ContaReceber) => {
        const config = statusConfig[conta.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (conta: ContaReceber) => {
    const items = [];

    if (['aberta', 'vencida', 'parcial'].includes(conta.status)) {
      items.push({
        label: 'Registrar Recebimento',
        icon: <Icons.check className="w-4 h-4" />,
        variant: 'success' as const,
        onClick: () => {
          setContaReceber(conta);
          setRecebimentoForm({
            ...recebimentoForm,
            valor: conta.valor_aberto,
          });
          setShowRecebimentoModal(true);
        },
      });

      if (!conta.boleto_id) {
        items.push({
          label: 'Emitir Boleto',
          icon: <Icons.document className="w-4 h-4" />,
          onClick: () => {
            setContaBoleto(conta);
            setShowBoletoModal(true);
          },
        });
      }

      if (conta.status === 'vencida') {
        items.push({
          label: 'Enviar Cobrança',
          icon: <Icons.email className="w-4 h-4" />,
          onClick: () => handleEnviarCobranca(conta),
        });
      }
    }

    if (conta.boleto_id) {
      items.push({
        label: 'Ver Boleto',
        icon: <Icons.printer className="w-4 h-4" />,
        onClick: () => window.open(`/api/financeiro/boletos/${conta.boleto_id}/pdf`, '_blank'),
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
          <h1 className="text-2xl font-bold text-gray-900">Contas a Receber</h1>
          <p className="text-gray-500">Gerencie seus recebimentos</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            leftIcon={<Icons.email className="w-5 h-5" />}
          >
            Cobrar Vencidas
          </Button>
          <Button leftIcon={<Icons.plus className="w-5 h-5" />}>
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Icons.document className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.recebidoMes)}</p>
              <p className="text-sm text-gray-500">Recebido no Mês</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Icons.x className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.vencidas)}</p>
              <p className="text-sm text-gray-500">Vencidas</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Icons.eye className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.aVencer7dias)}</p>
              <p className="text-sm text-gray-500">Próximos 7 dias</p>
            </div>
          </div>
        </Card>
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-planac-100 rounded-lg">
              <Icons.document className="w-5 h-5 text-planac-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-planac-600">{formatCurrency(stats.total)}</p>
              <p className="text-sm text-gray-500">Total a Receber</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por cliente, documento..."
              leftIcon={<Icons.search className="w-5 h-5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: '', label: 'Todos Status' },
                ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label })),
              ]}
            />
          </div>
          <div className="w-36">
            <Input
              type="date"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
            />
          </div>
          <div className="w-36">
            <Input
              type="date"
              value={periodoFim}
              onChange={(e) => setPeriodoFim(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        <DataTable
          data={filteredContas}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyMessage="Nenhuma conta a receber encontrada"
        />
      </Card>

      {/* Modal de Recebimento */}
      <Modal
        isOpen={showRecebimentoModal}
        onClose={() => {
          setShowRecebimentoModal(false);
          setContaReceber(null);
        }}
        title="Registrar Recebimento"
        size="md"
      >
        {contaReceber && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{contaReceber.cliente_nome}</p>
              <p className="text-sm text-gray-500">{contaReceber.descricao}</p>
              <p className="text-lg font-bold text-planac-600 mt-2">
                Valor em aberto: {formatCurrency(contaReceber.valor_aberto)}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Valor Recebido"
                type="number"
                step="0.01"
                value={recebimentoForm.valor || ''}
                onChange={(e) => setRecebimentoForm({ ...recebimentoForm, valor: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Data do Recebimento"
                type="date"
                value={recebimentoForm.data_recebimento}
                onChange={(e) => setRecebimentoForm({ ...recebimentoForm, data_recebimento: e.target.value })}
              />
            </div>
            
            <Select
              label="Forma de Recebimento"
              value={recebimentoForm.forma_pagamento}
              onChange={(v) => setRecebimentoForm({ ...recebimentoForm, forma_pagamento: v })}
              options={[
                { value: 'dinheiro', label: 'Dinheiro' },
                { value: 'pix', label: 'PIX' },
                { value: 'transferencia', label: 'Transferência' },
                { value: 'boleto', label: 'Boleto' },
                { value: 'cartao_credito', label: 'Cartão de Crédito' },
                { value: 'cartao_debito', label: 'Cartão de Débito' },
              ]}
            />
            
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Juros"
                type="number"
                step="0.01"
                value={recebimentoForm.juros || ''}
                onChange={(e) => setRecebimentoForm({ ...recebimentoForm, juros: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Multa"
                type="number"
                step="0.01"
                value={recebimentoForm.multa || ''}
                onChange={(e) => setRecebimentoForm({ ...recebimentoForm, multa: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Desconto"
                type="number"
                step="0.01"
                value={recebimentoForm.desconto || ''}
                onChange={(e) => setRecebimentoForm({ ...recebimentoForm, desconto: parseFloat(e.target.value) || 0 })}
              />
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800">
                <strong>Valor Total:</strong>{' '}
                {formatCurrency(
                  recebimentoForm.valor + 
                  (recebimentoForm.juros || 0) + 
                  (recebimentoForm.multa || 0) - 
                  (recebimentoForm.desconto || 0)
                )}
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowRecebimentoModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleReceber}>
                Confirmar Recebimento
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Emitir Boleto */}
      <Modal
        isOpen={showBoletoModal}
        onClose={() => setShowBoletoModal(false)}
        title="Emitir Boleto"
        size="md"
      >
        {contaBoleto && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{contaBoleto.cliente_nome}</p>
              <p className="text-gray-500">{contaBoleto.descricao}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Valor</p>
                <p className="text-xl font-bold">{formatCurrency(contaBoleto.valor_aberto)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Vencimento</p>
                <p className="text-xl font-bold">{formatDate(contaBoleto.data_vencimento)}</p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-800 text-sm">
                O boleto será gerado via integração com o banco e enviado automaticamente por e-mail ao cliente.
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowBoletoModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEmitirBoleto}>
                Emitir Boleto
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default ContasReceberPage;
