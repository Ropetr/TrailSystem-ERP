import { useState, useRef, useEffect } from 'react';

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
  plus: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  calculator: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  copy: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  reverse: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
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

const tipoLancamentoOptions = [
  { value: 'MANUAL', label: 'Manual' },
  { value: 'AUTOMATICO', label: 'Automático' },
  { value: 'IMPORTACAO', label: 'Importação' },
];

const statusOptions = [
  { value: 'RASCUNHO', label: 'Rascunho' },
  { value: 'PENDENTE', label: 'Pendente Aprovação' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'ESTORNADO', label: 'Estornado' },
];

const centroCustoOptions = [
  { value: 'ADMINISTRATIVO', label: 'Administrativo' },
  { value: 'COMERCIAL', label: 'Comercial' },
  { value: 'OPERACIONAL', label: 'Operacional' },
  { value: 'FINANCEIRO', label: 'Financeiro' },
];

// Contas contábeis simplificadas
const contasContabeisOptions = [
  { value: '1.1.1.01', label: '1.1.1.01 - Caixa Geral' },
  { value: '1.1.1.02', label: '1.1.1.02 - Bancos Conta Movimento' },
  { value: '1.1.2.01', label: '1.1.2.01 - Clientes' },
  { value: '1.1.3.01', label: '1.1.3.01 - Estoque de Mercadorias' },
  { value: '2.1.1.01', label: '2.1.1.01 - Fornecedores' },
  { value: '2.1.2.01', label: '2.1.2.01 - Salários a Pagar' },
  { value: '3.1.1.01', label: '3.1.1.01 - Receita de Vendas' },
  { value: '4.1.1.01', label: '4.1.1.01 - CMV' },
  { value: '4.2.1.01', label: '4.2.1.01 - Despesas Administrativas' },
];

