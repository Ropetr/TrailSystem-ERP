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
  wallet: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  calendar: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  attachment: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>,
  download: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
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
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'PAGO', label: 'Pago' },
  { value: 'PARCIAL', label: 'Pago Parcialmente' },
  { value: 'VENCIDO', label: 'Vencido' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

const tipoDocumentoOptions = [
  { value: 'NOTA_FISCAL', label: 'Nota Fiscal' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'FATURA', label: 'Fatura' },
  { value: 'DUPLICATA', label: 'Duplicata' },
  { value: 'RECIBO', label: 'Recibo' },
  { value: 'CONTRATO', label: 'Contrato' },
  { value: 'OUTROS', label: 'Outros' },
];

const categoriaOptions = [
  { value: 'FORNECEDORES', label: 'Fornecedores' },
  { value: 'DESPESAS_FIXAS', label: 'Despesas Fixas' },
  { value: 'DESPESAS_VARIAVEIS', label: 'Despesas Variáveis' },
  { value: 'IMPOSTOS', label: 'Impostos' },
  { value: 'FOLHA_PAGAMENTO', label: 'Folha de Pagamento' },
  { value: 'SERVICOS', label: 'Serviços' },
  { value: 'FINANCIAMENTOS', label: 'Financiamentos' },
  { value: 'OUTROS', label: 'Outros' },
];

const formaPagamentoOptions = [
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'PIX', label: 'PIX' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'DEBITO_AUTOMATICO', label: 'Débito Automático' },
];

const contaBancariaOptions = [
  { value: 'CONTA_1', label: 'Banco do Brasil - CC 12345-6' },
  { value: 'CONTA_2', label: 'Itaú - CC 98765-4' },
  { value: 'CONTA_3', label: 'Caixa Econômica - CC 55555-5' },
];

const centroCustoOptions = [
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'OPERACIONAL', label: 'Operacional' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
  { value: 'RH', label: 'Recursos Humanos' },
];

