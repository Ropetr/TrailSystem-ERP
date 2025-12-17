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
  userPlus: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  phone: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  mail: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  whatsapp: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  building: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  calendar: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  tag: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  star: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  target: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  plus: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
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
  { value: 'NOVO', label: 'Novo' },
  { value: 'CONTATADO', label: 'Contatado' },
  { value: 'QUALIFICADO', label: 'Qualificado' },
  { value: 'PROPOSTA', label: 'Proposta Enviada' },
  { value: 'CONVERTIDO', label: 'Convertido' },
  { value: 'PERDIDO', label: 'Perdido' },
];

const origemOptions = [
  { value: 'SITE', label: 'Site' },
  { value: 'INDICACAO', label: 'Indicação' },
  { value: 'GOOGLE', label: 'Google Ads' },
  { value: 'FACEBOOK', label: 'Facebook/Instagram' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'FEIRA', label: 'Feira/Evento' },
  { value: 'COLD_CALL', label: 'Cold Call' },
  { value: 'OUTROS', label: 'Outros' },
];

const temperaturaOptions = [
  { value: 'FRIO', label: '❄️ Frio' },
  { value: 'MORNO', label: '🌤️ Morno' },
  { value: 'QUENTE', label: '🔥 Quente' },
];

const segmentoOptions = [
  { value: 'CONSTRUCAO', label: 'Construção Civil' },
  { value: 'DECORACAO', label: 'Decoração' },
  { value: 'ARQUITETURA', label: 'Arquitetura' },
  { value: 'CONSTRUTORA', label: 'Construtora' },
  { value: 'LOJA_MATERIAIS', label: 'Loja de Materiais' },
  { value: 'OUTROS', label: 'Outros' },
];

const responsavelOptions = [
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MARIA', label: 'Maria' },
  { value: 'CARLOS', label: 'Carlos' },
  { value: 'ANA', label: 'Ana' },
];

