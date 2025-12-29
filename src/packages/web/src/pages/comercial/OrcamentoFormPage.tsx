import React, { useState, useRef, useEffect } from 'react';

// ===========================================
// ESTILOS GLOBAIS
// ===========================================
const globalStyles = `
  input:focus, textarea:focus {
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
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  printer: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
  mail: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  whatsapp: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  cart: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  scissors: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>,
  copy: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  x: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  document: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  edit: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
};

// ===========================================
// COMPONENTE: SELECT DROPDOWN PADRONIZADO
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
// COMPONENTE: DROPDOWN MENU (3 PONTINHOS)
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
// DADOS MOCK
// ===========================================
const itensMock = [
  { id: 1, codigo: '7890000010696', descricao: 'PISO WALL WOOD DECORLIT 1,20X2,50X40MM', unidade: 'UN', quantidade: 70, valorUnit: 403.00, desconto: 0 },
  { id: 2, codigo: '7890000016209', descricao: 'PAINEL FACILITY XPS 1,20X2,50X50MM', unidade: 'UN', quantidade: 2, valorUnit: 620.00, desconto: 0 },
  { id: 3, codigo: '7892261535758', descricao: 'PARAFUSO PISOWALL PB 5,5X76', unidade: 'CE', quantidade: 12, valorUnit: 95.99, desconto: 0 },
];

const formasPagamentoMock = [
  { id: 1, nome: 'Boleto', ativo: true },
  { id: 2, nome: 'PIX', ativo: true },
  { id: 3, nome: 'Dinheiro', ativo: true },
  { id: 4, nome: 'Cartão Crédito', ativo: true },
  { id: 5, nome: 'Cartão Débito', ativo: true },
  { id: 6, nome: 'Cheque', ativo: true },
  { id: 7, nome: 'Transferência', ativo: true },
  { id: 8, nome: 'Crédito Cliente', ativo: true },
];

// Options para os selects
const vendedoresOptions = [
  { value: 'JUNIOR', label: 'JUNIOR' },
  { value: 'MARIA', label: 'MARIA' },
  { value: 'CARLOS', label: 'CARLOS' },
];

const tabelasPrecoOptions = [
  { value: 'TABELA PADRÃO', label: 'TABELA PADRÃO' },
  { value: 'TABELA ATACADO', label: 'TABELA ATACADO' },
  { value: 'TABELA VAREJO', label: 'TABELA VAREJO' },
];

const condicoesPagtoOptions = [
  { value: 'À Vista', label: 'À Vista' },
  { value: 'A Prazo', label: 'A Prazo' },
  { value: 'A Prazo com Entrada', label: 'A Prazo com Entrada' },
];

const situacoesParcelamentoOptions = [
  { value: '30 dias', label: '30 dias' },
  { value: '30/60', label: '30/60' },
  { value: '30/60/90', label: '30/60/90' },
  { value: '28/56/84', label: '28/56/84' },
  { value: '7/14/21/28', label: '7/14/21/28' },
  { value: '14/28/42', label: '14/28/42' },
];

// ===========================================
// COMPONENTE PRINCIPAL
// ===========================================
export default function FormularioOrcamento() {
  const [orcamento, setOrcamento] = useState({
    numero: '047592',
    emissao: '2025-12-08',
    validade: '2025-12-23',
    prevEntrega: '2025-12-10',
    vendedor: 'JUNIOR',
    tabelaPreco: 'TABELA PADRÃO',
    condicaoPagto: 'A Prazo',
    situacaoParcelamento: '30/60/90',
    cliente: {
      codigo: '012431',
      razaoSocial: 'COMERCIAL R S Z LTDA',
      cnpj: '02.953.009/0001-42',
      ieRg: '123.456.789',
      endereco: 'AVENIDA PARANA, 556',
      cidade: 'LONDRINA',
      uf: 'PR',
      telefoneFixo: '(43)3027-1575',
      celular: '(43)99121-2121',
    }
  });
  
  const [itens, setItens] = useState(itensMock);
  const [observacoes, setObservacoes] = useState('');
  const [buscaProduto, setBuscaProduto] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');
  const [formasPagamento] = useState(formasPagamentoMock.filter(f => f.ativo));

  const formasPagamentoOptions = formasPagamento.map(f => ({ value: f.nome, label: f.nome }));

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const calcularTotalItem = (item) => {
    const subtotal = item.quantidade * item.valorUnit;
    return subtotal - (subtotal * item.desconto / 100);
  };

  const totalProdutos = itens.reduce((acc, item) => acc + calcularTotalItem(item), 0);

  const calcularParcelas = () => {
    const total = totalProdutos;
    const condicao = orcamento.condicaoPagto;
    const situacao = orcamento.situacaoParcelamento;
    
    if (condicao === 'À Vista') {
      const hoje = new Date();
      return [{
        numero: '1/1',
        vencimento: hoje.toLocaleDateString('pt-BR'),
        valor: total,
        forma: 'PIX'
      }];
    }
    
    const dias = situacao.split('/').map(d => parseInt(d.replace(' dias', '')));
    const numParcelas = dias.length;
    const valorParcela = Math.floor((total / numParcelas) * 100) / 100;
    const resto = Math.round((total - (valorParcela * numParcelas)) * 100) / 100;
    
    const parcelas = dias.map((d, i) => {
      const venc = new Date();
      venc.setDate(venc.getDate() + d);
      return {
        numero: `${i + 1}/${numParcelas}`,
        vencimento: venc.toLocaleDateString('pt-BR'),
        valor: i === numParcelas - 1 ? valorParcela + resto : valorParcela,
        forma: 'Boleto'
      };
    });
    
    if (condicao === 'A Prazo com Entrada') {
      const entrada = parcelas[0];
      entrada.vencimento = new Date().toLocaleDateString('pt-BR');
      entrada.forma = 'Dinheiro';
    }
    
    return parcelas;
  };

  const [parcelas, setParcelas] = useState(calcularParcelas());

  useEffect(() => {
    setParcelas(calcularParcelas());
  }, [orcamento.condicaoPagto, orcamento.situacaoParcelamento, totalProdutos]);

  const atualizarFormaParcela = (index, novaForma) => {
    setParcelas(parcelas.map((p, i) => i === index ? { ...p, forma: novaForma } : p));
  };

  const removerItem = (id) => {
    setItens(itens.filter(item => item.id !== id));
  };

  const atualizarItem = (id, campo, valor) => {
    setItens(itens.map(item => 
      item.id === id ? { ...item, [campo]: valor } : item
    ));
  };

  const menuItems = [
    { icon: Icons.edit, label: 'Editar' },
    { icon: Icons.copy, label: 'Duplicar' },
    { icon: Icons.mail, label: 'Enviar Email' },
    { icon: Icons.whatsapp, label: 'WhatsApp' },
    { icon: Icons.printer, label: 'Imprimir' },
    { type: 'separator' },
    { icon: Icons.cart, label: 'Gerar Venda', variant: 'success' },
    { icon: Icons.scissors, label: 'Desmembrar' },
    { icon: Icons.x, label: 'Cancelar', variant: 'danger' },
  ];

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
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white">
                {Icons.document}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Orçamento #{orcamento.numero}</h1>
                <p className="text-sm text-gray-500">Editando proposta comercial</p>
              </div>
            </div>
            
            <DropdownMenu items={menuItems} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Dados do Orçamento + Cliente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados do Orçamento</h2>
          
          {/* Linha 1: Número, Emissão, Validade, Prev. Entrega */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Número</label>
              <input 
                type="text" 
                value={orcamento.numero}
                readOnly
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Emissão</label>
              <input 
                type="date" 
                value={orcamento.emissao}
                onChange={(e) => setOrcamento({...orcamento, emissao: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Validade</label>
              <input 
                type="date" 
                value={orcamento.validade}
                onChange={(e) => setOrcamento({...orcamento, validade: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prev. Entrega</label>
              <input 
                type="date" 
                value={orcamento.prevEntrega}
                onChange={(e) => setOrcamento({...orcamento, prevEntrega: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Linha 2: Vendedor, Tabela Preço, Cond. Pagamento, Situação Parcelamento */}
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vendedor</label>
              <SelectDropdown
                value={orcamento.vendedor}
                onChange={(val) => setOrcamento({...orcamento, vendedor: val})}
                options={vendedoresOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tabela Preço</label>
              <SelectDropdown
                value={orcamento.tabelaPreco}
                onChange={(val) => setOrcamento({...orcamento, tabelaPreco: val})}
                options={tabelasPrecoOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cond. Pagamento</label>
              <SelectDropdown
                value={orcamento.condicaoPagto}
                onChange={(val) => setOrcamento({...orcamento, condicaoPagto: val})}
                options={condicoesPagtoOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Situação Parcelamento</label>
              <SelectDropdown
                value={orcamento.situacaoParcelamento}
                onChange={(val) => setOrcamento({...orcamento, situacaoParcelamento: val})}
                options={situacoesParcelamentoOptions}
                disabled={orcamento.condicaoPagto === 'À Vista'}
                placeholder="Selecione..."
              />
            </div>
          </div>

          {/* Divisória */}
          <div className="border-t border-gray-100 my-4"></div>

          {/* Cliente */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Cliente</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {Icons.search}
                </span>
                <input
                  type="text"
                  placeholder="Buscar cliente por nome, CNPJ..."
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64"
                />
              </div>
              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Buscar Cliente">
                {Icons.search}
              </button>
            </div>
          </div>

          {/* Dados do Cliente - Linha 1 */}
          <div className="grid grid-cols-5 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Código</label>
              <input type="text" value={orcamento.cliente.codigo} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Razão Social</label>
              <input type="text" value={orcamento.cliente.razaoSocial} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">CNPJ/CPF</label>
              <input type="text" value={orcamento.cliente.cnpj} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">IE/RG</label>
              <input type="text" value={orcamento.cliente.ieRg} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono" />
            </div>
          </div>

          {/* Dados do Cliente - Linha 2 */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tel. Fixo</label>
              <input type="text" value={orcamento.cliente.telefoneFixo} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Celular</label>
              <input type="text" value={orcamento.cliente.celular} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Endereço</label>
              <input type="text" value={orcamento.cliente.endereco} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cidade/UF</label>
              <input type="text" value={`${orcamento.cliente.cidade} - ${orcamento.cliente.uf}`} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
            </div>
          </div>
        </div>

        {/* Itens do Orçamento */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Itens do Orçamento</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {Icons.search}
                </span>
                <input
                  type="text"
                  placeholder="Ex: 10 parafuso, 5 painel..."
                  value={buscaProduto}
                  onChange={(e) => setBuscaProduto(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64"
                />
              </div>
              <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Buscar Produto">
                {Icons.search}
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
                    <td className="px-3 py-2 text-right text-sm text-gray-700">{formatMoney(item.valorUnit)}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        value={item.desconto}
                        onChange={(e) => atualizarItem(item.id, 'desconto', parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-medium text-gray-800">{formatMoney(calcularTotalItem(item))}</td>
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
                  <span className="font-medium text-gray-800">{formatMoney(totalProdutos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Frete:</span>
                  <span className="text-gray-800">{formatMoney(0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Acréscimo:</span>
                  <span className="text-gray-800">{formatMoney(0)}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-800">Total:</span>
                  <span className="font-bold text-red-600">{formatMoney(totalProdutos)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Observações + Simulação de Parcelamento */}
        <div className="grid grid-cols-2 gap-4">
          {/* Observações */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações</h2>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações do orçamento..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            />
          </div>

          {/* Simulação de Parcelamento */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Simulação de Parcelamento</h2>
            
            <div className="flex items-center justify-between mb-3 text-sm">
              <span className="text-gray-600">
                {orcamento.condicaoPagto} {orcamento.condicaoPagto !== 'À Vista' && `| ${orcamento.situacaoParcelamento}`}
              </span>
              <span className="font-semibold text-gray-800">{formatMoney(totalProdutos)}</span>
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
                  {parcelas.map((parcela, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm text-gray-700">{parcela.numero}</td>
                      <td className="px-3 py-2 text-sm text-gray-700">{parcela.vencimento}</td>
                      <td className="px-3 py-2 text-sm text-gray-800 text-right font-medium">{formatMoney(parcela.valor)}</td>
                      <td className="px-3 py-2">
                        <SelectDropdown
                          value={parcela.forma}
                          onChange={(val) => atualizarFormaParcela(index, val)}
                          options={formasPagamentoOptions}
                          className="w-full"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