export default function LancamentoFormPage() {
  const [lancamento, setLancamento] = useState({
    id: '',
    numero: '',
    tipo: 'MANUAL',
    dataLancamento: new Date().toISOString().split('T')[0],
    dataCompetencia: new Date().toISOString().split('T')[0],
    historico: '',
    documentoOrigem: '',
    status: 'RASCUNHO',
    observacoes: '',
  });

  const [partidas, setPartidas] = useState([
    { id: 1, conta: '', centroCusto: '', debito: 0, credito: 0, historico: '' },
    { id: 2, conta: '', centroCusto: '', debito: 0, credito: 0, historico: '' },
  ]);

  const formatMoney = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const parseMoney = (value) => {
    const nums = value.replace(/\D/g, '');
    return parseFloat(nums) / 100 || 0;
  };

  const totalDebitos = partidas.reduce((acc, p) => acc + p.debito, 0);
  const totalCreditos = partidas.reduce((acc, p) => acc + p.credito, 0);
  const diferenca = totalDebitos - totalCreditos;
  const balanceado = Math.abs(diferenca) < 0.01;

  const adicionarPartida = () => {
    setPartidas([...partidas, { 
      id: Date.now(), 
      conta: '', 
      centroCusto: '', 
      debito: 0, 
      credito: 0, 
      historico: '' 
    }]);
  };

  const removerPartida = (id) => {
    if (partidas.length > 2) {
      setPartidas(partidas.filter(p => p.id !== id));
    }
  };

  const atualizarPartida = (id, campo, valor) => {
    setPartidas(partidas.map(p => p.id === id ? { ...p, [campo]: valor } : p));
  };

  const getStatusBadge = (status) => {
    const styles = {
      RASCUNHO: 'bg-gray-100 text-gray-700',
      PENDENTE: 'bg-yellow-100 text-yellow-700',
      APROVADO: 'bg-green-100 text-green-700',
      ESTORNADO: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.RASCUNHO;
  };

  const menuItems = [
    { icon: Icons.save, label: 'Salvar', variant: 'success' },
    { icon: Icons.check, label: 'Aprovar', variant: 'success' },
    { type: 'separator' },
    { icon: Icons.copy, label: 'Duplicar' },
    { icon: Icons.reverse, label: 'Estornar', variant: 'danger' },
    { type: 'separator' },
    { icon: Icons.trash, label: 'Excluir', variant: 'danger' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{globalStyles}</style>
      
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">{Icons.back}</button>
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white">
                {Icons.calculator}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {lancamento.numero ? `Lançamento #${lancamento.numero}` : 'Novo Lançamento Contábil'}
                </h1>
                <p className="text-sm text-gray-500">{tipoLancamentoOptions.find(t => t.value === lancamento.tipo)?.label}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(lancamento.status)}`}>
                {statusOptions.find(s => s.value === lancamento.status)?.label}
              </span>
              <button 
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  balanceado 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!balanceado}
              >
                {Icons.save}
                <span>Salvar</span>
              </button>
              <DropdownMenu items={menuItems} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Dados do Lançamento */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados do Lançamento</h2>
          
          <div className="grid grid-cols-5 gap-3 mb-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Número</label>
              <input 
                type="text" 
                value={lancamento.numero}
                readOnly
                placeholder="Automático"
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tipo</label>
              <SelectDropdown value={lancamento.tipo} onChange={(val) => setLancamento({...lancamento, tipo: val})} options={tipoLancamentoOptions} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data Lançamento *</label>
              <input 
                type="date" 
                value={lancamento.dataLancamento}
                onChange={(e) => setLancamento({...lancamento, dataLancamento: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Data Competência *</label>
              <input 
                type="date" 
                value={lancamento.dataCompetencia}
                onChange={(e) => setLancamento({...lancamento, dataCompetencia: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Status</label>
              <SelectDropdown value={lancamento.status} onChange={(val) => setLancamento({...lancamento, status: val})} options={statusOptions} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Histórico *</label>
              <input 
                type="text" 
                value={lancamento.historico}
                onChange={(e) => setLancamento({...lancamento, historico: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="Descrição do lançamento..."
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Documento Origem</label>
              <input 
                type="text" 
                value={lancamento.documentoOrigem}
                onChange={(e) => setLancamento({...lancamento, documentoOrigem: e.target.value})}
                className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm"
                placeholder="NF, Recibo, Contrato..."
              />
            </div>
          </div>
        </div>

        {/* Partidas do Lançamento */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Partidas</h2>
            <button
              onClick={adicionarPartida}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-600 rounded-lg text-sm hover:bg-indigo-200"
            >
              {Icons.plus}
              <span>Adicionar Partida</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Conta Contábil</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase w-40">Centro de Custo</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase w-36">Débito</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600 uppercase w-36">Crédito</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Histórico</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase w-16">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partidas.map((partida) => (
                  <tr key={partida.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <SelectDropdown
                        value={partida.conta}
                        onChange={(val) => atualizarPartida(partida.id, 'conta', val)}
                        options={contasContabeisOptions}
                        placeholder="Selecione a conta..."
                      />
                    </td>
                    <td className="px-3 py-2">
                      <SelectDropdown
                        value={partida.centroCusto}
                        onChange={(val) => atualizarPartida(partida.id, 'centroCusto', val)}
                        options={centroCustoOptions}
                        placeholder="Centro..."
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={partida.debito > 0 ? formatMoney(partida.debito) : ''}
                        onChange={(e) => atualizarPartida(partida.id, 'debito', parseMoney(e.target.value))}
                        className="w-full px-2 py-1 text-right border border-gray-200 rounded-lg text-sm text-blue-600 font-medium"
                        placeholder="R$ 0,00"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={partida.credito > 0 ? formatMoney(partida.credito) : ''}
                        onChange={(e) => atualizarPartida(partida.id, 'credito', parseMoney(e.target.value))}
                        className="w-full px-2 py-1 text-right border border-gray-200 rounded-lg text-sm text-red-600 font-medium"
                        placeholder="R$ 0,00"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={partida.historico}
                        onChange={(e) => atualizarPartida(partida.id, 'historico', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-200 rounded-lg text-sm"
                        placeholder="Complemento..."
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button 
                        onClick={() => removerPartida(partida.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        disabled={partidas.length <= 2}
                      >
                        {Icons.trash}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td colSpan={2} className="px-3 py-3 text-right text-sm font-semibold text-gray-700">
                    TOTAIS:
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-bold text-blue-600">{formatMoney(totalDebitos)}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-sm font-bold text-red-600">{formatMoney(totalCreditos)}</span>
                  </td>
                  <td colSpan={2} className="px-3 py-3">
                    <div className={`text-sm font-semibold text-center px-3 py-1 rounded-lg ${
                      balanceado 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {balanceado ? 'BALANCEADO' : `Diferença: ${formatMoney(Math.abs(diferenca))}`}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações</h2>
          <textarea
            value={lancamento.observacoes}
            onChange={(e) => setLancamento({...lancamento, observacoes: e.target.value})}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            placeholder="Observações adicionais..."
          />
        </div>
      </main>
    </div>
  );
}
