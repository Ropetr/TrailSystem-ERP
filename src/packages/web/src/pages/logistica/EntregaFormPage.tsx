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
  truck: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 5h8m-4-9v18m-7-4h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  printer: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
  mapPin: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  phone: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
  whatsapp: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  clock: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  package: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
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
  { value: 'AGENDADA', label: 'Agendada' },
  { value: 'EM_ROTA', label: 'Em Rota' },
  { value: 'ENTREGUE', label: 'Entregue' },
  { value: 'PARCIAL', label: 'Entrega Parcial' },
  { value: 'RECUSADA', label: 'Recusada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

const veiculoOptions = [
  { value: 'CAMINHAO_01', label: 'Caminhão 01 - ABC-1234' },
  { value: 'CAMINHAO_02', label: 'Caminhão 02 - DEF-5678' },
  { value: 'VAN_01', label: 'Van 01 - GHI-9012' },
  { value: 'MOTO_01', label: 'Moto 01 - JKL-3456' },
];

const motoristaOptions = [
  { value: 'PEDRO', label: 'Pedro Almeida' },
  { value: 'LUCAS', label: 'Lucas Ferreira' },
  { value: 'MARCOS', label: 'Marcos Silva' },
];

const tipoFreteOptions = [
  { value: 'CIF', label: 'CIF (Frete incluso)' },
  { value: 'FOB', label: 'FOB (Cliente paga)' },
  { value: 'TERCEIRO', label: 'Transportadora Terceira' },
];

// ===========================================
// DADOS MOCK
// ===========================================
const itensMock = [
  { id: 1, codigo: '7890000010696', descricao: 'PLACA DE GESSO STANDARD 1200x1800x12.5MM', unidade: 'UN', quantidade: 50, entregue: 0 },
  { id: 2, codigo: '7890000016209', descricao: 'PERFIL MONTANTE 48x30x3000MM', unidade: 'UN', quantidade: 100, entregue: 0 },
  { id: 3, codigo: '7892261535758', descricao: 'PARAFUSO DRYWALL PH 3,5x25MM (CX 1000)', unidade: 'CX', quantidade: 10, entregue: 0 },
];

// ===========================================
// COMPONENTE PRINCIPAL
// ===========================================
export default function EntregaFormPage() {
  const [entrega, setEntrega] = useState({
    numero: '',
    vendaOrigem: 'VND-047592',
    dataAgendamento: new Date().toISOString().split('T')[0],
    horarioPrevisto: '08:00',
    horaEntrega: '',
    status: 'AGENDADA',
    tipoFrete: 'CIF',
    veiculo: '',
    motorista: '',
    cliente: {
      nome: 'COMERCIAL R S Z LTDA',
      cpfCnpj: '02.953.009/0001-42',
      telefone: '(43) 3027-1575',
      celular: '(43) 99121-2121',
    },
    endereco: {
      cep: '86010-000',
      logradouro: 'AVENIDA PARANÁ',
      numero: '556',
      complemento: 'LOJA 01',
      bairro: 'CENTRO',
      cidade: 'LONDRINA',
      uf: 'PR',
    },
    observacoes: '',
    observacoesMotorista: '',
  });

  const [itens, setItens] = useState(itensMock);

  const atualizarItemEntregue = (id, valor) => {
    setItens(itens.map(item => 
      item.id === id ? { ...item, entregue: Math.min(parseInt(valor) || 0, item.quantidade) } : item
    ));
  };

  const confirmarTodosItens = () => {
    setItens(itens.map(item => ({ ...item, entregue: item.quantidade })));
  };

  const menuItems = [
    { icon: Icons.save, label: 'Salvar', variant: 'success' },
    { icon: Icons.check, label: 'Confirmar Entrega', variant: 'success' },
    { type: 'separator' },
    { icon: Icons.printer, label: 'Imprimir Romaneio' },
    { icon: Icons.whatsapp, label: 'Enviar Localização' },
    { type: 'separator' },
    { icon: Icons.trash, label: 'Cancelar Entrega', variant: 'danger' },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      AGENDADA: 'bg-blue-100 text-blue-700',
      EM_ROTA: 'bg-yellow-100 text-yellow-700',
      ENTREGUE: 'bg-green-100 text-green-700',
      PARCIAL: 'bg-orange-100 text-orange-700',
      RECUSADA: 'bg-red-100 text-red-700',
      CANCELADA: 'bg-gray-100 text-gray-700',
    };
    return styles[status] || styles.AGENDADA;
  };

  const totalItens = itens.reduce((acc, item) => acc + item.quantidade, 0);
  const totalEntregue = itens.reduce((acc, item) => acc + item.entregue, 0);

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
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center text-white">
                {Icons.truck}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {entrega.numero ? `Entrega #${entrega.numero}` : 'Nova Entrega'}
                </h1>
                <p className="text-sm text-gray-500">Venda #{entrega.vendaOrigem}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(entrega.status)}`}>
                {statusOptions.find(s => s.value === entrega.status)?.label}
              </span>
              <button className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2">
                {Icons.save}
                <span>Salvar</span>
              </button>
              <DropdownMenu items={menuItems} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Dados da Entrega */}
        <div className="grid grid-cols-2 gap-4">
          {/* Agendamento */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              {Icons.clock}
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Agendamento</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Data Agendada</label>
                <input 
                  type="date" 
                  value={entrega.dataAgendamento}
                  onChange={(e) => setEntrega({...entrega, dataAgendamento: e.target.value})}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Horário Previsto</label>
                <input 
                  type="time" 
                  value={entrega.horarioPrevisto}
                  onChange={(e) => setEntrega({...entrega, horarioPrevisto: e.target.value})}
                  className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Veículo</label>
                <SelectDropdown
                  value={entrega.veiculo}
                  onChange={(val) => setEntrega({...entrega, veiculo: val})}
                  options={veiculoOptions}
                  placeholder="Selecione..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Motorista</label>
                <SelectDropdown
                  value={entrega.motorista}
                  onChange={(val) => setEntrega({...entrega, motorista: val})}
                  options={motoristaOptions}
                  placeholder="Selecione..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tipo de Frete</label>
                <SelectDropdown
                  value={entrega.tipoFrete}
                  onChange={(val) => setEntrega({...entrega, tipoFrete: val})}
                  options={tipoFreteOptions}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Status</label>
                <SelectDropdown
                  value={entrega.status}
                  onChange={(val) => setEntrega({...entrega, status: val})}
                  options={statusOptions}
                />
              </div>
            </div>
          </div>

          {/* Cliente e Endereço */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              {Icons.mapPin}
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Destino</h2>
            </div>
            
            {/* Cliente */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-800">{entrega.cliente.nome}</span>
                <span className="text-xs font-mono text-gray-500">{entrega.cliente.cpfCnpj}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="text-gray-400">{Icons.phone}</span>
                  {entrega.cliente.telefone}
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-green-500">{Icons.whatsapp}</span>
                  {entrega.cliente.celular}
                </span>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-gray-400 mt-0.5">{Icons.mapPin}</span>
                <div>
                  <p className="text-gray-800 font-medium">
                    {entrega.endereco.logradouro}, {entrega.endereco.numero}
                    {entrega.endereco.complemento && ` - ${entrega.endereco.complemento}`}
                  </p>
                  <p className="text-gray-600">
                    {entrega.endereco.bairro} - {entrega.endereco.cidade}/{entrega.endereco.uf}
                  </p>
                  <p className="text-gray-500 font-mono">CEP: {entrega.endereco.cep}</p>
                </div>
              </div>
            </div>

            <button className="mt-4 w-full py-2 bg-blue-100 text-blue-600 rounded-lg text-sm hover:bg-blue-200 flex items-center justify-center gap-2">
              {Icons.mapPin}
              Abrir no Maps
            </button>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {Icons.package}
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Itens da Entrega</h2>
            </div>
            <button 
              onClick={confirmarTodosItens}
              className="px-3 py-1.5 bg-green-100 text-green-600 rounded-lg text-sm hover:bg-green-200"
            >
              Confirmar Todos
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Produto</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-16">Un</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-24">Qtde</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-28">Entregue</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itens.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="text-sm font-medium text-gray-800">{item.descricao}</div>
                      <div className="text-xs text-gray-400 font-mono">{item.codigo}</div>
                    </td>
                    <td className="px-3 py-2 text-sm text-gray-600 text-center">{item.unidade}</td>
                    <td className="px-3 py-2 text-sm text-gray-800 text-center font-medium">{item.quantidade}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        value={item.entregue}
                        onChange={(e) => atualizarItemEntregue(item.id, e.target.value)}
                        max={item.quantidade}
                        className="w-20 px-2 py-1 text-center border border-gray-200 rounded-lg text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      {item.entregue === 0 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">Pendente</span>
                      )}
                      {item.entregue > 0 && item.entregue < item.quantidade && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-600 rounded text-xs">Parcial</span>
                      )}
                      {item.entregue === item.quantidade && (
                        <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs">Completo</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Progresso */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progresso da Entrega</span>
              <span className="text-sm font-medium text-gray-800">{totalEntregue} / {totalItens} itens</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-teal-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(totalEntregue / totalItens) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações da Venda</h2>
            <textarea
              value={entrega.observacoes}
              onChange={(e) => setEntrega({...entrega, observacoes: e.target.value})}
              placeholder="Observações gerais..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            />
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações do Motorista</h2>
            <textarea
              value={entrega.observacoesMotorista}
              onChange={(e) => setEntrega({...entrega, observacoesMotorista: e.target.value})}
              placeholder="Observações sobre a entrega..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
