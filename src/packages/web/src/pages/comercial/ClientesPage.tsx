import React, { useState } from 'react';

// =============================================
// PLANAC ERP - Módulo Clientes
// Padrão: Lista + Botão [+] vermelho + Modal Popup
// =============================================

// Tipagens
interface Cliente {
  id: string;
  codigo: string;
  tipo: 'PF' | 'PJ';
  cpf_cnpj: string;
  razao_social: string;
  nome_fantasia: string | null;
  email: string | null;
  telefone: string | null;
  celular: string | null;
  cidade: string;
  uf: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  contribuinte_icms: 'contribuinte' | 'nao_contribuinte' | 'isento';
  saldo_devedor: number;
}

interface SelectOption {
  value: string;
  label: string;
}

interface SmartSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface SelectDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

interface ClienteCardProps {
  cliente: Cliente;
  onEdit: () => void;
  onWhatsApp: () => void;
}

interface ClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente?: Cliente | null;
}

interface ClienteAvatarProps {
  tipo: 'PF' | 'PJ';
  contribuinte_icms: string;
}

interface StatusBadgeProps {
  status: 'ativo' | 'inativo' | 'bloqueado';
}

// Ícones
const Icons = {
  plus: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  x: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  phone: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  mail: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  mapPin: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  whatsapp: <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  edit: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  lock: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  unlock: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  loader: <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
};

// Ícones dos Avatares - Linha vermelha, sem fundo
const AvatarIcons = {
  pessoaFisica: (
    <svg className="w-6 h-6" fill="none" stroke="#ef4444" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  ),
  pjContribuinte: (
    <svg className="w-6 h-6" fill="none" stroke="#ef4444" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
    </svg>
  ),
  pjNaoContribuinte: (
    <svg className="w-6 h-6" fill="none" stroke="#ef4444" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 2l4 4m0-4l-4 4" />
    </svg>
  ),
};

// =============================================
// COMPONENTE ESTRUTURAL: BUSCA INTELIGENTE
// Reutilizável em todo o sistema ERP
// =============================================
export function SmartSearch({ value, onChange, placeholder = "Buscar...", className = "" }: SmartSearchProps) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        {Icons.search}
      </span>
      <input 
        type="text" 
        placeholder={placeholder}
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-colors" 
      />
      {value && (
        <button 
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {Icons.x}
        </button>
      )}
    </div>
  );
}

// Função de busca inteligente - Exportável
export const smartSearchMatch = (textToSearch: string, searchTerms: string): boolean => {
  const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
  };

  const normalizedText = normalizeText(textToSearch);
  const terms = searchTerms.trim().split(/\s+/).filter(t => t.length > 0);
  
  if (terms.length === 0) return true;
  
  return terms.every(term => {
    const normalizedTerm = normalizeText(term);
    return normalizedText.includes(normalizedTerm);
  });
};

