// =============================================
// PLANAC ERP - Orçamento Form Page
// Baseado no orcamentos-formulario-planac.jsx
// =============================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
interface Cliente {
  id: string;
  codigo: string;
  tipo: 'PF' | 'PJ';
  nome?: string;
  razao_social?: string;
  nome_fantasia?: string;
  cpf_cnpj: string;
  ie_rg?: string;
  telefone?: string;
  celular?: string;
  email?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  limite_credito: number;
  saldo_credito: number;
}

interface ItemOrcamento {
  id: string;
  produto_id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  valor_unitario: number;
  desconto_percentual: number;
  valor_total: number;
  selecionado?: boolean; // Para desmembrar
}

interface Parcela {
  numero: string;
  vencimento: string;
  valor: number;
  forma_pagamento: string;
}

interface OrcamentoData {
  id?: string;
  numero: string;
  status: string;
  data_emissao: string;
  data_validade: string;
  previsao_entrega: string;
  cliente_id: string;
  cliente?: Cliente;
  vendedor_id: string;
  tabela_preco_id: string;
  condicao_pagamento_id: string;
  parcelamento: string;
  subtotal_produtos: number;
  valor_frete: number;
  valor_acrescimo: number;
  valor_desconto: number;
  valor_total: number;
  observacoes: string;
  itens: ItemOrcamento[];
  parcelas: Parcela[];
  mesclado_de?: string[];
}

// Options
const parcelamentoOptions = [
  { value: '30', label: '30 dias' },
  { value: '30/60', label: '30/60 dias' },
  { value: '30/60/90', label: '30/60/90 dias' },
  { value: '28/56/84', label: '28/56/84 dias' },
  { value: '7/14/21/28', label: '7/14/21/28 dias' },
  { value: '14/28/42', label: '14/28/42 dias' },
];

