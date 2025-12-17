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
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  save: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  plus: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  building: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  phone: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  mail: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  mapPin: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
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
const tipoFornecedorOptions = [
  { value: 'NACIONAL', label: 'Nacional' },
  { value: 'IMPORTACAO', label: 'Importação' },
  { value: 'SERVICO', label: 'Serviço' },
];

const categoriaOptions = [
  { value: 'MATERIA_PRIMA', label: 'Matéria Prima' },
  { value: 'REVENDA', label: 'Revenda' },
  { value: 'SERVICOS', label: 'Serviços' },
  { value: 'TRANSPORTE', label: 'Transporte' },
  { value: 'OUTROS', label: 'Outros' },
];

const ufOptions = [
  { value: 'AC', label: 'AC' }, { value: 'AL', label: 'AL' }, { value: 'AP', label: 'AP' },
  { value: 'AM', label: 'AM' }, { value: 'BA', label: 'BA' }, { value: 'CE', label: 'CE' },
  { value: 'DF', label: 'DF' }, { value: 'ES', label: 'ES' }, { value: 'GO', label: 'GO' },
  { value: 'MA', label: 'MA' }, { value: 'MT', label: 'MT' }, { value: 'MS', label: 'MS' },
  { value: 'MG', label: 'MG' }, { value: 'PA', label: 'PA' }, { value: 'PB', label: 'PB' },
  { value: 'PR', label: 'PR' }, { value: 'PE', label: 'PE' }, { value: 'PI', label: 'PI' },
  { value: 'RJ', label: 'RJ' }, { value: 'RN', label: 'RN' }, { value: 'RS', label: 'RS' },
  { value: 'RO', label: 'RO' }, { value: 'RR', label: 'RR' }, { value: 'SC', label: 'SC' },
  { value: 'SP', label: 'SP' }, { value: 'SE', label: 'SE' }, { value: 'TO', label: 'TO' },
];

const condicoesPagtoOptions = [
  { value: 'A_VISTA', label: 'À Vista' },
  { value: '30_DIAS', label: '30 dias' },
  { value: '30_60', label: '30/60 dias' },
  { value: '30_60_90', label: '30/60/90 dias' },
  { value: '28_56_84', label: '28/56/84 dias' },
];

