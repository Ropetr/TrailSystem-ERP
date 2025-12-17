import React, { useState, useRef, useEffect } from 'react';

const globalStyles = `
  input:focus, textarea:focus, select:focus {
    outline: none !important;
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important;
  }
`;

const Icons = {
  back: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  save: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  calendar: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  phone: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  mail: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  clock: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  bell: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
};

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
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`w-full px-4 py-2 text-sm text-left flex items-center justify-between transition-colors ${
                option.value === value ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
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
      <button onClick={() => setIsOpen(!isOpen)} className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">
        {Icons.dots}
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-48 z-50">
          {items.map((item, index) => {
            if (item.type === 'separator') return <div key={index} className="border-t border-gray-100 my-2" />;
            return (
              <button key={index} onClick={() => { item.onClick?.(); setIsOpen(false); }} className={getItemClasses(item.variant)}>
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

const tipoOptions = [
  { value: 'LIGACAO', label: 'Ligação' },
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'REUNIAO', label: 'Reunião' },
  { value: 'VISITA', label: 'Visita' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'TAREFA', label: 'Tarefa' },
  { value: 'FOLLOWUP', label: 'Follow-up' },
];

const statusOptions = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'CONCLUIDA', label: 'Concluída' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const prioridadeOptions = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
];

const responsavelOptions = [
  { value: 'JUNIOR', label: 'Junior Silva' },
  { value: 'MARIA', label: 'Maria Santos' },
  { value: 'CARLOS', label: 'Carlos Oliveira' },
];

const lembreteOptions = [
  { value: 'NONE', label: 'Sem lembrete' },
  { value: '15MIN', label: '15 minutos antes' },
  { value: '30MIN', label: '30 minutos antes' },
  { value: '1HORA', label: '1 hora antes' },
  { value: '1DIA', label: '1 dia antes' },
];

export default function AtividadeFormPage() {
  const [atividade, setAtividade] = useState({
    id: '',
    tipo: 'LIGACAO',
    titulo: '',
    descricao: '',
    status: 'PENDENTE',
    prioridade: 'NORMAL',
    responsavel: 'JUNIOR',
    dataInicio: new Date().toISOString().split('T')[0],
    horaInicio: '09:00',
    dataFim: '',
    horaFim: '',
    duracao: 30,
    lembrete: '15MIN',
    cliente: '',
    clienteNome: '',
    lead: '',
    leadNome: '',
    oportunidade: '',
    oportunidadeNome: '',
    resultado: '',
    observacoes: '',
  });

  const [buscaCliente, setBuscaCliente] = useState('');

  const getTipoIcon = (tipo) => {
    switch (tipo) {
      case 'LIGACAO': return Icons.phone;
      case 'EMAIL': return Icons.mail;
      case 'REUNIAO': case 'VISITA': return Icons.users;
      default: return Icons.calendar;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDENTE: 'bg-yellow-100 text-yellow-700',
      EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
      CONCLUIDA: 'bg-green-100 text-green-700',
      CANCELADA: 'bg-gray-100 text-gray-700',
    };
    return styles[status] || styles.PENDENTE;
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

  const menuItems = [
    { icon: Icons.save, label: 'Salvar', variant: 'success' },
    { icon: Icons.check, label: 'Marcar Concluída', variant: 'success' },
    { type: 'separator' },
    { icon: Icons.trash, label: 'Excluir', variant: 'danger' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{globalStyles}</style>
      
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">{Icons.back}</button>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center text-white">
                {getTipoIcon(atividade.tipo)}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {atividade.id ? `Atividade #${atividade.id}` : 'Nova Atividade'}
                </h1>
                <p className="text-sm text-gray-500">{tipoOptions.find(t => t.value === atividade.tipo)?.label}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPrioridadeBadge(atividade.prioridade)}`}>
                {prioridadeOptions.find(p => p.value === atividade.prioridade)?.label}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(atividade.status)}`}>
                {statusOptions.find(s => s.value === atividade.status)?.label}
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

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Dados Principais */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados da Atividade</h2>
          
          <div className="grid grid-cols-4 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo *</label>
              <SelectDropdown value={atividade.tipo} onChange={(val) => setAtividade({...atividade, tipo: val})} options={tipoOptions} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <SelectDropdown value={atividade.status} onChange={(val) => setAtividade({...atividade, status: val})} options={statusOptions} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prioridade</label>
              <SelectDropdown value={atividade.prioridade} onChange={(val) => setAtividade({...atividade, prioridade: val})} options={prioridadeOptions} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Responsável *</label>
              <SelectDropdown value={atividade.responsavel} onChange={(val) => setAtividade({...atividade, responsavel: val})} options={responsavelOptions} />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs text-gray-500 mb-1">Título *</label>
            <input 
              type="text" 
              value={atividade.titulo}
              onChange={(e) => setAtividade({...atividade, titulo: e.target.value})}
              className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              placeholder="Ex: Ligar para cliente sobre proposta"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Descrição</label>
            <textarea
              value={atividade.descricao}
              onChange={(e) => setAtividade({...atividade, descricao: e.target.value})}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              placeholder="Detalhes da atividade..."
            />
          </div>
        </div>

        {/* Data e Hora */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            {Icons.clock}
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Agendamento</h2>
          </div>
          
          <div className="grid grid-cols-5 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data Início *</label>
              <input 
                type="date" 
                value={atividade.dataInicio}
                onChange={(e) => setAtividade({...atividade, dataInicio: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Hora Início</label>
              <input 
                type="time" 
                value={atividade.horaInicio}
                onChange={(e) => setAtividade({...atividade, horaInicio: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Duração (min)</label>
              <input 
                type="number" 
                value={atividade.duracao}
                onChange={(e) => setAtividade({...atividade, duracao: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                min={5}
                step={5}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data Fim</label>
              <input 
                type="date" 
                value={atividade.dataFim}
                onChange={(e) => setAtividade({...atividade, dataFim: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lembrete</label>
              <SelectDropdown value={atividade.lembrete} onChange={(val) => setAtividade({...atividade, lembrete: val})} options={lembreteOptions} />
            </div>
          </div>
        </div>

        {/* Vinculação */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Vinculação</h2>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cliente</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm pr-10"
                  placeholder="Buscar cliente..."
                />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500">
                  {Icons.search}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Lead</label>
              <input 
                type="text" 
                value={atividade.leadNome}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                placeholder="Selecione um lead..."
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Oportunidade</label>
              <input 
                type="text" 
                value={atividade.oportunidadeNome}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                placeholder="Selecione uma oportunidade..."
                readOnly
              />
            </div>
          </div>
        </div>

        {/* Resultado (quando concluída) */}
        {atividade.status === 'CONCLUIDA' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Resultado da Atividade</h2>
            <textarea
              value={atividade.resultado}
              onChange={(e) => setAtividade({...atividade, resultado: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
              placeholder="Descreva o resultado da atividade..."
            />
          </div>
        )}

        {/* Observações */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações</h2>
          <textarea
            value={atividade.observacoes}
            onChange={(e) => setAtividade({...atividade, observacoes: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            placeholder="Observações adicionais..."
          />
        </div>
      </main>
    </div>
  );
}