const formasPagamentoOptions = [
  { value: 'boleto', label: 'Boleto' },
  { value: 'pix', label: 'PIX' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao_credito', label: 'Cartão Crédito' },
  { value: 'cartao_debito', label: 'Cartão Débito' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'credito_cliente', label: 'Crédito Cliente' },
];

export function OrcamentoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditing = Boolean(id);
  const buscaProdutoRef = useRef<HTMLInputElement>(null);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [orcamento, setOrcamento] = useState<OrcamentoData>({
    numero: '',
    status: 'rascunho',
    data_emissao: new Date().toISOString().split('T')[0],
    data_validade: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    previsao_entrega: '',
    cliente_id: '',
    vendedor_id: '',
    tabela_preco_id: '',
    condicao_pagamento_id: '',
    parcelamento: '30/60/90',
    subtotal_produtos: 0,
    valor_frete: 0,
    valor_acrescimo: 0,
    valor_desconto: 0,
    valor_total: 0,
    observacoes: '',
    itens: [],
    parcelas: [],
  });

  // Lookup data
  const [vendedores, setVendedores] = useState<{ value: string; label: string }[]>([]);
  const [tabelas, setTabelas] = useState<{ value: string; label: string }[]>([]);
  const [condicoes, setCondicoes] = useState<{ value: string; label: string }[]>([]);

  // Search states
  const [buscaCliente, setBuscaCliente] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [clientesResultado, setClientesResultado] = useState<Cliente[]>([]);
  const [produtosResultado, setProdutosResultado] = useState<any[]>([]);
  const [showClienteSearch, setShowClienteSearch] = useState(false);
  const [showProdutoSearch, setShowProdutoSearch] = useState(false);

  // Modals
  const [showDesmembrarModal, setShowDesmembrarModal] = useState(false);
  const [showMescladosModal, setShowMescladosModal] = useState(false);

  // Load data
  useEffect(() => {
    loadDependencies();
    if (isEditing) {
      loadOrcamento();
    } else {
      generateNumero();
    }
  }, [id]);

  // Recalculate totals when items change
  useEffect(() => {
    calcularTotais();
  }, [orcamento.itens, orcamento.valor_frete, orcamento.valor_acrescimo, orcamento.valor_desconto]);

  // Recalculate parcelas when total or parcelamento changes
  useEffect(() => {
    calcularParcelas();
  }, [orcamento.valor_total, orcamento.parcelamento, orcamento.condicao_pagamento_id]);

  const loadDependencies = async () => {
    try {
      const [vendRes, tabRes, condRes] = await Promise.all([
        api.get('/usuarios?perfil=vendedor').catch(() => ({ data: [] })),
        api.get('/tabelas-preco').catch(() => ({ data: [] })),
        api.get('/condicoes-pagamento').catch(() => ({ data: [] })),
      ]);

      setVendedores(vendRes.data?.map((v: any) => ({ value: v.id, label: v.nome })) || []);
      setTabelas(tabRes.data?.map((t: any) => ({ value: t.id, label: t.nome })) || []);
      setCondicoes(condRes.data?.map((c: any) => ({ value: c.id, label: c.nome })) || []);
    } catch (error) {
      console.error('Erro ao carregar dependências:', error);
    }
  };

  const loadOrcamento = async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/orcamentos/${id}`);
      if (response.success && response.data) {
        setOrcamento(response.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar orçamento');
      navigate('/orcamentos');
    } finally {
      setIsLoading(false);
    }
  };

  const generateNumero = async () => {
    try {
      const response = await api.get('/orcamentos/proximo-numero');
      if (response.success) {
        setOrcamento(prev => ({ ...prev, numero: response.data.numero }));
      }
    } catch (error) {
      // Generate local number as fallback
      const num = String(Math.floor(Math.random() * 900000) + 100000);
      setOrcamento(prev => ({ ...prev, numero: num }));
    }
  };

  const calcularTotais = () => {
    const subtotal = orcamento.itens.reduce((acc, item) => acc + item.valor_total, 0);
    const total = subtotal + orcamento.valor_frete + orcamento.valor_acrescimo - orcamento.valor_desconto;

    setOrcamento(prev => ({
      ...prev,
      subtotal_produtos: subtotal,
      valor_total: total,
    }));
  };

  const calcularParcelas = () => {
    const total = orcamento.valor_total;
    if (total <= 0) {
      setOrcamento(prev => ({ ...prev, parcelas: [] }));
      return;
    }

    const condicao = condicoes.find(c => c.value === orcamento.condicao_pagamento_id);
    const isAVista = condicao?.label?.toLowerCase().includes('vista');

    if (isAVista) {
      const hoje = new Date();
      setOrcamento(prev => ({
        ...prev,
        parcelas: [{
          numero: '1/1',
          vencimento: hoje.toISOString().split('T')[0],
          valor: total,
          forma_pagamento: 'pix',
        }],
      }));
      return;
    }

    const dias = orcamento.parcelamento.split('/').map(d => parseInt(d));
    const numParcelas = dias.length;
    const valorParcela = Math.floor((total / numParcelas) * 100) / 100;
    const resto = Math.round((total - valorParcela * numParcelas) * 100) / 100;

    const parcelas = dias.map((d, i) => {
      const venc = new Date();
      venc.setDate(venc.getDate() + d);
      return {
        numero: `${i + 1}/${numParcelas}`,
        vencimento: venc.toISOString().split('T')[0],
        valor: i === numParcelas - 1 ? valorParcela + resto : valorParcela,
        forma_pagamento: 'boleto',
      };
    });

    setOrcamento(prev => ({ ...prev, parcelas }));
  };

  // Format helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Search handlers
  const buscarClientes = async (termo: string) => {
    if (termo.length < 2) {
      setClientesResultado([]);
      return;
    }
    try {
      const response = await api.get(`/clientes?search=${termo}`);
      setClientesResultado(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    }
  };

  const buscarProdutos = async (termo: string) => {
    if (termo.length < 2) {
      setProdutosResultado([]);
      return;
    }
    try {
      const response = await api.get(`/produtos?search=${termo}`);
      setProdutosResultado(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
    }
  };

  const selecionarCliente = (cliente: Cliente) => {
    setOrcamento(prev => ({
      ...prev,
      cliente_id: cliente.id,
      cliente,
    }));
    setShowClienteSearch(false);
    setBuscaCliente('');
    setClientesResultado([]);
  };

  const adicionarProduto = (produto: any) => {
    const novoItem: ItemOrcamento = {
      id: `temp_${Date.now()}`,
      produto_id: produto.id,
      codigo: produto.codigo,
      descricao: produto.descricao,
      unidade: produto.unidade,
      quantidade: 1,
      valor_unitario: produto.preco_venda,
      desconto_percentual: 0,
      valor_total: produto.preco_venda,
    };

    setOrcamento(prev => ({
      ...prev,
      itens: [...prev.itens, novoItem],
    }));

    setShowProdutoSearch(false);
    setBuscaProduto('');
    setProdutosResultado([]);
  };

  // Item handlers
  const atualizarItem = (itemId: string, campo: string, valor: any) => {
    setOrcamento(prev => ({
      ...prev,
      itens: prev.itens.map(item => {
        if (item.id !== itemId) return item;

        const updated = { ...item, [campo]: valor };

        // Recalculate total
        const subtotal = updated.quantidade * updated.valor_unitario;
        updated.valor_total = subtotal - (subtotal * updated.desconto_percentual / 100);

        return updated;
      }),
    }));
  };

  const removerItem = (itemId: string) => {
    setOrcamento(prev => ({
      ...prev,
      itens: prev.itens.filter(item => item.id !== itemId),
    }));
  };

  const toggleItemSelecionado = (itemId: string) => {
    setOrcamento(prev => ({
      ...prev,
      itens: prev.itens.map(item =>
        item.id === itemId ? { ...item, selecionado: !item.selecionado } : item
      ),
    }));
  };

  // Desmembrar
  const handleDesmembrar = async () => {
    const itensSelecionados = orcamento.itens.filter(i => i.selecionado);
    if (itensSelecionados.length === 0) {
      toast.error('Selecione pelo menos um item para desmembrar');
      return;
    }

    try {
      const response = await api.post(`/orcamentos/${id}/desmembrar`, {
        itens_ids: itensSelecionados.map(i => i.id),
      });

      toast.success(`Novo orçamento criado: #${response.data.numero}`);
      setShowDesmembrarModal(false);
      loadOrcamento();
    } catch (error) {
      toast.error('Erro ao desmembrar orçamento');
    }
  };

  // Save
  const handleSave = async () => {
    if (!orcamento.cliente_id) {
      toast.error('Selecione um cliente');
      return;
    }
    if (orcamento.itens.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }

    setIsSaving(true);
    try {
      if (isEditing) {
        await api.put(`/orcamentos/${id}`, orcamento);
        toast.success('Orçamento atualizado');
      } else {
        const response = await api.post('/orcamentos', orcamento);
        toast.success('Orçamento criado');
        navigate(`/orcamentos/${response.data.id}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  // Actions
  const handlePrint = () => {
    window.open(`/api/orcamentos/${id}/pdf`, '_blank');
  };

  const handleSendEmail = async () => {
    try {
      await api.post(`/orcamentos/${id}/enviar-email`);
      toast.success('E-mail enviado');
    } catch (error) {
      toast.error('Erro ao enviar e-mail');
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      await api.post(`/orcamentos/${id}/enviar-whatsapp`);
      toast.success('WhatsApp enviado');
    } catch (error) {
      toast.error('Erro ao enviar WhatsApp');
    }
  };

  const handleConvertToSale = async () => {
    try {
      const response = await api.post(`/orcamentos/${id}/converter`);
      toast.success('Pedido gerado com sucesso!');
      navigate(`/vendas/${response.data.id}`);
    } catch (error) {
      toast.error('Erro ao converter em pedido');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const cliente = orcamento.cliente;
  const itensSelecionados = orcamento.itens.filter(i => i.selecionado).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/orcamentos')}>
              <Icons.arrowLeft className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white">
              <Icons.fileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-800">
                  Orçamento #{orcamento.numero}
                </h1>
                {orcamento.mesclado_de && orcamento.mesclado_de.length > 0 && (
                  <Badge 
                    variant="info" 
                    className="cursor-pointer"
                    onClick={() => setShowMescladosModal(true)}
                  >
                    Mesclado de {orcamento.mesclado_de.length}
                  </Badge>
                )}
                <Badge variant={orcamento.status === 'aprovado' ? 'success' : 'default'}>
                  {orcamento.status.charAt(0).toUpperCase() + orcamento.status.slice(1)}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {isEditing ? 'Editando proposta comercial' : 'Nova proposta comercial'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && (
              <>
                <Button variant="secondary" size="sm" onClick={handlePrint}>
                  <Icons.printer className="w-4 h-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={handleSendEmail}>
                  <Icons.mail className="w-4 h-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={handleSendWhatsApp}>
                  <Icons.messageCircle className="w-4 h-4" />
                </Button>
                {itensSelecionados > 0 && (
                  <Button variant="secondary" size="sm" onClick={() => setShowDesmembrarModal(true)}>
                    <Icons.split className="w-4 h-4 mr-1" />
                    Desmembrar ({itensSelecionados})
                  </Button>
                )}
                {orcamento.status === 'aprovado' && (
                  <Button variant="success" size="sm" onClick={handleConvertToSale}>
                    <Icons.shoppingCart className="w-4 h-4 mr-1" />
                    Gerar Pedido
                  </Button>
                )}
              </>
            )}
            <Button onClick={handleSave} isLoading={isSaving}>
              Salvar
            </Button>
          </div>
        </div>
      </div>

      {/* Dados do Orçamento + Cliente */}
      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Dados do Orçamento
          </h2>

          {/* Linha 1: Datas */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Número</label>
              <input
                type="text"
                value={orcamento.numero}
                readOnly
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Emissão</label>
              <input
                type="date"
                value={orcamento.data_emissao}
                onChange={(e) => setOrcamento(prev => ({ ...prev, data_emissao: e.target.value }))}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Validade</label>
              <input
                type="date"
                value={orcamento.data_validade}
                onChange={(e) => setOrcamento(prev => ({ ...prev, data_validade: e.target.value }))}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prev. Entrega</label>
              <input
                type="date"
                value={orcamento.previsao_entrega}
                onChange={(e) => setOrcamento(prev => ({ ...prev, previsao_entrega: e.target.value }))}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Linha 2: Comercial */}
          <div className="grid grid-cols-4 gap-3">
            <Select
              label="Vendedor"
              value={orcamento.vendedor_id}
              onChange={(v) => setOrcamento(prev => ({ ...prev, vendedor_id: v }))}
              options={vendedores}
              placeholder="Selecione..."
            />
            <Select
              label="Tabela Preço"
              value={orcamento.tabela_preco_id}
              onChange={(v) => setOrcamento(prev => ({ ...prev, tabela_preco_id: v }))}
              options={tabelas}
              placeholder="Selecione..."
            />
            <Select
              label="Cond. Pagamento"
              value={orcamento.condicao_pagamento_id}
              onChange={(v) => setOrcamento(prev => ({ ...prev, condicao_pagamento_id: v }))}
              options={condicoes}
              placeholder="Selecione..."
            />
            <Select
              label="Parcelamento"
              value={orcamento.parcelamento}
              onChange={(v) => setOrcamento(prev => ({ ...prev, parcelamento: v }))}
              options={parcelamentoOptions}
              placeholder="Selecione..."
            />
          </div>

          {/* Divisória */}
          <div className="border-t border-gray-100 my-4" />

          {/* Cliente */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cliente</h2>
            <div className="relative">
              <Input
                placeholder="Buscar cliente..."
                value={buscaCliente}
                onChange={(e) => {
                  setBuscaCliente(e.target.value);
                  buscarClientes(e.target.value);
                  setShowClienteSearch(true);
                }}
                onFocus={() => setShowClienteSearch(true)}
                leftIcon={<Icons.search className="w-4 h-4" />}
                className="w-64"
              />
              {showClienteSearch && clientesResultado.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
                  {clientesResultado.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selecionarCliente(c)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <p className="font-medium text-gray-900">
                        {c.tipo === 'PJ' ? c.razao_social : c.nome}
                      </p>
                      <p className="text-sm text-gray-500">{c.cpf_cnpj}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {cliente ? (
            <>
              <div className="grid grid-cols-5 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Código</label>
                  <input type="text" value={cliente.codigo} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Razão Social / Nome</label>
                  <input type="text" value={cliente.tipo === 'PJ' ? cliente.razao_social : cliente.nome} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">CNPJ/CPF</label>
                  <input type="text" value={cliente.cpf_cnpj} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">IE/RG</label>
                  <input type="text" value={cliente.ie_rg || ''} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Telefone</label>
                  <input type="text" value={cliente.telefone || ''} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Celular</label>
                  <input type="text" value={cliente.celular || ''} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Endereço</label>
                  <input type="text" value={`${cliente.logradouro || ''}, ${cliente.numero || ''}`} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cidade/UF</label>
                  <input type="text" value={`${cliente.cidade || ''} - ${cliente.uf || ''}`} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                </div>
              </div>

              {/* Crédito do cliente */}
              {cliente.saldo_credito > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icons.dollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">
                      Cliente possui crédito disponível
                    </span>
                  </div>
                  <span className="text-green-700 font-bold">
                    {formatCurrency(cliente.saldo_credito)}
                  </span>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg">
              <Icons.user className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Busque e selecione um cliente</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Itens */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Itens do Orçamento
            </h2>
            <div className="relative">
              <Input
                ref={buscaProdutoRef}
                placeholder="Ex: 10 parafuso, 5 painel..."
                value={buscaProduto}
                onChange={(e) => {
                  setBuscaProduto(e.target.value);
                  buscarProdutos(e.target.value);
                  setShowProdutoSearch(true);
                }}
                onFocus={() => setShowProdutoSearch(true)}
                leftIcon={<Icons.search className="w-4 h-4" />}
                className="w-72"
              />
              {showProdutoSearch && produtosResultado.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-60 overflow-auto">
                  {produtosResultado.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => adicionarProduto(p)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{p.descricao}</p>
                          <p className="text-xs text-gray-500 font-mono">{p.codigo}</p>
                        </div>
                        <span className="text-green-600 font-medium">
                          {formatCurrency(p.preco_venda)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabela de Itens */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {isEditing && (
                    <th className="px-3 py-2 text-center w-10">
                      <input
                        type="checkbox"
                        checked={orcamento.itens.length > 0 && orcamento.itens.every(i => i.selecionado)}
                        onChange={(e) => {
                          setOrcamento(prev => ({
                            ...prev,
                            itens: prev.itens.map(i => ({ ...i, selecionado: e.target.checked })),
                          }));
                        }}
                        className="w-4 h-4 text-red-500 border-gray-300 rounded"
                      />
                    </th>
                  )}
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-20">Qtde</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-16">Un</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Descrição</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase w-28">Vlr. Unit.</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-20">Desc. %</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase w-32">Total</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-16">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orcamento.itens.length === 0 ? (
                  <tr>
                    <td colSpan={isEditing ? 8 : 7} className="px-3 py-8 text-center text-gray-500">
                      Nenhum item adicionado. Use a busca acima para adicionar produtos.
                    </td>
                  </tr>
                ) : (
                  orcamento.itens.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      {isEditing && (
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={item.selecionado || false}
                            onChange={() => toggleItemSelecionado(item.id)}
                            className="w-4 h-4 text-red-500 border-gray-300 rounded"
                          />
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          value={item.quantidade}
                          onChange={(e) => atualizarItem(item.id, 'quantidade', parseInt(e.target.value) || 0)}
                          className="w-20 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                          min="1"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-600">{item.unidade}</td>
                      <td className="px-3 py-2">
                        <div className="text-sm font-medium text-gray-800">{item.descricao}</div>
                        <div className="text-xs text-gray-400 font-mono">{item.codigo}</div>
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-gray-700">
                        {formatCurrency(item.valor_unitario)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          value={item.desconto_percentual}
                          onChange={(e) => atualizarItem(item.id, 'desconto_percentual', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                          min="0"
                          max="100"
                          step="0.1"
                        />
                      </td>
                      <td className="px-3 py-2 text-right text-sm font-medium text-gray-800">
                        {formatCurrency(item.valor_total)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => removerItem(item.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Icons.trash className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Totais */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal Produtos:</span>
                  <span className="font-medium text-gray-800">{formatCurrency(orcamento.subtotal_produtos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete:</span>
                  <input
                    type="number"
                    value={orcamento.valor_frete}
                    onChange={(e) => setOrcamento(prev => ({ ...prev, valor_frete: parseFloat(e.target.value) || 0 }))}
                    className="w-24 px-2 py-1 text-right border border-gray-200 rounded text-sm"
                    step="0.01"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Acréscimo:</span>
                  <input
                    type="number"
                    value={orcamento.valor_acrescimo}
                    onChange={(e) => setOrcamento(prev => ({ ...prev, valor_acrescimo: parseFloat(e.target.value) || 0 }))}
                    className="w-24 px-2 py-1 text-right border border-gray-200 rounded text-sm"
                    step="0.01"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Desconto:</span>
                  <input
                    type="number"
                    value={orcamento.valor_desconto}
                    onChange={(e) => setOrcamento(prev => ({ ...prev, valor_desconto: parseFloat(e.target.value) || 0 }))}
                    className="w-24 px-2 py-1 text-right border border-gray-200 rounded text-sm"
                    step="0.01"
                  />
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-800">Total:</span>
                  <span className="font-bold text-red-600">{formatCurrency(orcamento.valor_total)}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observações + Parcelamento */}
      <div className="grid grid-cols-2 gap-4">
        {/* Observações */}
        <Card>
          <CardContent>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Observações
            </h2>
            <textarea
              value={orcamento.observacoes}
              onChange={(e) => setOrcamento(prev => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Observações do orçamento..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
            />
          </CardContent>
        </Card>

        {/* Simulação de Parcelamento */}
        <Card>
          <CardContent>
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
              Simulação de Parcelamento
            </h2>

            <div className="flex items-center justify-between mb-3 text-sm">
              <span className="text-gray-600">
                {condicoes.find(c => c.value === orcamento.condicao_pagamento_id)?.label || 'A Prazo'} | {orcamento.parcelamento}
              </span>
              <span className="font-semibold text-gray-800">{formatCurrency(orcamento.valor_total)}</span>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Parc.</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Vencimento</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Valor</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Forma</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orcamento.parcelas.map((parcela, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-700">{parcela.numero}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">{formatDate(parcela.vencimento)}</td>
                      <td className="px-3 py-2 text-sm text-gray-800 text-right font-medium">
                        {formatCurrency(parcela.valor)}
                      </td>
                      <td className="px-3 py-2">
                        <Select
                          value={parcela.forma_pagamento}
                          onChange={(v) => {
                            setOrcamento(prev => ({
                              ...prev,
                              parcelas: prev.parcelas.map((p, i) =>
                                i === index ? { ...p, forma_pagamento: v } : p
                              ),
                            }));
                          }}
                          options={formasPagamentoOptions}
                          className="w-full"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Desmembrar */}
      <Modal
        isOpen={showDesmembrarModal}
        onClose={() => setShowDesmembrarModal(false)}
        title="Desmembrar Orçamento"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Você está prestes a desmembrar {itensSelecionados} item(s) para um novo orçamento.
          </p>

          <div className="border rounded-lg divide-y max-h-60 overflow-auto">
            {orcamento.itens.filter(i => i.selecionado).map((item) => (
              <div key={item.id} className="p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.descricao}</p>
                  <p className="text-sm text-gray-500">Qtd: {item.quantidade}</p>
                </div>
                <span className="text-green-600 font-medium">
                  {formatCurrency(item.valor_total)}
                </span>
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Resultado:</strong> Os itens selecionados serão removidos deste orçamento
              e um novo orçamento #{orcamento.numero}.1 será criado com eles.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDesmembrarModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDesmembrar}>
              Confirmar Desmembramento
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Orçamentos Mesclados */}
      <Modal
        isOpen={showMescladosModal}
        onClose={() => setShowMescladosModal(false)}
        title="Orçamentos Mesclados"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Este orçamento foi criado a partir da mesclagem dos seguintes orçamentos:
          </p>

          <div className="border rounded-lg divide-y">
            {orcamento.mesclado_de?.map((num) => (
              <div key={num} className="p-3 flex items-center gap-3">
                <Icons.fileText className="w-5 h-5 text-gray-400" />
                <span className="font-mono font-medium">#{num}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowMescladosModal(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default OrcamentoFormPage;