// DADOS MOCK
const clientesMock: Cliente[] = [
  { id: '1', codigo: '000001', tipo: 'PJ', cpf_cnpj: '02.953.009/0001-42', razao_social: 'COMERCIAL R S Z LTDA', nome_fantasia: 'RSZ Materiais', email: 'contato@rsz.com.br', telefone: '(43) 3027-1575', celular: '(43) 99121-2121', cidade: 'Londrina', uf: 'PR', status: 'ativo', contribuinte_icms: 'contribuinte', saldo_devedor: 12500 },
  { id: '2', codigo: '000002', tipo: 'PJ', cpf_cnpj: '07.526.557/0116-59', razao_social: 'AMBEV S.A.', nome_fantasia: 'Filial Manaus', email: 'opobrigaces@ambev.com.br', telefone: '(19) 3313-5680', celular: null, cidade: 'Manaus', uf: 'AM', status: 'ativo', contribuinte_icms: 'contribuinte', saldo_devedor: 0 },
  { id: '3', codigo: '000003', tipo: 'PJ', cpf_cnpj: '12.345.678/0001-90', razao_social: 'CONSTRUTORA HORIZONTE LTDA', nome_fantasia: 'Horizonte Construções', email: 'financeiro@horizonte.com.br', telefone: '(44) 3226-8800', celular: '(44) 99988-7766', cidade: 'Maringá', uf: 'PR', status: 'bloqueado', contribuinte_icms: 'contribuinte', saldo_devedor: 45000 },
  { id: '4', codigo: '000004', tipo: 'PF', cpf_cnpj: '123.456.789-00', razao_social: 'JOÃO SILVA SANTOS', nome_fantasia: null, email: 'joao.santos@email.com', telefone: null, celular: '(44) 99123-4567', cidade: 'Maringá', uf: 'PR', status: 'ativo', contribuinte_icms: 'nao_contribuinte', saldo_devedor: 0 },
  { id: '5', codigo: '000005', tipo: 'PJ', cpf_cnpj: '98.765.432/0001-10', razao_social: 'DECORAÇÕES INTERIORES ME', nome_fantasia: 'Decor Plus', email: 'contato@decorplus.com.br', telefone: '(44) 3030-4040', celular: '(44) 99777-8888', cidade: 'Curitiba', uf: 'PR', status: 'ativo', contribuinte_icms: 'nao_contribuinte', saldo_devedor: 3200 },
];

// Badge de Status
function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = { 
    ativo: 'bg-green-100 text-green-700', 
    inativo: 'bg-gray-100 text-gray-600', 
    bloqueado: 'bg-red-100 text-red-700' 
  };
  const labels: Record<string, string> = { 
    ativo: 'Ativo', 
    inativo: 'Inativo', 
    bloqueado: 'Bloqueado' 
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
}

// Avatar do Cliente
function ClienteAvatar({ tipo, contribuinte_icms }: ClienteAvatarProps) {
  let icon;
  let title;
  
  if (tipo === 'PF') {
    icon = AvatarIcons.pessoaFisica;
    title = 'Pessoa Física';
  } else if (contribuinte_icms === 'contribuinte') {
    icon = AvatarIcons.pjContribuinte;
    title = 'PJ Contribuinte';
  } else {
    icon = AvatarIcons.pjNaoContribuinte;
    title = 'PJ Não Contribuinte';
  }
  
  return (
    <div 
      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 hover:border-red-300 transition-colors"
      title={title}
    >
      {icon}
    </div>
  );
}

// Card do Cliente
function ClienteCard({ cliente, onEdit, onWhatsApp }: ClienteCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <ClienteAvatar tipo={cliente.tipo} contribuinte_icms={cliente.contribuinte_icms} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xs font-mono text-gray-400">#{cliente.codigo}</span>
              <StatusBadge status={cliente.status} />
              {cliente.tipo === 'PJ' && cliente.contribuinte_icms === 'contribuinte' && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">Contribuinte</span>
              )}
              {cliente.tipo === 'PF' && (
                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs font-medium">Pessoa Física</span>
              )}
            </div>
            <h3 className="font-semibold text-gray-800 truncate">{cliente.razao_social}</h3>
            {cliente.nome_fantasia && <p className="text-sm text-gray-500 truncate">{cliente.nome_fantasia}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="font-mono">{cliente.cpf_cnpj}</span>
              <span className="flex items-center gap-1">{Icons.mapPin}{cliente.cidade}/{cliente.uf}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {cliente.celular && <button onClick={onWhatsApp} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="WhatsApp">{Icons.whatsapp}</button>}
            {cliente.email && <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="E-mail">{Icons.mail}</button>}
          </div>
          
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">{Icons.dots}</button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-40 z-50">
                  <button onClick={() => { onEdit(); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">{Icons.edit}<span>Editar</span></button>
                  {cliente.status === 'bloqueado' ? (
                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50">{Icons.unlock}<span>Desbloquear</span></button>
                  ) : (
                    <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50">{Icons.lock}<span>Bloquear</span></button>
                  )}
                  <div className="border-t border-gray-100 my-1" />
                  <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">{Icons.trash}<span>Excluir</span></button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {cliente.saldo_devedor > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
          <span className="text-gray-500">Saldo devedor:</span>
          <span className="font-semibold text-red-600">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cliente.saldo_devedor)}</span>
        </div>
      )}
    </div>
  );
}

