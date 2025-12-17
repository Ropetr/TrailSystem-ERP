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
  clipboard: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  mail: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  printer: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
  shoppingCart: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  star: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
  starOutline: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  building: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
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
  { value: 'ABERTA', label: 'Aberta' },
  { value: 'EM_ANALISE', label: 'Em Análise' },
  { value: 'FINALIZADA', label: 'Finalizada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const prioridadeOptions = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

const compradorOptions = [
  { value: 'JOAO', label: 'João Silva' },
  { value: 'MARIA', label: 'Maria Santos' },
  { value: 'CARLOS', label: 'Carlos Oliveira' },
];

// ===========================================
// DADOS MOCK - ITENS
// ===========================================
const itensMock = [
  { id: 1, codigo: '7890000010696', descricao: 'PLACA DE GESSO STANDARD 1200x1800x12.5MM', unidade: 'UN', quantidade: 500 },
  { id: 2, codigo: '7890000016209', descricao: 'PERFIL MONTANTE 48x30x3000MM', unidade: 'UN', quantidade: 200 },
  { id: 3, codigo: '7892261535758', descricao: 'PARAFUSO DRYWALL PH 3,5x25MM (CX 1000)', unidade: 'CX', quantidade: 50 },
];

// ===========================================
// DADOS MOCK - FORNECEDORES
// ===========================================
const fornecedoresMock = [
  { 
    id: 1, 
    nome: 'GYPSUM DO BRASIL LTDA', 
    cnpj: '12.345.678/0001-90',
    respondeu: true,
    dataResposta: '2025-12-10',
    prazoEntrega: 15,
    condicaoPagto: '30/60/90 dias',
    frete: 'CIF',
    valorFrete: 0,
    observacoes: 'Entrega em lotes',
    precos: [
      { itemId: 1, valorUnit: 27.50 },
      { itemId: 2, valorUnit: 14.90 },
      { itemId: 3, valorUnit: 40.00 },
    ],
    vencedor: false,
  },
  { 
    id: 2, 
    nome: 'PLACO DO BRASIL S/A', 
    cnpj: '98.765.432/0001-10',
    respondeu: true,
    dataResposta: '2025-12-11',
    prazoEntrega: 10,
    condicaoPagto: '30/60 dias',
    frete: 'CIF',
    valorFrete: 0,
    observacoes: '',
    precos: [
      { itemId: 1, valorUnit: 28.00 },
      { itemId: 2, valorUnit: 15.50 },
      { itemId: 3, valorUnit: 41.00 },
    ],
    vencedor: true,
  },
  { 
    id: 3, 
    nome: 'KNAUF DO BRASIL LTDA', 
    cnpj: '11.222.333/0001-44',
    respondeu: false,
    dataResposta: null,
    prazoEntrega: null,
    condicaoPagto: '',
    frete: '',
    valorFrete: 0,
    observacoes: '',
    precos: [],
    vencedor: false,
  },
];

// ===========================================
// COMPONENTE PRINCIPAL
// ===========================================
export default function CotacaoFormPage() {
  const [cotacao, setCotacao] = useState({
    numero: '000123',
    dataEmissao: new Date().toISOString().split('T')[0],
    dataValidade: '',
    status: 'ABERTA',
    prioridade: 'NORMAL',
    comprador: 'JOAO',
    observacoes: '',
  });

  const [itens, setItens] = useState(itensMock);
  const [fornecedores, setFornecedores] = useState(fornecedoresMock);
  const [buscaProduto, setBuscaProduto] = useState('');
  const [buscaFornecedor, setBuscaFornecedor] = useState('');
  const [viewMode, setViewMode] = useState('itens'); // 'itens' ou 'comparativo'

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const calcularTotalFornecedor = (fornecedor) => {
    if (!fornecedor.respondeu) return 0;
    return fornecedor.precos.reduce((total, preco) => {
      const item = itens.find(i => i.id === preco.itemId);
      return total + (item ? item.quantidade * preco.valorUnit : 0);
    }, 0) + fornecedor.valorFrete;
  };

  const removerItem = (id) => {
    setItens(itens.filter(item => item.id !== id));
  };

  const atualizarItem = (id, campo, valor) => {
    setItens(itens.map(item => 
      item.id === id ? { ...item, [campo]: valor } : item
    ));
  };

  const removerFornecedor = (id) => {
    setFornecedores(fornecedores.filter(f => f.id !== id));
  };

  const definirVencedor = (id) => {
    setFornecedores(fornecedores.map(f => ({
      ...f,
      vencedor: f.id === id
    })));
  };

  const menuItems = [
    { icon: Icons.save, label: 'Salvar', variant: 'success' },
    { type: 'separator' },
    { icon: Icons.mail, label: 'Enviar aos Fornecedores' },
    { icon: Icons.printer, label: 'Imprimir' },
    { type: 'separator' },
    { icon: Icons.shoppingCart, label: 'Gerar Pedido de Compra', variant: 'success' },
    { type: 'separator' },
    { icon: Icons.trash, label: 'Cancelar Cotação', variant: 'danger' },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      ABERTA: 'bg-blue-100 text-blue-700',
      EM_ANALISE: 'bg-yellow-100 text-yellow-700',
      FINALIZADA: 'bg-green-100 text-green-700',
      CANCELADA: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.ABERTA;
  };

  const getMenorPreco = (itemId) => {
    const precos = fornecedores
      .filter(f => f.respondeu)
      .map(f => f.precos.find(p => p.itemId === itemId)?.valorUnit || Infinity);
    return Math.min(...precos);
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
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center text-white">
                {Icons.clipboard}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Cotação #{cotacao.numero}
                </h1>
                <p className="text-sm text-gray-500">Comparativo de preços</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(cotacao.status)}`}>
                {statusOptions.find(s => s.value === cotacao.status)?.label}
              </span>
              <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
                {Icons.save}
                <span>Salvar</span>
              </button>
              <DropdownMenu items={menuItems} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Dados da Cotação */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados da Cotação</h2>
          
          <div className="grid grid-cols-6 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Número</label>
              <input 
                type="text" 
                value={cotacao.numero}
                readOnly
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data Emissão</label>
              <input 
                type="date" 
                value={cotacao.dataEmissao}
                onChange={(e) => setCotacao({...cotacao, dataEmissao: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Validade</label>
              <input 
                type="date" 
                value={cotacao.dataValidade}
                onChange={(e) => setCotacao({...cotacao, dataValidade: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Comprador</label>
              <SelectDropdown
                value={cotacao.comprador}
                onChange={(val) => setCotacao({...cotacao, comprador: val})}
                options={compradorOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prioridade</label>
              <SelectDropdown
                value={cotacao.prioridade}
                onChange={(val) => setCotacao({...cotacao, prioridade: val})}
                options={prioridadeOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <SelectDropdown
                value={cotacao.status}
                onChange={(val) => setCotacao({...cotacao, status: val})}
                options={statusOptions}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setViewMode('itens')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'itens'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Itens da Cotação
              </button>
              <button
                onClick={() => setViewMode('comparativo')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  viewMode === 'comparativo'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Comparativo de Preços
              </button>
            </div>
          </div>

          <div className="p-5">
            {viewMode === 'itens' ? (
              <>
                {/* Itens */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Itens para Cotação</h3>
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
                    <button className="flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-600 rounded-lg text-sm hover:bg-purple-200">
                      {Icons.plus}
                      <span>Adicionar Item</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Código</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Descrição</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-16">Un</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-24">Qtde</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-16">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {itens.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm font-mono text-gray-600">{item.codigo}</td>
                          <td className="px-3 py-2 text-sm text-gray-800">{item.descricao}</td>
                          <td className="px-3 py-2 text-sm text-gray-600 text-center">{item.unidade}</td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="number"
                              value={item.quantidade}
                              onChange={(e) => atualizarItem(item.id, 'quantidade', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                            />
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

                {/* Fornecedores */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-700">Fornecedores Convidados</h3>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {Icons.search}
                        </span>
                        <input
                          type="text"
                          placeholder="Buscar fornecedor..."
                          value={buscaFornecedor}
                          onChange={(e) => setBuscaFornecedor(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64"
                        />
                      </div>
                      <button className="flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-600 rounded-lg text-sm hover:bg-purple-200">
                        {Icons.plus}
                        <span>Adicionar Fornecedor</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    {fornecedores.map((fornecedor) => (
                      <div 
                        key={fornecedor.id} 
                        className={`border rounded-lg p-4 ${
                          fornecedor.vencedor 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                              {Icons.building}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{fornecedor.nome}</p>
                              <p className="text-xs text-gray-500 font-mono">{fornecedor.cnpj}</p>
                            </div>
                          </div>
                          {fornecedor.vencedor && (
                            <span className="text-yellow-500">{Icons.star}</span>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            <span className={`font-medium ${fornecedor.respondeu ? 'text-green-600' : 'text-yellow-600'}`}>
                              {fornecedor.respondeu ? 'Respondeu' : 'Aguardando'}
                            </span>
                          </div>
                          {fornecedor.respondeu && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Prazo:</span>
                                <span className="text-gray-800">{fornecedor.prazoEntrega} dias</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Pagto:</span>
                                <span className="text-gray-800">{fornecedor.condicaoPagto}</span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="text-gray-700 font-medium">Total:</span>
                                <span className="text-gray-800 font-bold">{formatMoney(calcularTotalFornecedor(fornecedor))}</span>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                          {fornecedor.respondeu && !fornecedor.vencedor && (
                            <button 
                              onClick={() => definirVencedor(fornecedor.id)}
                              className="flex-1 py-1.5 text-xs bg-green-100 text-green-600 rounded hover:bg-green-200"
                            >
                              Definir Vencedor
                            </button>
                          )}
                          <button 
                            onClick={() => removerFornecedor(fornecedor.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          >
                            {Icons.trash}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Comparativo */
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Produto</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-16">Qtde</th>
                      {fornecedores.filter(f => f.respondeu).map(f => (
                        <th key={f.id} className={`px-3 py-2 text-center text-xs font-semibold uppercase ${f.vencedor ? 'text-green-600 bg-green-50' : 'text-gray-600'}`}>
                          {f.nome.split(' ')[0]}
                          {f.vencedor && <span className="ml-1 text-yellow-500">★</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {itens.map((item) => {
                      const menorPreco = getMenorPreco(item.id);
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <div className="text-sm font-medium text-gray-800">{item.descricao}</div>
                            <div className="text-xs text-gray-400 font-mono">{item.codigo}</div>
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-600 text-center">{item.quantidade}</td>
                          {fornecedores.filter(f => f.respondeu).map(f => {
                            const preco = f.precos.find(p => p.itemId === item.id);
                            const isMenor = preco?.valorUnit === menorPreco;
                            return (
                              <td key={f.id} className={`px-3 py-2 text-center ${f.vencedor ? 'bg-green-50' : ''}`}>
                                <span className={`text-sm font-medium ${isMenor ? 'text-green-600' : 'text-gray-800'}`}>
                                  {preco ? formatMoney(preco.valorUnit) : '-'}
                                </span>
                                {isMenor && <span className="ml-1 text-green-500 text-xs">✓</span>}
                                <div className="text-xs text-gray-500">
                                  {preco ? formatMoney(preco.valorUnit * item.quantidade) : '-'}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                    {/* Totais */}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-3 py-3 text-sm text-gray-800" colSpan={2}>TOTAL</td>
                      {fornecedores.filter(f => f.respondeu).map(f => (
                        <td key={f.id} className={`px-3 py-3 text-center ${f.vencedor ? 'bg-green-100' : ''}`}>
                          <span className={`text-sm ${f.vencedor ? 'text-green-700' : 'text-gray-800'}`}>
                            {formatMoney(calcularTotalFornecedor(f))}
                          </span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações</h2>
          <textarea
            value={cotacao.observacoes}
            onChange={(e) => setCotacao({...cotacao, observacoes: e.target.value})}
            placeholder="Observações gerais da cotação..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
          />
        </div>
      </main>
    </div>
  );
}
