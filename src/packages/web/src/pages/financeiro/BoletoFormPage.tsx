import React, { useState, useRef, useEffect } from 'react';

const globalStyles = `input:focus, textarea:focus, select:focus { outline: none !important; border-color: #ef4444 !important; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important; }`;

const Icons = {
  back: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  save: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  document: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  printer: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
  mail: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  whatsapp: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>,
  copy: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  download: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  barcode: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>,
};

function SelectDropdown({ value, onChange, options = [], placeholder = 'Selecione...', disabled = false, className = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const sel = options.find(o => o.value === value);
  return (
    <div className={`relative ${className}`} ref={ref}>
      <button type="button" onClick={() => !disabled && setIsOpen(!isOpen)} disabled={disabled} className={`w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-left flex items-center justify-between transition-colors ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:border-gray-300 cursor-pointer'} ${isOpen ? 'border-red-500 ring-2 ring-red-500/20' : ''}`}>
        <span className={sel ? 'text-gray-800' : 'text-gray-400'}>{sel?.label || placeholder}</span>
        {isOpen ? Icons.chevronUp : Icons.chevronDown}
      </button>
      {isOpen && (<div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 max-h-60 overflow-auto">
        {options.map((o) => (<button key={o.value} onClick={() => { onChange(o.value); setIsOpen(false); }} className={`w-full px-4 py-2 text-sm text-left flex items-center justify-between transition-colors ${o.value === value ? 'bg-red-50 text-red-600 font-medium' : 'text-gray-700 hover:bg-gray-50'}`}><span>{o.label}</span>{o.value === value && Icons.check}</button>))}
      </div>)}
    </div>
  );
}

function DropdownMenu({ items }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h); }, []);
  const cls = (v) => { const b = 'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors'; return v === 'success' ? `${b} text-green-600 hover:bg-green-50` : v === 'danger' ? `${b} text-red-600 hover:bg-red-50` : `${b} text-gray-700 hover:bg-gray-50`; };
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setIsOpen(!isOpen)} className="p-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600">{Icons.dots}</button>
      {isOpen && (<div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2 min-w-48 z-50">
        {items.map((i, idx) => i.type === 'separator' ? <div key={idx} className="border-t border-gray-100 my-2" /> : <button key={idx} onClick={() => { i.onClick?.(); setIsOpen(false); }} className={cls(i.variant)}>{i.icon && <span className="w-5 h-5">{i.icon}</span>}<span>{i.label}</span></button>)}
      </div>)}
    </div>
  );
}

const statusOptions = [{ value: 'PENDENTE', label: 'Pendente' }, { value: 'REGISTRADO', label: 'Registrado' }, { value: 'PAGO', label: 'Pago' }, { value: 'VENCIDO', label: 'Vencido' }, { value: 'CANCELADO', label: 'Cancelado' }];
const bancoOptions = [{ value: '001', label: '001 - Banco do Brasil' }, { value: '104', label: '104 - Caixa Econômica' }, { value: '237', label: '237 - Bradesco' }, { value: '341', label: '341 - Itaú' }, { value: '033', label: '033 - Santander' }, { value: '756', label: '756 - Sicoob' }];
const especieOptions = [{ value: 'DM', label: 'DM - Duplicata Mercantil' }, { value: 'DS', label: 'DS - Duplicata de Serviço' }, { value: 'RC', label: 'RC - Recibo' }, { value: 'NP', label: 'NP - Nota Promissória' }, { value: 'OU', label: 'OU - Outros' }];
const instrucaoOptions = [{ value: 'PROTESTAR', label: 'Protestar após vencimento' }, { value: 'DEVOLVER', label: 'Devolver após vencimento' }, { value: 'NAO_PROTESTAR', label: 'Não protestar' }];

