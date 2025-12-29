// =============================================
// PLANAC ERP - Venda Form Page
// Com Entregas Fracionadas e Crédito do Cliente
// =============================================

import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icons';
import { useToast } from '@/components/ui/Toast';
import { Spinner } from '@/components/ui/Spinner';
import api from '@/services/api';

// Types
interface ItemVenda {
  id: string;
  produto_id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  quantidade_entregue: number;
  valor_unitario: number;
  desconto_percentual: number;
  valor_total: number;
  entrega_id?: string; // Qual entrega este item pertence
}

interface Entrega {
  id: string;
  numero: string; // .E1, .E2, .E3
  status: 'pendente' | 'separando' | 'faturado' | 'em_transito' | 'entregue';
  data_prevista: string;
  data_realizada?: string;
  valor: number;
  itens_ids: string[];
  nfe_numero?: string;
  nfe_chave?: string;
  forma_financeiro: 'integral' | 'proporcional' | 'definir_depois';
}

interface CreditoCliente {
  id: string;
  origem: string;
  valor: number;
  data_validade: string;
  selecionado: boolean;
}

interface Cliente {
  id: string;
  codigo: string;
  tipo: 'PF' | 'PJ';
  nome?: string;
  razao_social?: string;
  cpf_cnpj: string;
  telefone?: string;
  cidade?: string;
  uf?: string;
  limite_credito: number;
  saldo_credito: number;
  creditos: CreditoCliente[];
}

interface Parcela {
  numero: string;
  vencimento: string;
  valor: number;
  forma_pagamento: string;
  entrega_id?: string;
}

interface VendaData {
  id?: string;
  numero: string;
  orcamento_id?: string;
  orcamento_numero?: string;
  status: string;
  status_pagamento: string;
  data_emissao: string;
  cliente_id: string;
  cliente?: Cliente;
  vendedor_id: string;
  tabela_preco_id: string;
  condicao_pagamento_id: string;
  parcelamento: string;
  subtotal_produtos: number;
  valor_frete: number;
  valor_desconto: number;
  valor_credito_usado: number;
  valor_total: number;
  observacoes: string;
  itens: ItemVenda[];
  entregas: Entrega[];
  parcelas: Parcela[];
  usar_credito: 'nao' | 'na_venda' | 'nas_entregas';
}

// Options
const formaFinanceiroOptions = [
  { value: 'integral', label: 'Faturamento Integral' },
  { value: 'proporcional', label: 'Proporcional à Entrega' },
  { value: 'definir_depois', label: 'Definir Depois' },
];

const usoCreditoOptions = [
  { value: 'nao', label: 'Não usar crédito' },
  { value: 'na_venda', label: 'Usar no pedido inteiro' },
  { value: 'nas_entregas', label: 'Reservar para entregas' },
];

