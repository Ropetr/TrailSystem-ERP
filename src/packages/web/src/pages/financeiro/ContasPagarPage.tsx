// =============================================
// PLANAC ERP - Contas a Pagar
// =============================================

import { useState, useEffect } from 'react';
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

interface ContaPagar {
  id: string;
  numero_documento: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  descricao: string;
  categoria: string;
  valor_original: number;
  valor_pago: number;
  valor_aberto: number;
  data_emissao: string;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'aberta' | 'parcial' | 'paga' | 'vencida' | 'cancelada';
  forma_pagamento?: string;
  centro_custo?: string;
  observacao?: string;
}

interface Pagamento {
  conta_id: string;
  valor: number;
  data_pagamento: string;
  forma_pagamento: string;
  conta_bancaria_id?: string;
  juros?: number;
  multa?: number;
  desconto?: number;
}

const statusConfig = {
  aberta: { label: 'Aberta', variant: 'info' as const },
  parcial: { label: 'Parcial', variant: 'warning' as const },
  paga: { label: 'Paga', variant: 'success' as const },
  vencida: { label: 'Vencida', variant: 'danger' as const },
  cancelada: { label: 'Cancelada', variant: 'default' as const },
};

const formaPagamentoOptions = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência Bancária' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cartao', label: 'Cartão' },
];