// Select Dropdown
function SelectDropdown({ value, onChange, options, placeholder = 'Selecione...', className = '' }: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);
  
  return (
    <div className={`relative ${className}`}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)} 
        className={`w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between hover:border-gray-300 transition-colors ${isOpen ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}
      >
        <span className={selectedOption ? 'text-gray-800' : 'text-gray-400'}>{selectedOption?.label || placeholder}</span>
        {Icons.chevronDown}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 max-h-60 overflow-auto">
            {options.map((option) => (
              <button 
                key={option.value} 
                onClick={() => { onChange(option.value); setIsOpen(false); }} 
                className={`w-full px-4 py-2 text-sm text-left flex items-center justify-between transition-colors ${option.value === value ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                <span>{option.label}</span>
                {option.value === value && Icons.check}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Modal Popup - Novo/Editar Cliente
function ClienteModal({ isOpen, onClose, cliente = null }: ClienteModalProps) {
  const [activeTab, setActiveTab] = useState('dados');
  const [consultandoCNPJ, setConsultandoCNPJ] = useState(false);
  const [formData, setFormData] = useState({
    tipo: 'PJ' as 'PF' | 'PJ',
    cpf_cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    inscricao_estadual: '',
    contribuinte_icms: 'nao_contribuinte',
    email: '',
    telefone: '',
    celular: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    uf: '',
  });

  const tabs = [
    { id: 'dados', label: 'Dados Gerais' },
    { id: 'enderecos', label: 'Endereços' },
    { id: 'contatos', label: 'Contatos' },
    { id: 'comercial', label: 'Comercial' },
  ];

  const consultarCNPJ = () => {
    if (!formData.cpf_cnpj) return;
    setConsultandoCNPJ(true);
    setTimeout(() => {
      setFormData(prev => ({ 
        ...prev, 
        razao_social: 'EMPRESA CONSULTADA VIA CNPJá LTDA', 
        nome_fantasia: 'Empresa Teste', 
        inscricao_estadual: '123456789', 
        contribuinte_icms: 'contribuinte', 
        cep: '87020-000', 
        logradouro: 'Avenida Brasil', 
        numero: '1000', 
        bairro: 'Centro', 
        cidade: 'Maringá', 
        uf: 'PR',
        email: 'contato@empresa.com.br',
        telefone: '(44) 3030-3030',
      }));
      setConsultandoCNPJ(false);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          
          {/* Header do Modal */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-red-500 to-red-600">
            <div>
              <h2 className="text-xl font-bold text-white">{cliente ? 'Editar Cliente' : 'Novo Cliente'}</h2>
              <p className="text-sm text-red-100">{cliente ? `#${cliente.codigo}` : 'Preencha os dados para cadastrar'}</p>
            </div>
            <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors">{Icons.x}</button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-6 bg-gray-50">
            {tabs.map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === tab.id ? 'border-red-500 text-red-600 bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
            {activeTab === 'dados' && (
              <div className="space-y-6">
                {/* Tipo Pessoa */}
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="tipo" value="PJ" checked={formData.tipo === 'PJ'} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'PF' | 'PJ' })} className="w-4 h-4 text-red-500 focus:ring-red-500" />
                    <span className="text-sm font-medium text-gray-700">Pessoa Jurídica</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="tipo" value="PF" checked={formData.tipo === 'PF'} onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'PF' | 'PJ' })} className="w-4 h-4 text-red-500 focus:ring-red-500" />
                    <span className="text-sm font-medium text-gray-700">Pessoa Física</span>
                  </label>
                </div>
                
                {/* CNPJ + Botão Consultar */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{formData.tipo === 'PJ' ? 'CNPJ *' : 'CPF *'}</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={formData.cpf_cnpj} 
                        onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })} 
                        placeholder={formData.tipo === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'} 
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                      />
                      {formData.tipo === 'PJ' && (
                        <button 
                          onClick={consultarCNPJ} 
                          disabled={consultandoCNPJ} 
                          className="px-5 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                        >
                          {consultandoCNPJ ? Icons.loader : Icons.search}
                          <span>{consultandoCNPJ ? 'Consultando...' : 'Consultar'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contribuinte ICMS</label>
                    <SelectDropdown 
                      value={formData.contribuinte_icms} 
                      onChange={(val) => setFormData({ ...formData, contribuinte_icms: val })} 
                      options={[
                        { value: 'contribuinte', label: 'Contribuinte' }, 
                        { value: 'nao_contribuinte', label: 'Não Contribuinte' }, 
                        { value: 'isento', label: 'Isento' }
                      ]} 
                    />
                  </div>
                </div>
                
                {/* Razão Social / Nome Fantasia */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{formData.tipo === 'PJ' ? 'Razão Social *' : 'Nome Completo *'}</label>
                    <input 
                      type="text" 
                      value={formData.razao_social} 
                      onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })} 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                    />
                  </div>
                  {formData.tipo === 'PJ' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                      <input 
                        type="text" 
                        value={formData.nome_fantasia} 
                        onChange={(e) => setFormData({ ...formData, nome_fantasia: e.target.value })} 
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                      />
                    </div>
                  )}
                </div>

                {/* IE */}
                {formData.tipo === 'PJ' && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
                      <input 
                        type="text" 
                        value={formData.inscricao_estadual} 
                        onChange={(e) => setFormData({ ...formData, inscricao_estadual: e.target.value })} 
                        placeholder="ISENTO ou número" 
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                      />
                    </div>
                  </div>
                )}
                
                {/* Contato */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <input 
                      type="email" 
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input 
                      type="text" 
                      value={formData.telefone} 
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })} 
                      placeholder="(00) 0000-0000" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Celular / WhatsApp</label>
                    <input 
                      type="text" 
                      value={formData.celular} 
                      onChange={(e) => setFormData({ ...formData, celular: e.target.value })} 
                      placeholder="(00) 00000-0000" 
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" 
                    />
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'enderecos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">Endereços do cliente</p>
                  <button className="text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors">
                    <span className="text-xl leading-none">+</span><span>Novo Endereço</span>
                  </button>
                </div>
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">✓ Principal</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Entrega</span>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    <div><label className="block text-xs text-gray-500 mb-1">CEP</label><input type="text" value={formData.cep} onChange={(e) => setFormData({ ...formData, cep: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                    <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Logradouro</label><input type="text" value={formData.logradouro} onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Número</label><input type="text" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Bairro</label><input type="text" value={formData.bairro} onChange={(e) => setFormData({ ...formData, bairro: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Cidade</label><input type="text" value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">UF</label><input type="text" value={formData.uf} onChange={(e) => setFormData({ ...formData, uf: e.target.value })} maxLength={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" /></div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'contatos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">Contatos do cliente</p>
                  <button className="text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors">
                    <span className="text-xl leading-none">+</span><span>Novo Contato</span>
                  </button>
                </div>
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-800">Maria Silva</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Financeiro</span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">✓ Principal</span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                    <span className="flex items-center gap-1">{Icons.mail} maria@empresa.com.br</span>
                    <span className="flex items-center gap-1">{Icons.phone} (44) 3226-8800</span>
                    <span className="flex items-center gap-1 text-green-600">{Icons.whatsapp} (44) 99988-7766</span>
                  </div>
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Recebe notificações:</p>
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" defaultChecked className="w-3.5 h-3.5 text-red-500 rounded" /><span>Boletos</span></label>
                      <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" defaultChecked className="w-3.5 h-3.5 text-red-500 rounded" /><span>NF-e</span></label>
                      <label className="flex items-center gap-1.5 text-xs"><input type="checkbox" className="w-3.5 h-3.5 text-red-500 rounded" /><span>Orçamentos</span></label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'comercial' && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendedor</label>
                    <SelectDropdown value="" onChange={() => {}} options={[{ value: '1', label: 'Carlos Silva' }, { value: '2', label: 'Maria Santos' }]} placeholder="Selecione..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tabela de Preço</label>
                    <SelectDropdown value="" onChange={() => {}} options={[{ value: '1', label: 'Tabela Padrão' }, { value: '2', label: 'Atacado' }]} placeholder="Selecione..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cond. Pagamento</label>
                    <SelectDropdown value="" onChange={() => {}} options={[{ value: '1', label: 'À Vista' }, { value: '2', label: '30/60/90' }]} placeholder="Selecione..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Limite de Crédito (R$)</label>
                    <input type="number" placeholder="0,00" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desconto Máximo (%)</label>
                    <input type="number" placeholder="0" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20" />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400">* Campos obrigatórios</p>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors">Cancelar</button>
              <button onClick={onClose} className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors shadow-sm">{cliente ? 'Salvar' : 'Cadastrar'}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// COMPONENTE PRINCIPAL - CLIENTES PAGE
// =============================================
export default function ClientesPage() {
  const [clientes] = useState<Cliente[]>(clientesMock);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);

  const clientesFiltrados = clientes.filter(cliente => {
    const textoCompleto = [
      cliente.razao_social,
      cliente.nome_fantasia,
      cliente.cpf_cnpj,
      cliente.codigo,
      cliente.cidade,
      cliente.uf,
      cliente.email
    ].filter(Boolean).join(' ');
    
    const matchBusca = smartSearchMatch(textoCompleto, busca);
    const matchStatus = filtroStatus === 'todos' || cliente.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Clientes</h1>
              <p className="text-sm text-gray-500">{clientesFiltrados.length} registros</p>
            </div>
            
            {/* BOTÃO [+] - APENAS SÍMBOLO VERMELHO */}
            <button 
              onClick={() => { setClienteEditando(null); setModalOpen(true); }} 
              className="w-12 h-12 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center"
              title="Novo Cliente"
            >
              {Icons.plus}
            </button>
          </div>
        </div>
      </div>
      
      {/* BUSCA E FILTROS */}
      <div className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center gap-3">
            <SmartSearch 
              value={busca} 
              onChange={setBusca} 
              placeholder="Buscar... (ex: londrina rsz, santos joao, 02953)"
              className="flex-1 min-w-64"
            />
            <SelectDropdown 
              value={filtroStatus} 
              onChange={setFiltroStatus} 
              options={[
                { value: 'todos', label: 'Todos Status' }, 
                { value: 'ativo', label: 'Ativos' }, 
                { value: 'bloqueado', label: 'Bloqueados' }
              ]} 
              className="w-40" 
            />
          </div>
        </div>
      </div>
      
      {/* LISTA DE CLIENTES */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid gap-4">
          {clientesFiltrados.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-200">
                {AvatarIcons.pessoaFisica}
              </div>
              <p className="text-gray-600 font-medium">Nenhum cliente encontrado</p>
              <p className="text-sm text-gray-400 mt-1">Ajuste a busca ou cadastre um novo</p>
              <button 
                onClick={() => setModalOpen(true)} 
                className="mt-4 text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1"
              >
                <span className="text-xl leading-none">+</span> Novo Cliente
              </button>
            </div>
          ) : (
            clientesFiltrados.map(cliente => (
              <ClienteCard 
                key={cliente.id} 
                cliente={cliente} 
                onEdit={() => { setClienteEditando(cliente); setModalOpen(true); }} 
                onWhatsApp={() => window.open(`https://wa.me/55${cliente.celular?.replace(/\D/g, '')}`, '_blank')} 
              />
            ))
          )}
        </div>
      </div>
      
      {/* MODAL */}
      <ClienteModal isOpen={modalOpen} onClose={() => setModalOpen(false)} cliente={clienteEditando} />
    </div>
  );
}