export function VendaFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditing = Boolean(id);
  const orcamentoId = searchParams.get('orcamento');

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'itens' | 'entregas' | 'financeiro' | 'credito'>('itens');
  
  const [venda, setVenda] = useState<VendaData>({
    numero: '',
    status: 'pendente',
    status_pagamento: 'pendente',
    data_emissao: new Date().toISOString().split('T')[0],
    cliente_id: '',
    vendedor_id: '',
    tabela_preco_id: '',
    condicao_pagamento_id: '',
    parcelamento: '30/60/90',
    subtotal_produtos: 0,
    valor_frete: 0,
    valor_desconto: 0,
    valor_credito_usado: 0,
    valor_total: 0,
    observacoes: '',
    itens: [],
    entregas: [],
    parcelas: [],
    usar_credito: 'nao',
  });

  // Lookup data
  const [vendedores, setVendedores] = useState<{ value: string; label: string }[]>([]);
  const [condicoes, setCondicoes] = useState<{ value: string; label: string }[]>([]);

  // Modals
  const [showNovaEntregaModal, setShowNovaEntregaModal] = useState(false);
  const [showCreditoModal, setShowCreditoModal] = useState(false);
  const [novaEntrega, setNovaEntrega] = useState({
    data_prevista: '',
    forma_financeiro: 'proporcional' as const,
    itens_ids: [] as string[],
  });

  // Load data
  useEffect(() => {
    loadDependencies();
    if (isEditing) {
      loadVenda();
    } else if (orcamentoId) {
      loadFromOrcamento();
    } else {
      generateNumero();
    }
  }, [id, orcamentoId]);

  // Recalculate totals
  useEffect(() => {
    calcularTotais();
  }, [venda.itens, venda.valor_frete, venda.valor_desconto, venda.valor_credito_usado]);

  const loadDependencies = async () => {
    try {
      const [vendRes, condRes] = await Promise.all([
        api.get('/usuarios?perfil=vendedor').catch(() => ({ data: [] })),
        api.get('/condicoes-pagamento').catch(() => ({ data: [] })),
      ]);

      setVendedores(vendRes.data?.map((v: any) => ({ value: v.id, label: v.nome })) || []);
      setCondicoes(condRes.data?.map((c: any) => ({ value: c.id, label: c.nome })) || []);
    } catch (error) {
      console.error('Erro ao carregar dependências:', error);
    }
  };

  const loadVenda = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/vendas/${id}`);
      if (response.success && response.data) {
        setVenda(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar venda');
      navigate('/vendas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFromOrcamento = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/orcamentos/${orcamentoId}`);
      if (response.success && response.data) {
        const orc = response.data;
        
        // Load cliente com créditos
        let cliente = orc.cliente;
        if (orc.cliente_id) {
          const clienteRes = await api.get(`/clientes/${orc.cliente_id}/creditos`);
          if (clienteRes.success) {
            cliente = { ...orc.cliente, creditos: clienteRes.data || [] };
          }
        }

        setVenda(prev => ({
          ...prev,
          orcamento_id: orc.id,
          orcamento_numero: orc.numero,
          cliente_id: orc.cliente_id,
          cliente,
          vendedor_id: orc.vendedor_id,
          tabela_preco_id: orc.tabela_preco_id,
          condicao_pagamento_id: orc.condicao_pagamento_id,
          parcelamento: orc.parcelamento,
          subtotal_produtos: orc.subtotal_produtos,
          valor_frete: orc.valor_frete,
          valor_desconto: orc.valor_desconto,
          valor_total: orc.valor_total,
          observacoes: orc.observacoes,
          itens: orc.itens.map((item: any) => ({
            ...item,
            quantidade_entregue: 0,
          })),
          parcelas: orc.parcelas || [],
        }));

        // Se cliente tem crédito, ir para aba de crédito
        if (cliente?.saldo_credito > 0) {
          setActiveTab('credito');
        }

        await generateNumero();
      }
    } catch (error) {
      toast.error('Erro ao carregar orçamento');
      navigate('/vendas');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNumero = async () => {
    try {
      const response = await api.get('/vendas/proximo-numero');
      if (response.success) {
        setVenda(prev => ({ ...prev, numero: response.data.numero }));
      }
    } catch (error) {
      const num = String(Math.floor(Math.random() * 900000) + 100000);
      setVenda(prev => ({ ...prev, numero: num }));
    }
  };

  const calcularTotais = () => {
    const subtotal = venda.itens.reduce((acc, item) => acc + item.valor_total, 0);
    const total = subtotal + venda.valor_frete - venda.valor_desconto - venda.valor_credito_usado;

    setVenda(prev => ({
      ...prev,
      subtotal_produtos: subtotal,
      valor_total: Math.max(0, total),
    }));
  };

  // Format helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Entregas
  const criarNovaEntrega = () => {
    if (novaEntrega.itens_ids.length === 0) {
      toast.error('Selecione pelo menos um item para a entrega');
      return;
    }
    if (!novaEntrega.data_prevista) {
      toast.error('Informe a data prevista');
      return;
    }

    const numeroEntrega = `.E${venda.entregas.length + 1}`;
    const itensEntrega = venda.itens.filter(i => novaEntrega.itens_ids.includes(i.id));
    const valorEntrega = itensEntrega.reduce((acc, i) => acc + i.valor_total, 0);

    const entrega: Entrega = {
      id: `temp_${Date.now()}`,
      numero: numeroEntrega,
      status: 'pendente',
      data_prevista: novaEntrega.data_prevista,
      valor: valorEntrega,
      itens_ids: novaEntrega.itens_ids,
      forma_financeiro: novaEntrega.forma_financeiro,
    };

    // Atualizar itens com entrega_id
    setVenda(prev => ({
      ...prev,
      entregas: [...prev.entregas, entrega],
      itens: prev.itens.map(item =>
        novaEntrega.itens_ids.includes(item.id)
          ? { ...item, entrega_id: entrega.id }
          : item
      ),
    }));

    setShowNovaEntregaModal(false);
    setNovaEntrega({
      data_prevista: '',
      forma_financeiro: 'proporcional',
      itens_ids: [],
    });

    toast.success(`Entrega ${numeroEntrega} criada`);
  };

  const removerEntrega = (entregaId: string) => {
    setVenda(prev => ({
      ...prev,
      entregas: prev.entregas.filter(e => e.id !== entregaId),
      itens: prev.itens.map(item =>
        item.entrega_id === entregaId
          ? { ...item, entrega_id: undefined }
          : item
      ),
    }));
  };

  // Crédito
  const toggleCreditoSelecionado = (creditoId: string) => {
    if (!venda.cliente?.creditos) return;

    const creditosAtualizados = venda.cliente.creditos.map(c =>
      c.id === creditoId ? { ...c, selecionado: !c.selecionado } : c
    );

    const totalSelecionado = creditosAtualizados
      .filter(c => c.selecionado)
      .reduce((acc, c) => acc + c.valor, 0);

    setVenda(prev => ({
      ...prev,
      cliente: prev.cliente ? { ...prev.cliente, creditos: creditosAtualizados } : undefined,
      valor_credito_usado: totalSelecionado,
    }));
  };

  // Save
  const handleSave = async () => {
    if (!venda.cliente_id) {
      toast.error('Cliente não definido');
      return;
    }
    if (venda.itens.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await api.put(`/vendas/${id}`, venda);
        toast.success('Venda atualizada');
      } else {
        const response = await api.post('/vendas', venda);
        toast.success('Venda criada');
        navigate(`/vendas/${response.data.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const cliente = venda.cliente;
  const itensSemEntrega = venda.itens.filter(i => !i.entrega_id);
  const temEntregasFracionadas = venda.entregas.length > 0;

  const tabs = [
    { id: 'itens', label: 'Itens', icon: <Icons.package className="w-4 h-4" /> },
    { id: 'entregas', label: 'Entregas', icon: <Icons.box className="w-4 h-4" />, badge: venda.entregas.length },
    { id: 'financeiro', label: 'Financeiro', icon: <Icons.dollarSign className="w-4 h-4" /> },
    { id: 'credito', label: 'Crédito', icon: <Icons.creditCard className="w-4 h-4" />, 
      badge: cliente?.saldo_credito ? formatCurrency(cliente.saldo_credito) : undefined,
      badgeVariant: 'success' as const },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/vendas')}>
              <Icons.arrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white">
              <Icons.shoppingCart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-800">
                  Pedido #{venda.numero}
                </h1>
                {venda.orcamento_numero && (
                  <Badge variant="info">
                    Orç: #{venda.orcamento_numero}
                  </Badge>
                )}
                {temEntregasFracionadas && (
                  <Badge variant="warning">
                    {venda.entregas.length} Entregas
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Editando pedido' : orcamentoId ? 'Convertendo orçamento em pedido' : 'Novo pedido de venda'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} isLoading={isSaving}>
              Salvar Pedido
            </Button>
          </div>
        </div>
      </div>

      {/* Cliente Info */}
      {cliente && (
        <Card padding="sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <Icons.user className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {cliente.tipo === 'PJ' ? cliente.razao_social : cliente.nome}
                </p>
                <p className="text-sm text-gray-500">
                  {cliente.cpf_cnpj} • {cliente.cidade}/{cliente.uf}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="text-gray-500">Limite</p>
                <p className="font-medium">{formatCurrency(cliente.limite_credito)}</p>
              </div>
              {cliente.saldo_credito > 0 && (
                <div className="text-center">
                  <p className="text-gray-500">Crédito Disponível</p>
                  <p className="font-bold text-green-600">{formatCurrency(cliente.saldo_credito)}</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <Badge variant={tab.badgeVariant || 'default'} size="sm">
                  {tab.badge}
                </Badge>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Itens */}
      {activeTab === 'itens' && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Itens do Pedido ({venda.itens.length})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-20">Qtde</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-16">Un</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Descrição</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase w-28">Vlr. Unit.</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase w-32">Total</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-24">Entrega</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {venda.itens.map((item) => {
                    const entrega = venda.entregas.find(e => e.id === item.entrega_id);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm font-medium">{item.quantidade}</td>
                        <td className="px-3 py-2 text-sm text-gray-600">{item.unidade}</td>
                        <td className="px-3 py-2">
                          <div className="text-sm font-medium text-gray-800">{item.descricao}</div>
                          <div className="text-xs text-gray-400 font-mono">{item.codigo}</div>
                        </td>
                        <td className="px-3 py-2 text-right text-sm text-gray-700">
                          {formatCurrency(item.valor_unitario)}
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium text-gray-800">
                          {formatCurrency(item.valor_total)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {entrega ? (
                            <Badge variant="info" size="sm">
                              {venda.numero}{entrega.numero}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totais */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-end">
                <div className="w-72 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(venda.subtotal_produtos)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Frete:</span>
                    <span>{formatCurrency(venda.valor_frete)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Desconto:</span>
                    <span className="text-red-600">-{formatCurrency(venda.valor_desconto)}</span>
                  </div>
                  {venda.valor_credito_usado > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Crédito Usado:</span>
                      <span className="text-green-600">-{formatCurrency(venda.valor_credito_usado)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-green-600">{formatCurrency(venda.valor_total)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Entregas */}
      {activeTab === 'entregas' && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Entregas Fracionadas
                </h2>
                <p className="text-sm text-gray-500">
                  Divida o pedido em múltiplas entregas (.E1, .E2, .E3...)
                </p>
              </div>
              {itensSemEntrega.length > 0 && (
                <Button
                  leftIcon={<Icons.plus className="w-4 h-4" />}
                  onClick={() => setShowNovaEntregaModal(true)}
                >
                  Nova Entrega
                </Button>
              )}
            </div>

            {venda.entregas.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-lg">
                <Icons.box className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 mb-4">
                  Nenhuma entrega fracionada configurada.
                  <br />
                  Todos os itens serão entregues de uma vez.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => setShowNovaEntregaModal(true)}
                >
                  Criar Entregas Fracionadas
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {venda.entregas.map((entrega) => {
                  const itensEntrega = venda.itens.filter(i => entrega.itens_ids.includes(i.id));
                  return (
                    <div
                      key={entrega.id}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-lg">
                            {venda.numero}{entrega.numero}
                          </span>
                          <Badge variant={
                            entrega.status === 'entregue' ? 'success' :
                            entrega.status === 'em_transito' ? 'info' :
                            entrega.status === 'faturado' ? 'info' : 'default'
                          }>
                            {entrega.status}
                          </Badge>
                          {entrega.nfe_numero && (
                            <span className="text-xs text-gray-500">
                              NF-e: {entrega.nfe_numero}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Prevista</p>
                            <p className="font-medium">{formatDate(entrega.data_prevista)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Valor</p>
                            <p className="font-bold text-green-600">{formatCurrency(entrega.valor)}</p>
                          </div>
                          {entrega.status === 'pendente' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removerEntrega(entrega.id)}
                            >
                              <Icons.trash className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="p-3">
                        <p className="text-xs text-gray-500 mb-2">
                          {itensEntrega.length} itens • Financeiro: {
                            entrega.forma_financeiro === 'integral' ? 'Integral' :
                            entrega.forma_financeiro === 'proporcional' ? 'Proporcional' : 'A definir'
                          }
                        </p>
                        <div className="space-y-1">
                          {itensEntrega.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                {item.quantidade}x {item.descricao}
                              </span>
                              <span className="font-medium">{formatCurrency(item.valor_total)}</span>
                            </div>
                          ))}
                          {itensEntrega.length > 3 && (
                            <p className="text-xs text-gray-400">
                              +{itensEntrega.length - 3} itens...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Itens sem entrega */}
                {itensSemEntrega.length > 0 && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-2">
                      <strong>{itensSemEntrega.length} itens</strong> ainda não foram alocados em entregas
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowNovaEntregaModal(true)}
                    >
                      Criar Entrega
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab: Financeiro */}
      {activeTab === 'financeiro' && (
        <Card>
          <CardContent>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Parcelamento
            </h2>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <Select
                label="Condição de Pagamento"
                value={venda.condicao_pagamento_id}
                onChange={(v) => setVenda(prev => ({ ...prev, condicao_pagamento_id: v }))}
                options={condicoes}
                placeholder="Selecione..."
              />
              <Select
                label="Parcelamento"
                value={venda.parcelamento}
                onChange={(v) => setVenda(prev => ({ ...prev, parcelamento: v }))}
                options={[
                  { value: '30', label: '30 dias' },
                  { value: '30/60', label: '30/60 dias' },
                  { value: '30/60/90', label: '30/60/90 dias' },
                ]}
              />
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Parcela</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Vencimento</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Valor</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Forma Pagto</th>
                    {temEntregasFracionadas && (
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Entrega</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {venda.parcelas.map((parcela, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm font-medium">{parcela.numero}</td>
                      <td className="px-3 py-2 text-sm">{formatDate(parcela.vencimento)}</td>
                      <td className="px-3 py-2 text-sm text-right font-medium">
                        {formatCurrency(parcela.valor)}
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={parcela.forma_pagamento}
                          onChange={(v) => {
                            setVenda(prev => ({
                              ...prev,
                              parcelas: prev.parcelas.map((p, i) =>
                                i === index ? { ...p, forma_pagamento: v } : p
                              ),
                            }));
                          }}
                          options={[
                            { value: 'boleto', label: 'Boleto' },
                            { value: 'pix', label: 'PIX' },
                            { value: 'cartao', label: 'Cartão' },
                            { value: 'dinheiro', label: 'Dinheiro' },
                          ]}
                          className="w-32"
                        />
                      </td>
                      {temEntregasFracionadas && (
                        <td className="px-3 py-2 text-center">
                          <Select
                            value={parcela.entrega_id || ''}
                            onChange={(v) => {
                              setVenda(prev => ({
                                ...prev,
                                parcelas: prev.parcelas.map((p, i) =>
                                  i === index ? { ...p, entrega_id: v || undefined } : p
                                ),
                              }));
                            }}
                            options={[
                              { value: '', label: 'Geral' },
                              ...venda.entregas.map(e => ({
                                value: e.id,
                                label: `${venda.numero}${e.numero}`,
                              })),
                            ]}
                            className="w-28"
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab: Crédito */}
      {activeTab === 'credito' && (
        <Card>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                  Crédito do Cliente
                </h2>
                <p className="text-sm text-gray-500">
                  O cliente possui créditos de indicações ou devoluções
                </p>
              </div>
              {cliente?.saldo_credito ? (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Saldo Disponível</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(cliente.saldo_credito)}
                  </p>
                </div>
              ) : null}
            </div>

            {!cliente?.creditos?.length ? (
              <div className="p-8 text-center bg-gray-50 rounded-lg">
                <Icons.creditCard className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">
                  Este cliente não possui créditos disponíveis.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <Select
                    label="Como usar o crédito?"
                    value={venda.usar_credito}
                    onChange={(v) => setVenda(prev => ({ ...prev, usar_credito: v as any }))}
                    options={usoCreditoOptions}
                  />
                </div>

                {venda.usar_credito !== 'nao' && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Selecione os créditos a usar:
                    </p>
                    <div className="border rounded-lg divide-y">
                      {cliente.creditos.map((credito) => (
                        <label
                          key={credito.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={credito.selecionado || false}
                              onChange={() => toggleCreditoSelecionado(credito.id)}
                              className="w-4 h-4 text-red-500 border-gray-300 rounded"
                            />
                            <div>
                              <p className="font-medium">{credito.origem}</p>
                              <p className="text-xs text-gray-500">
                                Validade: {formatDate(credito.data_validade)}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-green-600">
                            {formatCurrency(credito.valor)}
                          </span>
                        </label>
                      ))}
                    </div>

                    {venda.valor_credito_usado > 0 && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-green-800">
                            Crédito a utilizar:
                          </span>
                          <span className="text-xl font-bold text-green-600">
                            {formatCurrency(venda.valor_credito_usado)}
                          </span>
                        </div>
                        {venda.valor_credito_usado >= venda.subtotal_produtos + venda.valor_frete - venda.valor_desconto && (
                          <p className="text-sm text-green-700 mt-2">
                            ✓ O crédito cobre 100% do pedido!
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal Nova Entrega */}
      <Modal
        isOpen={showNovaEntregaModal}
        onClose={() => setShowNovaEntregaModal(false)}
        title="Nova Entrega Fracionada"
        size="lg"
      >
        <div className="space-y-4">
          <Input
            type="date"
            label="Data Prevista"
            value={novaEntrega.data_prevista}
            onChange={(e) => setNovaEntrega(prev => ({ ...prev, data_prevista: e.target.value }))}
          />

          <Select
            label="Financeiro"
            value={novaEntrega.forma_financeiro}
            onChange={(v) => setNovaEntrega(prev => ({ ...prev, forma_financeiro: v as any }))}
            options={formaFinanceiroOptions}
          />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Selecione os itens para esta entrega:
            </p>
            <div className="border rounded-lg divide-y max-h-60 overflow-auto">
              {itensSemEntrega.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={novaEntrega.itens_ids.includes(item.id)}
                      onChange={(e) => {
                        setNovaEntrega(prev => ({
                          ...prev,
                          itens_ids: e.target.checked
                            ? [...prev.itens_ids, item.id]
                            : prev.itens_ids.filter(id => id !== item.id),
                        }));
                      }}
                      className="w-4 h-4 text-red-500 border-gray-300 rounded"
                    />
                    <div>
                      <p className="font-medium">{item.descricao}</p>
                      <p className="text-xs text-gray-500">Qtd: {item.quantidade}</p>
                    </div>
                  </div>
                  <span className="font-medium text-green-600">
                    {formatCurrency(item.valor_total)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {novaEntrega.itens_ids.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Entrega {venda.numero}.E{venda.entregas.length + 1}:</strong>{' '}
                {novaEntrega.itens_ids.length} itens •{' '}
                {formatCurrency(
                  itensSemEntrega
                    .filter(i => novaEntrega.itens_ids.includes(i.id))
                    .reduce((acc, i) => acc + i.valor_total, 0)
                )}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowNovaEntregaModal(false)}>
              Cancelar
            </Button>
            <Button onClick={criarNovaEntrega}>
              Criar Entrega
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default VendaFormPage;