// ===========================================
// COMPONENTE PRINCIPAL
// ===========================================
export default function ContaPagarFormPage() {
  const [conta, setConta] = useState({
    id: '',
    fornecedor: '',
    fornecedorNome: '',
    descricao: '',
    tipoDocumento: 'NOTA_FISCAL',
    numeroDocumento: '',
    categoria: 'FORNECEDORES',
    centroCusto: 'OPERACIONAL',
    dataEmissao: new Date().toISOString().split('T')[0],
    dataVencimento: '',
    dataPagamento: '',
    valorOriginal: 0,
    valorDesconto: 0,
    valorJuros: 0,
    valorMulta: 0,
    valorPago: 0,
    formaPagamento: 'BOLETO',
    contaBancaria: 'CONTA_1',
    status: 'PENDENTE',
    codigoBarras: '',
    observacoes: '',
    recorrente: false,
    periodicidade: '',
  });

  const [parcelas, setParcelas] = useState([]);
  const [numParcelas, setNumParcelas] = useState(1);
  const [buscaFornecedor, setBuscaFornecedor] = useState('');

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const parseMoney = (value) => {
    const nums = value.replace(/\D/g, '');
    return parseFloat(nums) / 100 || 0;
  };

  const handleMoneyChange = (field, value) => {
    setConta({ ...conta, [field]: parseMoney(value) });
  };

  const valorTotal = conta.valorOriginal - conta.valorDesconto + conta.valorJuros + conta.valorMulta;
  const valorRestante = valorTotal - conta.valorPago;

  const gerarParcelas = () => {
    if (numParcelas < 1 || !conta.dataVencimento) return;
    
    const valorParcela = Math.floor((conta.valorOriginal / numParcelas) * 100) / 100;
    const resto = Math.round((conta.valorOriginal - (valorParcela * numParcelas)) * 100) / 100;
    const dataBase = new Date(conta.dataVencimento);
    
    const novasParcelas = [];
    for (let i = 0; i < numParcelas; i++) {
      const dataVenc = new Date(dataBase);
      dataVenc.setMonth(dataVenc.getMonth() + i);
      
      novasParcelas.push({
        numero: i + 1,
        vencimento: dataVenc.toISOString().split('T')[0],
        valor: i === numParcelas - 1 ? valorParcela + resto : valorParcela,
        status: 'PENDENTE',
      });
    }
    
    setParcelas(novasParcelas);
  };

  const menuItems = [
    { icon: Icons.save, label: 'Salvar', variant: 'success' },
    { icon: Icons.download, label: 'Baixar Conta', variant: 'success' },
    { type: 'separator' },
    { icon: Icons.trash, label: 'Excluir', variant: 'danger' },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      PENDENTE: 'bg-yellow-100 text-yellow-700',
      PAGO: 'bg-green-100 text-green-700',
      PARCIAL: 'bg-blue-100 text-blue-700',
      VENCIDO: 'bg-red-100 text-red-700',
      CANCELADO: 'bg-gray-100 text-gray-700',
    };
    return styles[status] || styles.PENDENTE;
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
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center text-white">
                {Icons.wallet}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {conta.id ? `Conta a Pagar #${conta.id}` : 'Nova Conta a Pagar'}
                </h1>
                <p className="text-sm text-gray-500">Cadastro de despesa</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(conta.status)}`}>
                {statusOptions.find(s => s.value === conta.status)?.label}
              </span>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
                {Icons.save}
                <span>Salvar</span>
              </button>
              <DropdownMenu items={menuItems} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Dados Principais */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados da Conta</h2>
          
          {/* Fornecedor */}
          <div className="grid grid-cols-3 gap-3 mb-4">
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
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500">
                  {Icons.search}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <SelectDropdown
                value={conta.status}
                onChange={(val) => setConta({...conta, status: val})}
                options={statusOptions}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo Documento</label>
              <SelectDropdown
                value={conta.tipoDocumento}
                onChange={(val) => setConta({...conta, tipoDocumento: val})}
                options={tipoDocumentoOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nº Documento</label>
              <input 
                type="text" 
                value={conta.numeroDocumento}
                onChange={(e) => setConta({...conta, numeroDocumento: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="Ex: NF-123456"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Categoria</label>
              <SelectDropdown
                value={conta.categoria}
                onChange={(val) => setConta({...conta, categoria: val})}
                options={categoriaOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Centro de Custo</label>
              <SelectDropdown
                value={conta.centroCusto}
                onChange={(val) => setConta({...conta, centroCusto: val})}
                options={centroCustoOptions}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Descrição *</label>
            <input 
              type="text" 
              value={conta.descricao}
              onChange={(e) => setConta({...conta, descricao: e.target.value})}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              placeholder="Descrição da despesa..."
            />
          </div>
        </div>

        {/* Datas e Valores */}
        <div className="grid grid-cols-2 gap-4">
          {/* Datas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              {Icons.calendar}
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Datas</h2>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data Emissão</label>
                <input 
                  type="date" 
                  value={conta.dataEmissao}
                  onChange={(e) => setConta({...conta, dataEmissao: e.target.value})}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data Vencimento *</label>
                <input 
                  type="date" 
                  value={conta.dataVencimento}
                  onChange={(e) => setConta({...conta, dataVencimento: e.target.value})}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data Pagamento</label>
                <input 
                  type="date" 
                  value={conta.dataPagamento}
                  onChange={(e) => setConta({...conta, dataPagamento: e.target.value})}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                  disabled={conta.status === 'PENDENTE'}
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <input 
                  type="checkbox" 
                  id="recorrente"
                  checked={conta.recorrente}
                  onChange={(e) => setConta({...conta, recorrente: e.target.checked})}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <label htmlFor="recorrente" className="text-sm text-gray-700">Conta Recorrente</label>
              </div>
            </div>
          </div>

          {/* Valores */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Valores</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Valor Original *</label>
                <input 
                  type="text" 
                  value={formatMoney(conta.valorOriginal)}
                  onChange={(e) => handleMoneyChange('valorOriginal', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right font-medium"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Desconto</label>
                <input 
                  type="text" 
                  value={formatMoney(conta.valorDesconto)}
                  onChange={(e) => handleMoneyChange('valorDesconto', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right text-green-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Juros</label>
                <input 
                  type="text" 
                  value={formatMoney(conta.valorJuros)}
                  onChange={(e) => handleMoneyChange('valorJuros', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right text-red-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Multa</label>
                <input 
                  type="text" 
                  value={formatMoney(conta.valorMulta)}
                  onChange={(e) => handleMoneyChange('valorMulta', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right text-red-600"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor Total:</span>
                <span className="font-semibold text-gray-800">{formatMoney(valorTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor Pago:</span>
                <span className="text-green-600">{formatMoney(conta.valorPago)}</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-gray-100">
                <span className="font-semibold text-gray-800">Saldo Restante:</span>
                <span className="font-bold text-red-600">{formatMoney(valorRestante)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pagamento */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados de Pagamento</h2>
          
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Forma de Pagamento</label>
              <SelectDropdown
                value={conta.formaPagamento}
                onChange={(val) => setConta({...conta, formaPagamento: val})}
                options={formaPagamentoOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Conta Bancária</label>
              <SelectDropdown
                value={conta.contaBancaria}
                onChange={(val) => setConta({...conta, contaBancaria: val})}
                options={contaBancariaOptions}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Código de Barras / Linha Digitável</label>
              <input 
                type="text" 
                value={conta.codigoBarras}
                onChange={(e) => setConta({...conta, codigoBarras: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono"
                placeholder="00000.00000 00000.000000 00000.000000 0 00000000000000"
              />
            </div>
          </div>

          {/* Parcelamento */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Parcelamento</h3>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={numParcelas}
                  onChange={(e) => setNumParcelas(parseInt(e.target.value) || 1)}
                  min={1}
                  max={48}
                  className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center"
                />
                <span className="text-sm text-gray-500">parcela(s)</span>
                <button
                  onClick={gerarParcelas}
                  className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm hover:bg-red-200"
                >
                  Gerar
                </button>
              </div>
            </div>

            {parcelas.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Parcela</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Vencimento</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Valor</th>
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {parcelas.map((parcela) => (
                      <tr key={parcela.numero} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-700">{parcela.numero}/{parcelas.length}</td>
                        <td className="px-3 py-2 text-sm text-gray-700">
                          {new Date(parcela.vencimento).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-800 text-right font-medium">
                          {formatMoney(parcela.valor)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(parcela.status)}`}>
                            {parcela.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Anexos e Observações */}
        <div className="grid grid-cols-2 gap-4">
          {/* Anexos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              {Icons.attachment}
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Anexos</h2>
            </div>
            
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
              <div className="text-gray-400 mb-2">{Icons.attachment}</div>
              <p className="text-sm text-gray-500 mb-2">Arraste arquivos aqui ou</p>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">
                Selecionar Arquivos
              </button>
              <p className="text-xs text-gray-400 mt-2">PDF, JPG, PNG até 10MB</p>
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações</h2>
            <textarea
              value={conta.observacoes}
              onChange={(e) => setConta({...conta, observacoes: e.target.value})}
              placeholder="Observações sobre a conta..."
              rows={6}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