export default function BoletoFormPage() {
  const [boleto, setBoleto] = useState({
    id: '', nossoNumero: '', banco: '237', agencia: '', conta: '', digitoConta: '',
    pagadorNome: '', pagadorCpfCnpj: '', pagadorEndereco: '', pagadorCidade: '', pagadorUf: '', pagadorCep: '',
    valor: 0, valorDesconto: 0, valorJuros: 0, valorMulta: 0,
    dataEmissao: new Date().toISOString().split('T')[0], dataVencimento: '', dataPagamento: '',
    especie: 'DM', aceite: false, instrucao: 'PROTESTAR', diasProtesto: 3,
    descricao: '', instrucoes1: '', instrucoes2: '', instrucoes3: '',
    linhaDigitavel: '', codigoBarras: '', status: 'PENDENTE',
  });

  const [buscaPagador, setBuscaPagador] = useState('');
  const formatMoney = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const parseMoney = (v) => parseFloat(v.replace(/\D/g, '')) / 100 || 0;
  const formatCpfCnpj = (v) => { const n = v.replace(/\D/g, ''); return n.length <= 11 ? n.replace(/(\d{3})(\d{3})(\d{3})(\d{2}).*/, '$1.$2.$3-$4') : n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5'); };

  const valorTotal = boleto.valor - boleto.valorDesconto + boleto.valorJuros + boleto.valorMulta;

  const getStatusBadge = (s) => ({ PENDENTE: 'bg-yellow-100 text-yellow-700', REGISTRADO: 'bg-blue-100 text-blue-700', PAGO: 'bg-green-100 text-green-700', VENCIDO: 'bg-red-100 text-red-700', CANCELADO: 'bg-gray-100 text-gray-700' }[s] || 'bg-gray-100 text-gray-700');

  const copiarLinhaDigitavel = () => { navigator.clipboard.writeText(boleto.linhaDigitavel); };

  const menuItems = [
    { icon: Icons.save, label: 'Salvar e Registrar', variant: 'success' },
    { type: 'separator' },
    { icon: Icons.printer, label: 'Imprimir Boleto' },
    { icon: Icons.download, label: 'Download PDF' },
    { icon: Icons.mail, label: 'Enviar por E-mail' },
    { icon: Icons.whatsapp, label: 'Enviar WhatsApp' },
    { type: 'separator' },
    { icon: Icons.trash, label: 'Cancelar Boleto', variant: 'danger' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{globalStyles}</style>
      
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">{Icons.back}</button>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center text-white">{Icons.document}</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{boleto.nossoNumero ? `Boleto #${boleto.nossoNumero}` : 'Novo Boleto'}</h1>
                <p className="text-sm text-gray-500">{bancoOptions.find(b => b.value === boleto.banco)?.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(boleto.status)}`}>{statusOptions.find(s => s.value === boleto.status)?.label}</span>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2">{Icons.save}<span>Gerar Boleto</span></button>
              <DropdownMenu items={menuItems} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Dados do Banco */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados Bancários</h2>
          <div className="grid grid-cols-5 gap-3">
            <div><label className="block text-xs text-gray-500 mb-1">Banco *</label><SelectDropdown value={boleto.banco} onChange={(v) => setBoleto({...boleto, banco: v})} options={bancoOptions} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Agência</label><input type="text" value={boleto.agencia} onChange={(e) => setBoleto({...boleto, agencia: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="0000" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Conta</label><input type="text" value={boleto.conta} onChange={(e) => setBoleto({...boleto, conta: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="00000" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Dígito</label><input type="text" value={boleto.digitoConta} onChange={(e) => setBoleto({...boleto, digitoConta: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="0" maxLength={2} /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Nosso Número</label><input type="text" value={boleto.nossoNumero} readOnly placeholder="Automático" className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono" /></div>
          </div>
        </div>

        {/* Pagador */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados do Pagador</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Nome/Razão Social *</label><div className="relative"><input type="text" value={buscaPagador} onChange={(e) => setBuscaPagador(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm pr-10" placeholder="Buscar cliente..." /><button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500">{Icons.search}</button></div></div>
            <div><label className="block text-xs text-gray-500 mb-1">CPF/CNPJ *</label><input type="text" value={boleto.pagadorCpfCnpj} onChange={(e) => setBoleto({...boleto, pagadorCpfCnpj: formatCpfCnpj(e.target.value)})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono" placeholder="000.000.000-00" maxLength={18} /></div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-2"><label className="block text-xs text-gray-500 mb-1">Endereço</label><input type="text" value={boleto.pagadorEndereco} onChange={(e) => setBoleto({...boleto, pagadorEndereco: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Cidade</label><input type="text" value={boleto.pagadorCidade} onChange={(e) => setBoleto({...boleto, pagadorCidade: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs text-gray-500 mb-1">UF</label><input type="text" value={boleto.pagadorUf} onChange={(e) => setBoleto({...boleto, pagadorUf: e.target.value.toUpperCase()})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" maxLength={2} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">CEP</label><input type="text" value={boleto.pagadorCep} onChange={(e) => setBoleto({...boleto, pagadorCep: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Valores */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Valores</h2>
            <div className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Valor do Documento *</label><input type="text" value={formatMoney(boleto.valor)} onChange={(e) => setBoleto({...boleto, valor: parseMoney(e.target.value)})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right font-medium text-lg" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Desconto</label><input type="text" value={formatMoney(boleto.valorDesconto)} onChange={(e) => setBoleto({...boleto, valorDesconto: parseMoney(e.target.value)})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right text-green-600" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Juros</label><input type="text" value={formatMoney(boleto.valorJuros)} onChange={(e) => setBoleto({...boleto, valorJuros: parseMoney(e.target.value)})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right text-red-600" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Multa</label><input type="text" value={formatMoney(boleto.valorMulta)} onChange={(e) => setBoleto({...boleto, valorMulta: parseMoney(e.target.value)})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-right text-red-600" /></div>
              </div>
              <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total a Pagar:</span>
                <span className="text-xl font-bold text-emerald-600">{formatMoney(valorTotal)}</span>
              </div>
            </div>
          </div>

          {/* Datas e Configurações */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Datas e Configurações</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Data Emissão</label><input type="date" value={boleto.dataEmissao} onChange={(e) => setBoleto({...boleto, dataEmissao: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Data Vencimento *</label><input type="date" value={boleto.dataVencimento} onChange={(e) => setBoleto({...boleto, dataVencimento: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-500 mb-1">Espécie</label><SelectDropdown value={boleto.especie} onChange={(v) => setBoleto({...boleto, especie: v})} options={especieOptions} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Instrução</label><SelectDropdown value={boleto.instrucao} onChange={(v) => setBoleto({...boleto, instrucao: v})} options={instrucaoOptions} /></div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2"><input type="checkbox" id="aceite" checked={boleto.aceite} onChange={(e) => setBoleto({...boleto, aceite: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded" /><label htmlFor="aceite" className="text-sm text-gray-600">Aceite</label></div>
                {boleto.instrucao === 'PROTESTAR' && (<div className="flex items-center gap-2"><label className="text-sm text-gray-600">Dias para protesto:</label><input type="number" value={boleto.diasProtesto} onChange={(e) => setBoleto({...boleto, diasProtesto: parseInt(e.target.value) || 0})} className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center" min={1} max={30} /></div>)}
              </div>
            </div>
          </div>
        </div>

        {/* Linha Digitável */}
        {boleto.linhaDigitavel && (
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">{Icons.barcode}<h2 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Linha Digitável</h2></div>
              <button onClick={copiarLinhaDigitavel} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm hover:bg-emerald-200">{Icons.copy}<span>Copiar</span></button>
            </div>
            <p className="font-mono text-lg text-emerald-800 tracking-wider text-center">{boleto.linhaDigitavel || '23793.38128 60000.000003 00000.000400 1 84340000010000'}</p>
          </div>
        )}

        {/* Instruções */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Instruções do Boleto</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div><label className="block text-xs text-gray-500 mb-1">Instrução 1</label><input type="text" value={boleto.instrucoes1} onChange={(e) => setBoleto({...boleto, instrucoes1: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Não receber após vencimento" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Instrução 2</label><input type="text" value={boleto.instrucoes2} onChange={(e) => setBoleto({...boleto, instrucoes2: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Multa de 2% após vencimento" /></div>
            <div><label className="block text-xs text-gray-500 mb-1">Instrução 3</label><input type="text" value={boleto.instrucoes3} onChange={(e) => setBoleto({...boleto, instrucoes3: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Juros de 1% ao mês" /></div>
          </div>
          <div><label className="block text-xs text-gray-500 mb-1">Descrição/Histórico</label><textarea value={boleto.descricao} onChange={(e) => setBoleto({...boleto, descricao: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" placeholder="Referente a: Venda #12345 - Produtos diversos" /></div>
        </div>
      </main>
    </div>
  );
}
