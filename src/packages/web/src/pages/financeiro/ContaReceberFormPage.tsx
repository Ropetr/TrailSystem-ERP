import { useState, useRef, useEffect } from 'react';

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
  dollarSign: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  calendar: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  mail: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  whatsapp: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  printer: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
  download: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  creditCard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
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
  { value: 'RECEBIDO', label: 'Recebido' },
  { value: 'PARCIAL', label: 'Recebido Parcialmente' },
  { value: 'VENCIDO', label: 'Vencido' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

const origemOptions = [
  { value: 'VENDA', label: 'Venda' },
  { value: 'SERVICO', label: 'Serviço' },
  { value: 'CONTRATO', label: 'Contrato' },
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
  { value: 'CREDITO_CLIENTE', label: 'Crédito Cliente' },
];

const contaBancariaOptions = [
  { value: 'CONTA_1', label: 'Banco do Brasil - CC 12345-6' },
  { value: 'CONTA_2', label: 'Itaú - CC 98765-4' },
  { value: 'CONTA_3', label: 'Caixa Econômica - CC 55555-5' },
];

const vendedorOptions = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MARIA', label: 'Maria' },
  { value: 'CARLOS', label: 'Carlos' },
  { value: 'ANA', label: 'Ana' },
];

// ===========================================
// COMPONENTE PRINCIPAL
// ===========================================
export default function ContaReceberFormPage() {
  const [conta, setConta] = useState({
    id: '',
    cliente: '',
    clienteNome: '',
    clienteCpfCnpj: '',
    clienteTelefone: '',
    clienteEmail: '',
    descricao: '',
    origem: 'VENDA',
    documentoOrigem: '',
    vendedor: '',
    dataEmissao: new Date().toISOString().split('T')[0],
    dataVencimento: '',
    dataRecebimento: '',
    valorOriginal: 0,
    valorDesconto: 0,
    valorJuros: 0,
    valorMulta: 0,
    valorRecebido: 0,
    formaPagamento: 'BOLETO',
    contaBancaria: 'CONTA_1',
    status: 'PENDENTE',
    nossoNumero: '',
    linhaDigitavel: '',
    observacoes: '',
    enviarCobranca: true,
  });

  const [parcelas, setParcelas] = useState([]);
  const [numParcelas, setNumParcelas] = useState(1);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [historicoCobranca, setHistoricoCobranca] = useState([
    { data: '2025-12-10', tipo: 'EMAIL', descricao: 'Boleto enviado por email' },
    { data: '2025-12-15', tipo: 'WHATSAPP', descricao: 'Lembrete de vencimento' },
  ]);

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
  const valorRestante = valorTotal - conta.valorRecebido;

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
        nossoNumero: `${Date.now()}${i + 1}`,
      });
    }
    
    setParcelas(novasParcelas);
  };

  const menuItems = [
    { icon: Icons.save, label: 'Salvar', variant: 'success' },
    { icon: Icons.download, label: 'Baixar Recebimento', variant: 'success' },
    { type: 'separator' },
    { icon: Icons.printer, label: 'Imprimir Boleto' },
    { icon: Icons.mail, label: 'Enviar por Email' },
    { icon: Icons.whatsapp, label: 'Enviar WhatsApp' },
    { type: 'separator' },
    { icon: Icons.trash, label: 'Excluir', variant: 'danger' },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      PENDENTE: 'bg-yellow-100 text-yellow-700',
      RECEBIDO: 'bg-green-100 text-green-700',
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
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-700 rounded-xl flex items-center justify-center text-white">
                {Icons.dollarSign}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {conta.id ? `Conta a Receber #${conta.id}` : 'Nova Conta a Receber'}
                </h1>
                <p className="text-sm text-gray-500">Cadastro de receita</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(conta.status)}`}>
                {statusOptions.find(s => s.value === conta.status)?.label}
              </span>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2">
                {Icons.save}
                <span>Salvar</span>
              </button>
              <DropdownMenu items={menuItems} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Cliente */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados do Cliente</h2>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Cliente *</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm pr-10"
                  placeholder="Buscar cliente por nome ou CPF/CNPJ..."
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-500">
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

          {/* Dados do cliente selecionado */}
          {conta.clienteNome && (
            <div className="bg-gray-50 rounded-lg p-3 grid grid-cols-4 gap-3">
              <div>
                <span className="text-xs text-gray-500">Nome/Razão Social</span>
                <p className="text-sm font-medium text-gray-800">{conta.clienteNome}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">CPF/CNPJ</span>
                <p className="text-sm font-mono text-gray-800">{conta.clienteCpfCnpj}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">Telefone</span>
                <p className="text-sm text-gray-800">{conta.clienteTelefone}</p>
              </div>
              <div>
                <span className="text-xs text-gray-500">E-mail</span>
                <p className="text-sm text-gray-800">{conta.clienteEmail}</p>
              </div>
            </div>
          )}
        </div>

        {/* Dados da Conta */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados da Conta</h2>
          
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Origem</label>
              <SelectDropdown
                value={conta.origem}
                onChange={(val) => setConta({...conta, origem: val})}
                options={origemOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Documento Origem</label>
              <input 
                type="text" 
                value={conta.documentoOrigem}
                onChange={(e) => setConta({...conta, documentoOrigem: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="Ex: Venda #12345"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Vendedor</label>
              <SelectDropdown
                value={conta.vendedor}
                onChange={(val) => setConta({...conta, vendedor: val})}
                options={vendedorOptions}
                placeholder="Selecione..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nosso Número</label>
              <input 
                type="text" 
                value={conta.nossoNumero}
                onChange={(e) => setConta({...conta, nossoNumero: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono"
                placeholder="Automático"
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
              placeholder="Descrição do recebimento..."
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
                <label className="block text-xs text-gray-500 mb-1">Data Recebimento</label>
                <input 
                  type="date" 
                  value={conta.dataRecebimento}
                  onChange={(e) => setConta({...conta, dataRecebimento: e.target.value})}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                  disabled={conta.status === 'PENDENTE'}
                />
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
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right text-red-600"
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
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right text-green-600"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Multa</label>
                <input 
                  type="text" 
                  value={formatMoney(conta.valorMulta)}
                  onChange={(e) => handleMoneyChange('valorMulta', e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right text-green-600"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor Total:</span>
                <span className="font-semibold text-gray-800">{formatMoney(valorTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Valor Recebido:</span>
                <span className="text-green-600">{formatMoney(conta.valorRecebido)}</span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t border-gray-100">
                <span className="font-semibold text-gray-800">Saldo a Receber:</span>
                <span className="font-bold text-green-600">{formatMoney(valorRestante)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pagamento */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            {Icons.creditCard}
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Dados de Recebimento</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Forma de Recebimento</label>
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
            <div>
              <label className="block text-xs text-gray-500 mb-1">Linha Digitável (Boleto)</label>
              <input 
                type="text" 
                value={conta.linhaDigitavel}
                onChange={(e) => setConta({...conta, linhaDigitavel: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono"
                placeholder="Gerado automaticamente"
                readOnly
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
                  max={24}
                  className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center"
                />
                <span className="text-sm text-gray-500">parcela(s)</span>
                <button
                  onClick={gerarParcelas}
                  className="px-3 py-1 bg-green-100 text-green-600 rounded-lg text-sm hover:bg-green-200"
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
                      <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Ações</th>
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
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button className="p-1 text-gray-400 hover:text-blue-500" title="Imprimir Boleto">
                              {Icons.printer}
                            </button>
                            <button className="p-1 text-gray-400 hover:text-green-500" title="Enviar WhatsApp">
                              {Icons.whatsapp}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Histórico de Cobrança e Observações */}
        <div className="grid grid-cols-2 gap-4">
          {/* Histórico */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Histórico de Cobrança</h2>
              <div className="flex items-center gap-2">
                <button className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Enviar WhatsApp">
                  {Icons.whatsapp}
                </button>
                <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Enviar Email">
                  {Icons.mail}
                </button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-48 overflow-auto">
              {historicoCobranca.map((item, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <span className="text-gray-400 whitespace-nowrap">
                    {new Date(item.data).toLocaleDateString('pt-BR')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    item.tipo === 'EMAIL' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {item.tipo}
                  </span>
                  <span className="text-gray-600">{item.descricao}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Observações */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações</h2>
            <textarea
              value={conta.observacoes}
              onChange={(e) => setConta({...conta, observacoes: e.target.value})}
              placeholder="Observações sobre a conta..."
              rows={5}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            />
            
            <div className="mt-3 flex items-center gap-2">
              <input 
                type="checkbox" 
                id="enviarCobranca"
                checked={conta.enviarCobranca}
                onChange={(e) => setConta({...conta, enviarCobranca: e.target.checked})}
                className="w-4 h-4 text-green-600 rounded"
              />
              <label htmlFor="enviarCobranca" className="text-sm text-gray-700">
                Enviar lembretes de cobrança automáticos
              </label>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
