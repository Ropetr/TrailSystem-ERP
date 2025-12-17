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
  switch: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  printer: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
  arrowRight: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>,
  warehouse: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
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
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_TRANSITO', label: 'Em Trânsito' },
  { value: 'RECEBIDO', label: 'Recebido' },
  { value: 'CANCELADO', label: 'Cancelado' },
];

const depositoOptions = [
  { value: 'DEP_MATRIZ', label: 'Depósito Matriz' },
  { value: 'DEP_FILIAL_01', label: 'Depósito Filial 01' },
  { value: 'DEP_FILIAL_02', label: 'Depósito Filial 02' },
  { value: 'DEP_OBRAS', label: 'Depósito Obras' },
  { value: 'DEP_DEVOLUCAO', label: 'Depósito Devolução' },
];

const motivoOptions = [
  { value: 'ABASTECIMENTO', label: 'Abastecimento' },
  { value: 'BALANCEAMENTO', label: 'Balanceamento de Estoque' },
  { value: 'DEVOLUCAO', label: 'Devolução' },
  { value: 'OBRA', label: 'Envio para Obra' },
  { value: 'OUTROS', label: 'Outros' },
];

const responsavelOptions = [
  { value: 'JOAO', label: 'João Silva' },
  { value: 'MARIA', label: 'Maria Santos' },
  { value: 'CARLOS', label: 'Carlos Oliveira' },
];

// ===========================================
// DADOS MOCK
// ===========================================
const itensMock = [
  { id: 1, codigo: '7890000010696', descricao: 'PLACA DE GESSO STANDARD 1200x1800x12.5MM', unidade: 'UN', saldoOrigem: 1500, quantidade: 200 },
  { id: 2, codigo: '7890000016209', descricao: 'PERFIL MONTANTE 48x30x3000MM', unidade: 'UN', saldoOrigem: 800, quantidade: 100 },
  { id: 3, codigo: '7892261535758', descricao: 'PARAFUSO DRYWALL PH 3,5x25MM (CX 1000)', unidade: 'CX', saldoOrigem: 250, quantidade: 30 },
];

