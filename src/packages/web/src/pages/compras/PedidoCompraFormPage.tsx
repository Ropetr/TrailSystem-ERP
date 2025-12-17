import React, { useState, useRef, useEffect } from 'react';

// ===========================================
// ESTILOS GLOBAIS
// ===========================================
const globalStyles = `
  input:focus, textarea:focus, select:focus {
    outline: none !important;
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
  }
`;

// ===========================================
// ÍCONES SVG
// ===========================================
const Icons = {
  back: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  save: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  plus: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  shoppingCart: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  mail: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  printer: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
  truck: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
  copy: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  clipboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
};

// ===========================================
// COMPONENTE: SELECT DROPDOWN
// ===========================================
function SelectDropdown({ value, onChange, options = [], placeholder = 'Selecione...', disabled = false, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between transition-colors ${
          disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:border-gray-300 cursor-pointer'
        } ${isOpen ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
      >
        <span className={selectedOption ? 'text-gray-800' : 'text-gray-400'}>
          {selectedOption?.label || placeholder}
        </span>
        {isOpen ? Icons.chevronUp : Icons.chevronDown}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 max-h-60 overflow-auto">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-sm text-left flex items-center justify-between transition-colors ${
                option.value === value
                  ? 'bg-red-50 text-red-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{option.label}</span>
              {option.value === value && Icons.check}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ===========================================
// COMPONENTE: DROPDOWN MENU
// ===========================================
function DropdownMenu({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getItemClasses = (variant) => {
    const base = 'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors';
    switch (variant) {
      case 'success': return `${base} text-green-600 hover:bg-green-50`;
      case 'danger': return `${base} text-red-600 hover:bg-red-50`;
      default: return `${base} text-gray-700 hover:bg-gray-50`;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
      >
        {Icons.dots}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-48 z-50">
          {items.map((item, index) => {
            if (item.type === 'separator') {
              return <div key={index} className="border-t border-gray-100 my-2" />;
            }
            return (
              <button
                key={index}
                onClick={() => {
                  item.onClick?.();
                  setIsOpen(false);
                }}
                className={getItemClasses(item.variant)}
              >
                {item.icon && <span className="w-5 h-5">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===========================================
// OPTIONS
// ===========================================
const statusOptions = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'PENDENTE', label: 'Pendente Aprovação' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'ENVIADO', label: 'Enviado ao Fornecedor' },
  { value: 'PARCIAL', label: 'Recebido Parcialmente' },
  { value: 'RECEBIDO', label: 'Recebido' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

const prioridadeOptions = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

const condicoesPagtoOptions = [
  { value: 'A_VISTA', label: 'À Vista' },
  { value: '30_DIAS', label: '30 dias' },
  { value: '30_60', label: '30/60 dias' },
  { value: '30_60_90', label: '30/60/90 dias' },
  { value: '28_56_84', label: '28/56/84 dias' },
];

const freteOptions = [
  { value: 'CIF', label: 'CIF (Frete por conta do Fornecedor)' },
  { value: 'FOB', label: 'FOB (Frete por conta do Comprador)' },
];

const compradorOptions = [
  { value: 'JOAO', label: 'João Silva' },
  { value: 'MARIA', label: 'Maria Santos' },
  { value: 'CARLOS', label: 'Carlos Oliveira' },
];

// ===========================================
// DADOS MOCK
// ===========================================
const itensMock = [
  { id: 1, codigo: '7890000010696', descricao: 'PLACA DE GESSO STANDARD 1200x1800x12.5MM', unidade: 'UN', quantidade: 500, valorUnit: 28.50, desconto: 0 },
  { id: 2, codigo: '7890000016209', descricao: 'PERFIL MONTANTE 48x30x3000MM', unidade: 'UN', quantidade: 200, valorUnit: 15.90, desconto: 5 },
  { id: 3, codigo: '7892261535758', descricao: 'PARAFUSO DRYWALL PH 3,5x25MM (CX 1000)', unidade: 'CX', quantidade: 50, valorUnit: 42.00, desconto: 0 },
];

// ===========================================
// COMPONENTE PRINCIPAL
// ===========================================
export default function PedidoCompraFormPage() {
  const [pedido, setPedido] = useState({
    numero: '',
    cotacaoOrigem: '',
    dataEmissao: new Date().toISOString().split('T')[0],
    dataEntrega: '',
    status: 'RASCUNHO',
    prioridade: 'NORMAL',
    comprador: 'JOAO',
    fornecedor: '',
    fornecedorNome: '',
    fornecedorCnpj: '',
    condicaoPagto: '30_DIAS',
    frete: 'CIF',
    valorFrete: 0,
    observacoes: '',
    observacoesInternas: '',
  });

  const [itens, setItens] = useState(itensMock);
  const [buscaFornecedor, setBuscaFornecedor] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const calcularTotalItem = (item) => {
    const subtotal = item.quantidade * item.valorUnit;
    return subtotal - (subtotal * item.desconto / 100);
  };

  const subtotalProdutos = itens.reduce((acc, item) => acc + calcularTotalItem(item), 0);
  const totalPedido = subtotalProdutos + pedido.valorFrete;

  const removerItem = (id) => {
    setItens(itens.filter(item => item.id !== id));
  };

  const atualizarItem = (id, campo, valor) => {
    setItens(itens.map(item => 
      item.id === id ? { ...item, [campo]: valor } : item
    ));
  };

  const menuItems = [
    { icon: Icons.save, label: 'Salvar', variant: 'success' },
    { icon: Icons.check, label: 'Aprovar Pedido', variant: 'success' },
    { type: 'separator' },
    { icon: Icons.mail, label: 'Enviar ao Fornecedor' },
    { icon: Icons.printer, label: 'Imprimir' },
    { icon: Icons.copy, label: 'Duplicar' },
    { type: 'separator' },
    { icon: Icons.truck, label: 'Registrar Recebimento' },
    { type: 'separator' },
    { icon: Icons.trash, label: 'Cancelar Pedido', variant: 'danger' },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      RASCUNHO: 'bg-gray-100 text-gray-700',
      PENDENTE: 'bg-yellow-100 text-yellow-700',
      APROVADO: 'bg-blue-100 text-blue-700',
      ENVIADO: 'bg-purple-100 text-purple-700',
      PARCIAL: 'bg-orange-100 text-orange-700',
      RECEBIDO: 'bg-green-100 text-green-700',
      CANCELADO: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.RASCUNHO;
  };

  const getPrioridadeBadge = (prioridade) => {
    const styles = {
      BAIXA: 'bg-gray-100 text-gray-600',
      NORMAL: 'bg-blue-100 text-blue-600',
      ALTA: 'bg-orange-100 text-orange-600',
      URGENTE: 'bg-red-100 text-red-600',
    };
    return styles[prioridade] || styles.NORMAL;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{globalStyles}</style>
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">
                {Icons.back}
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white">
                {Icons.shoppingCart}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {pedido.numero ? `Pedido de Compra #${pedido.numero}` : 'Novo Pedido de Compra'}
                </h1>
                <p className="text-sm text-gray-500">
                  {pedido.cotacaoOrigem ? `Origem: Cotação #${pedido.cotacaoOrigem}` : 'Novo pedido'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPrioridadeBadge(pedido.prioridade)}`}>
                {prioridadeOptions.find(p => p.value === pedido.prioridade)?.label}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(pedido.status)}`}>
                {statusOptions.find(s => s.value === pedido.status)?.label}
              </span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                {Icons.save}
                <span>Salvar</span>
              </button>
              <DropdownMenu items={menuItems} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Dados do Pedido */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados do Pedido</h2>
          
          <div className="grid grid-cols-5 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Número</label>
              <input 
                type="text" 
                value={pedido.numero}
                readOnly
                placeholder="Automático"
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data Emissão</label>
              <input 
                type="date" 
                value={pedido.dataEmissao}
                onChange={(e) => setPedido({...pedido, dataEmissao: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Previsão Entrega</label>
              <input 
                type="date" 
                value={pedido.dataEntrega}
                onChange={(e) => setPedido({...pedido, dataEntrega: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Comprador</label>
              <SelectDropdown
                value={pedido.comprador}
                onChange={(val) => setPedido({...pedido, comprador: val})}
                options={compradorOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prioridade</label>
              <SelectDropdown
                value={pedido.prioridade}
                onChange={(val) => setPedido({...pedido, prioridade: val})}
                options={prioridadeOptions}
              />
            </div>
          </div>

          {/* Fornecedor */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Fornecedor</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Fornecedor *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={buscaFornecedor}
                    onChange={(e) => setBuscaFornecedor(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm pr-10"
                    placeholder="Buscar fornecedor por nome ou CNPJ..."
                  />
                  <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">
                    {Icons.search}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Cotação Origem</label>
                <input 
                  type="text" 
                  value={pedido.cotacaoOrigem}
                  onChange={(e) => setPedido({...pedido, cotacaoOrigem: e.target.value})}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                  placeholder="Nº da cotação (se houver)"
                />
              </div>
            </div>

            {/* Dados do fornecedor selecionado */}
            {pedido.fornecedorNome && (
              <div className="bg-blue-50 rounded-lg p-3 mt-3 grid grid-cols-3 gap-3">
                <div>
                  <span className="text-xs text-blue-600">Razão Social</span>
                  <p className="text-sm font-medium text-gray-800">{pedido.fornecedorNome}</p>
                </div>
                <div>
                  <span className="text-xs text-blue-600">CNPJ</span>
                  <p className="text-sm font-mono text-gray-800">{pedido.fornecedorCnpj}</p>
                </div>
                <div>
                  <span className="text-xs text-blue-600">Condição Padrão</span>
                  <p className="text-sm text-gray-800">30/60/90 dias</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Condições */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Condições Comerciais</h2>
          
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Condição de Pagamento</label>
              <SelectDropdown
                value={pedido.condicaoPagto}
                onChange={(val) => setPedido({...pedido, condicaoPagto: val})}
                options={condicoesPagtoOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo de Frete</label>
              <SelectDropdown
                value={pedido.frete}
                onChange={(val) => setPedido({...pedido, frete: val})}
                options={freteOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Valor do Frete</label>
              <input 
                type="text" 
                value={formatMoney(pedido.valorFrete)}
                onChange={(e) => {
                  const nums = e.target.value.replace(/\D/g, '');
                  setPedido({...pedido, valorFrete: parseFloat(nums) / 100 || 0});
                }}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right"
                disabled={pedido.frete === 'CIF'}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <SelectDropdown
                value={pedido.status}
                onChange={(val) => setPedido({...pedido, status: val})}
                options={statusOptions}
              />
            </div>
          </div>
        </div>

        {/* Itens do Pedido */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Itens do Pedido</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {Icons.search}
                </span>
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64"
                />
              </div>
              <button className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200">
                {Icons.plus}
                <span>Adicionar Item</span>
              </button>
            </div>
          </div>

          {/* Tabela de Itens */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
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
                {itens.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.quantidade}
                        onChange={(e) => atualizarItem(item.id, 'quantidade', parseInt(e.target.value) || 0)}
                        className="w-20 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600">{item.unidade}</td>
                    <td className="px-3 py-2">
                      <div className="text-sm font-medium text-gray-800">{item.descricao}</div>
                      <div className="text-xs text-gray-400 font-mono">{item.codigo}</div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={formatMoney(item.valorUnit)}
                        onChange={(e) => {
                          const nums = e.target.value.replace(/\D/g, '');
                          atualizarItem(item.id, 'valorUnit', parseFloat(nums) / 100 || 0);
                        }}
                        className="w-28 px-2 py-1 text-right border border-gray-200 rounded-lg text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        value={item.desconto}
                        onChange={(e) => atualizarItem(item.id, 'desconto', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-gray-800">
                      {formatMoney(calcularTotalItem(item))}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button 
                        onClick={() => removerItem(item.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        {Icons.trash}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totais */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal Produtos:</span>
                  <span className="font-medium text-gray-800">{formatMoney(subtotalProdutos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete ({pedido.frete}):</span>
                  <span className="text-gray-800">{formatMoney(pedido.valorFrete)}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-800">Total do Pedido:</span>
                  <span className="font-bold text-blue-600">{formatMoney(totalPedido)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações para o Fornecedor</h2>
            <textarea
              value={pedido.observacoes}
              onChange={(e) => setPedido({...pedido, observacoes: e.target.value})}
              placeholder="Observações que serão enviadas ao fornecedor..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações Internas</h2>
            <textarea
              value={pedido.observacoesInternas}
              onChange={(e) => setPedido({...pedido, observacoesInternas: e.target.value})}
              placeholder="Observações internas (não visíveis ao fornecedor)..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