// ===========================================
// COMPONENTE PRINCIPAL
// ===========================================
export default function LeadFormPage() {
  const [lead, setLead] = useState({
    id: '',
    nome: '',
    empresa: '',
    cargo: '',
    email: '',
    telefone: '',
    celular: '',
    origem: '',
    temperatura: 'MORNO',
    status: 'NOVO',
    segmento: '',
    valorEstimado: 0,
    responsavel: '',
    dataCadastro: new Date().toISOString().split('T')[0],
    dataUltimoContato: '',
    proximoContato: '',
    observacoes: '',
    tags: [],
  });

  const [atividades, setAtividades] = useState([
    { id: 1, data: '2025-12-15', tipo: 'LIGACAO', descricao: 'Primeiro contato realizado', usuario: 'Junior' },
    { id: 2, data: '2025-12-16', tipo: 'EMAIL', descricao: 'Enviado material de apresentação', usuario: 'Junior' },
  ]);

  const [novaTag, setNovaTag] = useState('');

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const adicionarTag = () => {
    if (novaTag.trim() && !lead.tags.includes(novaTag.trim())) {
      setLead({ ...lead, tags: [...lead.tags, novaTag.trim()] });
      setNovaTag('');
    }
  };

  const removerTag = (tag) => {
    setLead({ ...lead, tags: lead.tags.filter(t => t !== tag) });
  };

  const menuItems = [
    { icon: Icons.save, label: 'Salvar', variant: 'success' },
    { icon: Icons.target, label: 'Converter em Oportunidade', variant: 'success' },
    { type: 'separator' },
    { icon: Icons.phone, label: 'Registrar Ligação' },
    { icon: Icons.mail, label: 'Enviar Email' },
    { icon: Icons.whatsapp, label: 'WhatsApp' },
    { type: 'separator' },
    { icon: Icons.trash, label: 'Excluir Lead', variant: 'danger' },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      NOVO: 'bg-blue-100 text-blue-700',
      CONTATADO: 'bg-yellow-100 text-yellow-700',
      QUALIFICADO: 'bg-purple-100 text-purple-700',
      PROPOSTA: 'bg-orange-100 text-orange-700',
      CONVERTIDO: 'bg-green-100 text-green-700',
      PERDIDO: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.NOVO;
  };

  const getTemperaturaBadge = (temp) => {
    const styles = {
      FRIO: 'bg-blue-100 text-blue-700',
      MORNO: 'bg-yellow-100 text-yellow-700',
      QUENTE: 'bg-red-100 text-red-700',
    };
    return styles[temp] || styles.MORNO;
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
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white">
                {Icons.userPlus}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {lead.id ? `Lead #${lead.id}` : 'Novo Lead'}
                </h1>
                <p className="text-sm text-gray-500">Gestão de prospect</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTemperaturaBadge(lead.temperatura)}`}>
                {temperaturaOptions.find(t => t.value === lead.temperatura)?.label}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(lead.status)}`}>
                {statusOptions.find(s => s.value === lead.status)?.label}
              </span>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                {Icons.save}
                <span>Salvar</span>
              </button>
              <DropdownMenu items={menuItems} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Coluna Principal */}
          <div className="col-span-2 space-y-6">
            {/* Dados do Lead */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados do Lead</h2>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nome Completo *</label>
                  <input 
                    type="text" 
                    value={lead.nome}
                    onChange={(e) => setLead({...lead, nome: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                    placeholder="Nome do lead"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Empresa</label>
                  <input 
                    type="text" 
                    value={lead.empresa}
                    onChange={(e) => setLead({...lead, empresa: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                    placeholder="Nome da empresa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Cargo</label>
                  <input 
                    type="text" 
                    value={lead.cargo}
                    onChange={(e) => setLead({...lead, cargo: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                    placeholder="Cargo"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Segmento</label>
                  <SelectDropdown
                    value={lead.segmento}
                    onChange={(val) => setLead({...lead, segmento: val})}
                    options={segmentoOptions}
                    placeholder="Selecione..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Valor Estimado</label>
                  <input 
                    type="text" 
                    value={formatMoney(lead.valorEstimado)}
                    onChange={(e) => {
                      const nums = e.target.value.replace(/\D/g, '');
                      setLead({...lead, valorEstimado: parseFloat(nums) / 100 || 0});
                    }}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right"
                  />
                </div>
              </div>

              {/* Contato */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Informações de Contato</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">E-mail</label>
                    <input 
                      type="email" 
                      value={lead.email}
                      onChange={(e) => setLead({...lead, email: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      placeholder="email@empresa.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Telefone</label>
                    <input 
                      type="text" 
                      value={lead.telefone}
                      onChange={(e) => setLead({...lead, telefone: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      placeholder="(00) 0000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Celular / WhatsApp</label>
                    <input 
                      type="text" 
                      value={lead.celular}
                      onChange={(e) => setLead({...lead, celular: e.target.value})}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {lead.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center gap-1"
                    >
                      {tag}
                      <button 
                        onClick={() => removerTag(tag)}
                        className="hover:text-indigo-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={novaTag}
                    onChange={(e) => setNovaTag(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && adicionarTag()}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                    placeholder="Adicionar tag..."
                  />
                  <button 
                    onClick={adicionarTag}
                    className="px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-sm hover:bg-indigo-200"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>

            {/* Histórico de Atividades */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Histórico de Atividades</h2>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-sm hover:bg-indigo-200">
                  {Icons.plus}
                  <span>Nova Atividade</span>
                </button>
              </div>

              <div className="space-y-4">
                {atividades.map((atividade) => (
                  <div key={atividade.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                      {atividade.tipo === 'LIGACAO' && Icons.phone}
                      {atividade.tipo === 'EMAIL' && Icons.mail}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800">{atividade.descricao}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(atividade.data).toLocaleDateString('pt-BR')} • {atividade.usuario}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Qualificação */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Qualificação</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Status</label>
                  <SelectDropdown
                    value={lead.status}
                    onChange={(val) => setLead({...lead, status: val})}
                    options={statusOptions}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Temperatura</label>
                  <SelectDropdown
                    value={lead.temperatura}
                    onChange={(val) => setLead({...lead, temperatura: val})}
                    options={temperaturaOptions}
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Origem</label>
                  <SelectDropdown
                    value={lead.origem}
                    onChange={(val) => setLead({...lead, origem: val})}
                    options={origemOptions}
                    placeholder="De onde veio?"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Responsável</label>
                  <SelectDropdown
                    value={lead.responsavel}
                    onChange={(val) => setLead({...lead, responsavel: val})}
                    options={responsavelOptions}
                    placeholder="Selecione..."
                  />
                </div>
              </div>
            </div>

            {/* Datas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                {Icons.calendar}
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Datas</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Data Cadastro</label>
                  <input 
                    type="date" 
                    value={lead.dataCadastro}
                    readOnly
                    className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Último Contato</label>
                  <input 
                    type="date" 
                    value={lead.dataUltimoContato}
                    onChange={(e) => setLead({...lead, dataUltimoContato: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Próximo Contato</label>
                  <input 
                    type="date" 
                    value={lead.proximoContato}
                    onChange={(e) => setLead({...lead, proximoContato: e.target.value})}
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Ações Rápidas</h2>
              
              <div className="space-y-2">
                <button className="w-full py-2 px-3 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 flex items-center justify-center gap-2">
                  {Icons.whatsapp}
                  WhatsApp
                </button>
                <button className="w-full py-2 px-3 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 flex items-center justify-center gap-2">
                  {Icons.mail}
                  Enviar Email
                </button>
                <button className="w-full py-2 px-3 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 flex items-center justify-center gap-2">
                  {Icons.phone}
                  Ligar
                </button>
              </div>
            </div>

            {/* Observações */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações</h2>
              <textarea
                value={lead.observacoes}
                onChange={(e) => setLead({...lead, observacoes: e.target.value})}
                placeholder="Anotações sobre o lead..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