// ===========================================
// COMPONENTE PRINCIPAL
// ===========================================
export default function TransferenciaFormPage() {
  const [transferencia, setTransferencia] = useState({
    numero: '',
    data: new Date().toISOString().split('T')[0],
    depositoOrigem: 'DEP_MATRIZ',
    depositoDestino: '',
    motivo: 'ABASTECIMENTO',
    responsavel: 'JOAO',
    status: 'RASCUNHO',
    observacoes: '',
  });

  const [itens, setItens] = useState(itensMock);
  const [buscaProduto, setBuscaProduto] = useState('');

  const removerItem = (id) => {
    setItens(itens.filter(item => item.id !== id));
  };

  const atualizarItem = (id, campo, valor) => {
    setItens(itens.map(item => 
      item.id === id ? { ...item, [campo]: valor } : item
    ));
  };

  const totalItens = itens.reduce((acc, item) => acc + item.quantidade, 0);

  const inverterDepositos = () => {
    setTransferencia({
      ...transferencia,
      depositoOrigem: transferencia.depositoDestino,
      depositoDestino: transferencia.depositoOrigem,
    });
  };

  const menuItems = [
    { icon: Icons.save, label: 'Salvar', variant: 'success' },
    { icon: Icons.check, label: 'Confirmar Transferência', variant: 'success' },
    { type: 'separator' },
    { icon: Icons.printer, label: 'Imprimir Romaneio' },
    { type: 'separator' },
    { icon: Icons.trash, label: 'Cancelar', variant: 'danger' },
  ];

  const getStatusBadge = (status) => {
    const styles = {
      RASCUNHO: 'bg-gray-100 text-gray-700',
      PENDENTE: 'bg-yellow-100 text-yellow-700',
      EM_TRANSITO: 'bg-blue-100 text-blue-700',
      RECEBIDO: 'bg-green-100 text-green-700',
      CANCELADO: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.RASCUNHO;
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
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center text-white">
                {Icons.switch}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {transferencia.numero ? `Transferência #${transferencia.numero}` : 'Nova Transferência'}
                </h1>
                <p className="text-sm text-gray-500">Movimentação entre depósitos</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(transferencia.status)}`}>
                {statusOptions.find(s => s.value === transferencia.status)?.label}
              </span>
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2">
                {Icons.save}
                <span>Salvar</span>
              </button>
              <DropdownMenu items={menuItems} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Dados da Transferência */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados da Transferência</h2>
          
          <div className="grid grid-cols-5 gap-3 mb-6">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Número</label>
              <input 
                type="text" 
                value={transferencia.numero}
                readOnly
                placeholder="Automático"
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data</label>
              <input 
                type="date" 
                value={transferencia.data}
                onChange={(e) => setTransferencia({...transferencia, data: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Motivo</label>
              <SelectDropdown
                value={transferencia.motivo}
                onChange={(val) => setTransferencia({...transferencia, motivo: val})}
                options={motivoOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Responsável</label>
              <SelectDropdown
                value={transferencia.responsavel}
                onChange={(val) => setTransferencia({...transferencia, responsavel: val})}
                options={responsavelOptions}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <SelectDropdown
                value={transferencia.status}
                onChange={(val) => setTransferencia({...transferencia, status: val})}
                options={statusOptions}
              />
            </div>
          </div>

          {/* Origem → Destino */}
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-blue-600">{Icons.warehouse}</span>
                <span className="text-sm font-semibold text-blue-700">ORIGEM</span>
              </div>
              <SelectDropdown
                value={transferencia.depositoOrigem}
                onChange={(val) => setTransferencia({...transferencia, depositoOrigem: val})}
                options={depositoOptions.filter(d => d.value !== transferencia.depositoDestino)}
                placeholder="Selecione o depósito de origem"
              />
            </div>

            <button 
              onClick={inverterDepositos}
              className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-gray-600"
              title="Inverter depósitos"
            >
              {Icons.arrowRight}
            </button>

            <div className="flex-1 bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-green-600">{Icons.warehouse}</span>
                <span className="text-sm font-semibold text-green-700">DESTINO</span>
              </div>
              <SelectDropdown
                value={transferencia.depositoDestino}
                onChange={(val) => setTransferencia({...transferencia, depositoDestino: val})}
                options={depositoOptions.filter(d => d.value !== transferencia.depositoOrigem)}
                placeholder="Selecione o depósito de destino"
              />
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Itens para Transferência</h2>
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
              <button className="flex items-center gap-1 px-3 py-2 bg-orange-100 text-orange-600 rounded-lg text-sm hover:bg-orange-200">
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
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-28">Saldo Origem</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-28">Qtde Transf.</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-16">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itens.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm font-mono text-gray-600">{item.codigo}</td>
                    <td className="px-3 py-2 text-sm text-gray-800">{item.descricao}</td>
                    <td className="px-3 py-2 text-sm text-gray-600 text-center">{item.unidade}</td>
                    <td className="px-3 py-2 text-sm text-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                        {item.saldoOrigem}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        value={item.quantidade}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          if (val <= item.saldoOrigem) {
                            atualizarItem(item.id, 'quantidade', val);
                          }
                        }}
                        max={item.saldoOrigem}
                        className={`w-24 px-2 py-1 text-center border rounded-lg text-sm ${
                          item.quantidade > item.saldoOrigem 
                            ? 'border-red-500 bg-red-50' 
                            : 'border-gray-200'
                        }`}
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

          {/* Resumo */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{itens.length}</span> produto(s) selecionado(s)
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Total de itens a transferir: </span>
              <span className="font-bold text-orange-600 text-lg">{totalItens}</span>
            </div>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações</h2>
          <textarea
            value={transferencia.observacoes}
            onChange={(e) => setTransferencia({...transferencia, observacoes: e.target.value})}
            placeholder="Observações sobre a transferência..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
          />
        </div>
      </main>
    </div>
  );
}