export function ContasPagarPage() {
  const toast = useToast();
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  
  // Modal de pagamento
  const [showPagamentoModal, setShowPagamentoModal] = useState(false);
  const [contaPagar, setContaPagar] = useState<ContaPagar | null>(null);
  const [pagamentoForm, setPagamentoForm] = useState<Partial<Pagamento>>({
    data_pagamento: new Date().toISOString().split('T')[0],
    forma_pagamento: 'pix',
    juros: 0,
    multa: 0,
    desconto: 0,
  });
  
  // Modal de nova conta
  const [showNovaContaModal, setShowNovaContaModal] = useState(false);
  const [novaContaForm, setNovaContaForm] = useState({
    fornecedor_id: '',
    descricao: '',
    valor_original: 0,
    data_vencimento: '',
    categoria: '',
  });

  useEffect(() => {
    loadContas();
  }, []);

    const loadContas = async () => {
      try {
        const response = await api.get<{ success: boolean; data: ContaPagar[] }>('/contas-pagar');
        if (response.success) {
          setContas(response.data || []);
        }
      } catch (error) {
        console.error('Erro ao carregar contas a pagar:', error);
        toast.error('Erro ao carregar contas a pagar');
      } finally {
        setIsLoading(false);
      }
    };

  const handlePagar = async () => {
    if (!contaPagar || !pagamentoForm.valor) {
      toast.error('Informe o valor do pagamento');
      return;
    }

    try {
      const valorTotal = (pagamentoForm.valor || 0) + 
        (pagamentoForm.juros || 0) + 
        (pagamentoForm.multa || 0) - 
        (pagamentoForm.desconto || 0);

      await api.post(`/contas-pagar/${contaPagar.id}/pagar`, {
        ...pagamentoForm,
        valor: valorTotal,
      });
      
      toast.success('Pagamento registrado com sucesso');
      setShowPagamentoModal(false);
      setContaPagar(null);
      loadContas();
    } catch (error) {
      toast.error('Erro ao registrar pagamento');
    }
  };

  const handleCriarConta = async () => {
    if (!novaContaForm.fornecedor_id || !novaContaForm.valor_original || !novaContaForm.data_vencimento) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await api.post('/contas-pagar', novaContaForm);
      toast.success('Conta criada com sucesso');
      setShowNovaContaModal(false);
      setNovaContaForm({
        fornecedor_id: '',
        descricao: '',
        valor_original: 0,
        data_vencimento: '',
        categoria: '',
      });
      loadContas();
    } catch (error) {
      toast.error('Erro ao criar conta');
    }
  };

  const handleCancelar = async (conta: ContaPagar) => {
    if (!confirm('Deseja realmente cancelar esta conta?')) return;

    try {
      await api.post(`/contas-pagar/${conta.id}/cancelar`);
      toast.success('Conta cancelada');
      loadContas();
    } catch (error) {
      toast.error('Erro ao cancelar conta');
    }
  };

  const filteredContas = contas.filter((conta) => {
    const matchSearch =
      conta.numero_documento?.toLowerCase().includes(search.toLowerCase()) ||
      conta.fornecedor_nome?.toLowerCase().includes(search.toLowerCase()) ||
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
    const diff = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Estatísticas
  const stats = {
    total: filteredContas.reduce((acc, c) => acc + c.valor_aberto, 0),
    vencidas: filteredContas.filter(c => c.status === 'vencida').reduce((acc, c) => acc + c.valor_aberto, 0),
    aVencer7dias: filteredContas.filter(c => {
      const dias = getDiasVencimento(c.data_vencimento);
      return c.status === 'aberta' && dias >= 0 && dias <= 7;
    }).reduce((acc, c) => acc + c.valor_aberto, 0),
    quantidade: filteredContas.filter(c => ['aberta', 'vencida', 'parcial'].includes(c.status)).length,
  };

  const columns = [
    {
      key: 'vencimento',
      header: 'Vencimento',
      width: '100px',
      sortable: true,
      render: (conta: ContaPagar) => {
        const dias = getDiasVencimento(conta.data_vencimento);
        return (
          <div>
            <p className="font-medium">{formatDate(conta.data_vencimento)}</p>
            {conta.status === 'aberta' && (
              <p className={`text-xs ${dias < 0 ? 'text-red-500' : dias <= 3 ? 'text-orange-500' : 'text-gray-500'}`}>
                {dias < 0 ? `${Math.abs(dias)}d atrasado` : dias === 0 ? 'Hoje' : `${dias}d restantes`}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'fornecedor',
      header: 'Fornecedor',
      render: (conta: ContaPagar) => (
        <div>
          <p className="font-medium text-gray-900">{conta.fornecedor_nome}</p>
          <p className="text-sm text-gray-500">{conta.descricao}</p>
        </div>
      ),
    },
    {
      key: 'documento',
      header: 'Documento',
      width: '120px',
      render: (conta: ContaPagar) => (
        <span className="font-mono text-sm">{conta.numero_documento || '-'}</span>
      ),
    },
    {
      key: 'categoria',
      header: 'Categoria',
      width: '120px',
      render: (conta: ContaPagar) => (
        <span className="text-sm">{conta.categoria || '-'}</span>
      ),
    },
    {
      key: 'valor',
      header: 'Valor',
      width: '130px',
      sortable: true,
      render: (conta: ContaPagar) => (
        <div>
          <p className="font-bold">{formatCurrency(conta.valor_aberto)}</p>
          {conta.valor_pago > 0 && (
            <p className="text-xs text-green-600">Pago: {formatCurrency(conta.valor_pago)}</p>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (conta: ContaPagar) => {
        const config = statusConfig[conta.status];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
  ];

  const actions = (conta: ContaPagar) => {
    const items = [];

    if (['aberta', 'vencida', 'parcial'].includes(conta.status)) {
      items.push({
        label: 'Registrar Pagamento',
        icon: <Icons.check className="w-4 h-4" />,
        variant: 'success' as const,
        onClick: () => {
          setContaPagar(conta);
          setPagamentoForm({
            ...pagamentoForm,
            valor: conta.valor_aberto,
          });
          setShowPagamentoModal(true);
        },
      });
    }

    if (conta.status === 'aberta') {
      items.push({
        label: 'Cancelar',
        icon: <Icons.x className="w-4 h-4" />,
        variant: 'danger' as const,
        onClick: () => handleCancelar(conta),
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
          <h1 className="text-2xl font-bold text-gray-900">Contas a Pagar</h1>
          <p className="text-gray-500">Gerencie suas obrigações financeiras</p>
        </div>
        <Button
          leftIcon={<Icons.plus className="w-5 h-5" />}
          onClick={() => setShowNovaContaModal(true)}
        >
          Nova Conta
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icons.document className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.quantidade}</p>
              <p className="text-sm text-gray-500">Contas em Aberto</p>
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
              <p className="text-sm text-gray-500">Total a Pagar</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por fornecedor, documento..."
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
              placeholder="De"
            />
          </div>
          <div className="w-36">
            <Input
              type="date"
              value={periodoFim}
              onChange={(e) => setPeriodoFim(e.target.value)}
              placeholder="Até"
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
          emptyMessage="Nenhuma conta a pagar encontrada"
        />
      </Card>

      {/* Modal de Pagamento */}
      <Modal
        isOpen={showPagamentoModal}
        onClose={() => {
          setShowPagamentoModal(false);
          setContaPagar(null);
        }}
        title="Registrar Pagamento"
        size="md"
      >
        {contaPagar && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-medium">{contaPagar.fornecedor_nome}</p>
              <p className="text-sm text-gray-500">{contaPagar.descricao}</p>
              <p className="text-lg font-bold text-planac-600 mt-2">
                Valor em aberto: {formatCurrency(contaPagar.valor_aberto)}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Valor do Pagamento"
                type="number"
                step="0.01"
                value={pagamentoForm.valor || ''}
                onChange={(e) => setPagamentoForm({ ...pagamentoForm, valor: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Data do Pagamento"
                type="date"
                value={pagamentoForm.data_pagamento || ''}
                onChange={(e) => setPagamentoForm({ ...pagamentoForm, data_pagamento: e.target.value })}
              />
            </div>
            
            <Select
              label="Forma de Pagamento"
              value={pagamentoForm.forma_pagamento || ''}
              onChange={(v) => setPagamentoForm({ ...pagamentoForm, forma_pagamento: v })}
              options={formaPagamentoOptions}
            />
            
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Juros"
                type="number"
                step="0.01"
                value={pagamentoForm.juros || ''}
                onChange={(e) => setPagamentoForm({ ...pagamentoForm, juros: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Multa"
                type="number"
                step="0.01"
                value={pagamentoForm.multa || ''}
                onChange={(e) => setPagamentoForm({ ...pagamentoForm, multa: parseFloat(e.target.value) || 0 })}
              />
              <Input
                label="Desconto"
                type="number"
                step="0.01"
                value={pagamentoForm.desconto || ''}
                onChange={(e) => setPagamentoForm({ ...pagamentoForm, desconto: parseFloat(e.target.value) || 0 })}
              />
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-green-800">
                <strong>Valor Total:</strong>{' '}
                {formatCurrency(
                  (pagamentoForm.valor || 0) + 
                  (pagamentoForm.juros || 0) + 
                  (pagamentoForm.multa || 0) - 
                  (pagamentoForm.desconto || 0)
                )}
              </p>
            </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setShowPagamentoModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handlePagar}>
                Confirmar Pagamento
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Nova Conta */}
      <Modal
        isOpen={showNovaContaModal}
        onClose={() => setShowNovaContaModal(false)}
        title="Nova Conta a Pagar"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Fornecedor"
            placeholder="Buscar fornecedor..."
            value={novaContaForm.fornecedor_id}
            onChange={(e) => setNovaContaForm({ ...novaContaForm, fornecedor_id: e.target.value })}
          />
          
          <Input
            label="Descrição"
            placeholder="Descrição da conta"
            value={novaContaForm.descricao}
            onChange={(e) => setNovaContaForm({ ...novaContaForm, descricao: e.target.value })}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valor"
              type="number"
              step="0.01"
              value={novaContaForm.valor_original || ''}
              onChange={(e) => setNovaContaForm({ ...novaContaForm, valor_original: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Data de Vencimento"
              type="date"
              value={novaContaForm.data_vencimento}
              onChange={(e) => setNovaContaForm({ ...novaContaForm, data_vencimento: e.target.value })}
            />
          </div>
          
          <Input
            label="Categoria"
            placeholder="Ex: Aluguel, Energia, Fornecedores..."
            value={novaContaForm.categoria}
            onChange={(e) => setNovaContaForm({ ...novaContaForm, categoria: e.target.value })}
          />
          
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowNovaContaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCriarConta}>
              Criar Conta
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ContasPagarPage;