// ===========================================
// COMPONENTE PRINCIPAL
// ===========================================
export default function FornecedorFormPage() {
  const [fornecedor, setFornecedor] = useState({
    codigo: '',
    tipo: 'NACIONAL',
    categoria: 'REVENDA',
    razaoSocial: '',
    nomeFantasia: '',
    cnpj: '',
    inscricaoEstadual: '',
    inscricaoMunicipal: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: 'PR',
    telefone: '',
    celular: '',
    email: '',
    website: '',
    contatoPrincipal: '',
    condicaoPagamento: '30_DIAS',
    limiteCredito: 0,
    observacoes: '',
    ativo: true,
  });

  const [contatos, setContatos] = useState([
    { id: 1, nome: '', cargo: '', telefone: '', email: '' }
  ]);

  const [loading, setLoading] = useState(false);

  const formatCNPJ = (value: string) => {
    const nums = value.replace(/\D/g, '');
    return nums.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
  };

  const formatCEP = (value: string) => {
    const nums = value.replace(/\D/g, '');
    return nums.replace(/^(\d{5})(\d{3}).*/, '$1-$2');
  };

  const formatTelefone = (value: string) => {
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 10) {
      return nums.replace(/^(\d{2})(\d{4})(\d{4}).*/, '($1) $2-$3');
    }
    return nums.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  };

  const buscarCEP = async () => {
    const cep = fornecedor.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        setFornecedor(prev => ({
          ...prev,
          logradouro: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || '',
          uf: data.uf || 'PR',
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
    setLoading(false);
  };

  const buscarCNPJ = async () => {
    const cnpj = fornecedor.cnpj.replace(/\D/g, '');
    if (cnpj.length !== 14) return;
    
    setLoading(true);
    // Aqui integraria com API de consulta CNPJ (CNPJá ou cpf.CNPJ)
    setLoading(false);
  };

  const adicionarContato = () => {
    setContatos([...contatos, { 
      id: Date.now(), 
      nome: '', 
      cargo: '', 
      telefone: '', 
      email: '' 
    }]);
  };

  const removerContato = (id: number) => {
    if (contatos.length > 1) {
      setContatos(contatos.filter(c => c.id !== id));
    }
  };

  const atualizarContato = (id: number, campo: string, valor: string) => {
    setContatos(contatos.map(c => 
      c.id === id ? { ...c, [campo]: valor } : c
    ));
  };

  const menuItems = [
    { icon: Icons.save, label: 'Salvar', variant: 'success' },
    { type: 'separator' },
    { icon: Icons.trash, label: 'Excluir', variant: 'danger' },
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
                {Icons.building}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {fornecedor.codigo ? `Fornecedor #${fornecedor.codigo}` : 'Novo Fornecedor'}
                </h1>
                <p className="text-sm text-gray-500">Cadastro de fornecedor</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
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
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados Principais</h2>
          
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Código</label>
              <input 
                type="text" 
                value={fornecedor.codigo}
                readOnly
                placeholder="Automático"
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo</label>
              <SelectDropdown
                value={fornecedor.tipo}
                onChange={(val) => setFornecedor({...fornecedor, tipo: val})}
                options={tipoFornecedorOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Categoria</label>
              <SelectDropdown
                value={fornecedor.categoria}
                onChange={(val) => setFornecedor({...fornecedor, categoria: val})}
                options={categoriaOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <div className="flex items-center gap-2 h-[34px]">
                <button
                  onClick={() => setFornecedor({...fornecedor, ativo: !fornecedor.ativo})}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    fornecedor.ativo ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    fornecedor.ativo ? 'left-7' : 'left-1'
                  }`} />
                </button>
                <span className="text-sm text-gray-600">{fornecedor.ativo ? 'Ativo' : 'Inativo'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Razão Social *</label>
              <input 
                type="text" 
                value={fornecedor.razaoSocial}
                onChange={(e) => setFornecedor({...fornecedor, razaoSocial: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="Razão social do fornecedor"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nome Fantasia</label>
              <input 
                type="text" 
                value={fornecedor.nomeFantasia}
                onChange={(e) => setFornecedor({...fornecedor, nomeFantasia: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="Nome fantasia"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">CNPJ *</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={fornecedor.cnpj}
                  onChange={(e) => setFornecedor({...fornecedor, cnpj: formatCNPJ(e.target.value)})}
                  onBlur={buscarCNPJ}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono pr-10"
                  placeholder="00.000.000/0000-00"
                  maxLength={18}
                />
                <button 
                  onClick={buscarCNPJ}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                >
                  {Icons.search}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Inscrição Estadual</label>
              <input 
                type="text" 
                value={fornecedor.inscricaoEstadual}
                onChange={(e) => setFornecedor({...fornecedor, inscricaoEstadual: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono"
                placeholder="Inscrição estadual"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Inscrição Municipal</label>
              <input 
                type="text" 
                value={fornecedor.inscricaoMunicipal}
                onChange={(e) => setFornecedor({...fornecedor, inscricaoMunicipal: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono"
                placeholder="Inscrição municipal"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cond. Pagamento</label>
              <SelectDropdown
                value={fornecedor.condicaoPagamento}
                onChange={(val) => setFornecedor({...fornecedor, condicaoPagamento: val})}
                options={condicoesPagtoOptions}
              />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            {Icons.mapPin}
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Endereço</h2>
          </div>
          
          <div className="grid grid-cols-6 gap-3 mb-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">CEP</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={fornecedor.cep}
                  onChange={(e) => setFornecedor({...fornecedor, cep: formatCEP(e.target.value)})}
                  onBlur={buscarCEP}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono pr-10"
                  placeholder="00000-000"
                  maxLength={9}
                />
                <button 
                  onClick={buscarCEP}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                >
                  {Icons.search}
                </button>
              </div>
            </div>
            <div className="col-span-3">
              <label className="block text-xs text-gray-500 mb-1">Logradouro</label>
              <input 
                type="text" 
                value={fornecedor.logradouro}
                onChange={(e) => setFornecedor({...fornecedor, logradouro: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="Rua, Avenida..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Número</label>
              <input 
                type="text" 
                value={fornecedor.numero}
                onChange={(e) => setFornecedor({...fornecedor, numero: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="Nº"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Complemento</label>
              <input 
                type="text" 
                value={fornecedor.complemento}
                onChange={(e) => setFornecedor({...fornecedor, complemento: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="Sala, Andar..."
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bairro</label>
              <input 
                type="text" 
                value={fornecedor.bairro}
                onChange={(e) => setFornecedor({...fornecedor, bairro: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="Bairro"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Cidade</label>
              <input 
                type="text" 
                value={fornecedor.cidade}
                onChange={(e) => setFornecedor({...fornecedor, cidade: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="Cidade"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">UF</label>
              <SelectDropdown
                value={fornecedor.uf}
                onChange={(val) => setFornecedor({...fornecedor, uf: val})}
                options={ufOptions}
              />
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            {Icons.phone}
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Contato</h2>
          </div>
          
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Telefone</label>
              <input 
                type="text" 
                value={fornecedor.telefone}
                onChange={(e) => setFornecedor({...fornecedor, telefone: formatTelefone(e.target.value)})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="(00) 0000-0000"
                maxLength={15}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Celular</label>
              <input 
                type="text" 
                value={fornecedor.celular}
                onChange={(e) => setFornecedor({...fornecedor, celular: formatTelefone(e.target.value)})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">E-mail</label>
              <input 
                type="email" 
                value={fornecedor.email}
                onChange={(e) => setFornecedor({...fornecedor, email: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="email@empresa.com"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Website</label>
              <input 
                type="url" 
                value={fornecedor.website}
                onChange={(e) => setFornecedor({...fornecedor, website: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="www.empresa.com.br"
              />
            </div>
          </div>

          {/* Lista de Contatos */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">Contatos Adicionais</h3>
              <button
                onClick={adicionarContato}
                className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
              >
                {Icons.plus}
                <span>Adicionar Contato</span>
              </button>
            </div>

            <div className="space-y-3">
              {contatos.map((contato, index) => (
                <div key={contato.id} className="grid grid-cols-5 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nome</label>
                    <input 
                      type="text" 
                      value={contato.nome}
                      onChange={(e) => atualizarContato(contato.id, 'nome', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      placeholder="Nome do contato"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Cargo</label>
                    <input 
                      type="text" 
                      value={contato.cargo}
                      onChange={(e) => atualizarContato(contato.id, 'cargo', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      placeholder="Cargo"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Telefone</label>
                    <input 
                      type="text" 
                      value={contato.telefone}
                      onChange={(e) => atualizarContato(contato.id, 'telefone', formatTelefone(e.target.value))}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      placeholder="(00) 00000-0000"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">E-mail</label>
                    <input 
                      type="email" 
                      value={contato.email}
                      onChange={(e) => atualizarContato(contato.id, 'email', e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      placeholder="email@empresa.com"
                    />
                  </div>
                  <div>
                    <button 
                      onClick={() => removerContato(contato.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      disabled={contatos.length === 1}
                    >
                      {Icons.trash}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações</h2>
          <textarea
            value={fornecedor.observacoes}
            onChange={(e) => setFornecedor({...fornecedor, observacoes: e.target.value})}
            placeholder="Observações gerais sobre o fornecedor..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
          />
        </div>
      </main>
    </div>
  );
}
