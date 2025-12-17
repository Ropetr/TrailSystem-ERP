import React, { useState, useRef, useEffect } from 'react';

const globalStyles = `input:focus, textarea:focus, select:focus { outline: none !important; border-color: #ef4444 !important; box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2) !important; }`;

const Icons = {
  back: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>,
  save: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  ticket: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  dots: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>,
  search: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  paperclip: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>,
  send: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  clock: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
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

const statusOptions = [{ value: 'ABERTO', label: 'Aberto' }, { value: 'EM_ATENDIMENTO', label: 'Em Atendimento' }, { value: 'AGUARDANDO', label: 'Aguardando Cliente' }, { value: 'RESOLVIDO', label: 'Resolvido' }, { value: 'FECHADO', label: 'Fechado' }];
const prioridadeOptions = [{ value: 'BAIXA', label: 'Baixa' }, { value: 'NORMAL', label: 'Normal' }, { value: 'ALTA', label: 'Alta' }, { value: 'URGENTE', label: 'Urgente' }];
const categoriaOptions = [{ value: 'DUVIDA', label: 'Dúvida' }, { value: 'BUG', label: 'Bug/Erro' }, { value: 'SOLICITACAO', label: 'Solicitação' }, { value: 'SUGESTAO', label: 'Sugestão' }, { value: 'RECLAMACAO', label: 'Reclamação' }];
const moduloOptions = [{ value: 'COMERCIAL', label: 'Comercial' }, { value: 'FISCAL', label: 'Fiscal' }, { value: 'FINANCEIRO', label: 'Financeiro' }, { value: 'ESTOQUE', label: 'Estoque' }, { value: 'GERAL', label: 'Geral' }];
const atendenteOptions = [{ value: 'SUPORTE1', label: 'Suporte Nível 1' }, { value: 'SUPORTE2', label: 'Suporte Nível 2' }, { value: 'DEV', label: 'Desenvolvimento' }];

export default function TicketFormPage() {
  const [ticket, setTicket] = useState({
    id: '', numero: '', assunto: '', descricao: '', status: 'ABERTO', prioridade: 'NORMAL', categoria: 'DUVIDA', modulo: 'GERAL',
    cliente: '', clienteNome: '', clienteEmail: '', atendente: '', dataAbertura: new Date().toISOString(), dataFechamento: '', slaHoras: 24, observacoesInternas: '',
  });

  const [mensagens, setMensagens] = useState([
    { id: 1, autor: 'Cliente', data: '2025-12-17T10:30:00', texto: 'Estou com dúvida sobre como emitir nota fiscal de serviço.', interno: false },
    { id: 2, autor: 'Suporte', data: '2025-12-17T11:15:00', texto: 'Olá! Para emitir NFS-e, acesse o menu Fiscal > NFS-e > Nova Nota.', interno: false },
  ]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [mensagemInterna, setMensagemInterna] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState('');

  const getStatusBadge = (s) => ({ ABERTO: 'bg-blue-100 text-blue-700', EM_ATENDIMENTO: 'bg-yellow-100 text-yellow-700', AGUARDANDO: 'bg-orange-100 text-orange-700', RESOLVIDO: 'bg-green-100 text-green-700', FECHADO: 'bg-gray-100 text-gray-700' }[s] || 'bg-gray-100 text-gray-700');
  const getPrioridadeBadge = (p) => ({ BAIXA: 'bg-gray-100 text-gray-600', NORMAL: 'bg-blue-100 text-blue-600', ALTA: 'bg-orange-100 text-orange-600', URGENTE: 'bg-red-100 text-red-600' }[p] || 'bg-gray-100 text-gray-600');

  const enviarMensagem = () => {
    if (!novaMensagem.trim()) return;
    setMensagens([...mensagens, { id: Date.now(), autor: 'Suporte', data: new Date().toISOString(), texto: novaMensagem, interno: mensagemInterna }]);
    setNovaMensagem('');
  };

  const menuItems = [{ icon: Icons.save, label: 'Salvar', variant: 'success' }, { icon: Icons.check, label: 'Resolver Ticket', variant: 'success' }, { type: 'separator' }, { icon: Icons.trash, label: 'Excluir', variant: 'danger' }];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <style>{globalStyles}</style>
      
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600">{Icons.back}</button>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center text-white">{Icons.ticket}</div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{ticket.numero ? `Ticket #${ticket.numero}` : 'Novo Ticket'}</h1>
                <p className="text-sm text-gray-500">{ticket.assunto || 'Suporte ao cliente'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPrioridadeBadge(ticket.prioridade)}`}>{prioridadeOptions.find(p => p.value === ticket.prioridade)?.label}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>{statusOptions.find(s => s.value === ticket.status)?.label}</span>
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2">{Icons.save}<span>Salvar</span></button>
              <DropdownMenu items={menuItems} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Coluna Principal - Mensagens */}
          <div className="col-span-2 space-y-6">
            {/* Dados do Ticket */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Dados do Ticket</h2>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div><label className="block text-xs text-gray-500 mb-1">Número</label><input type="text" value={ticket.numero} readOnly placeholder="Automático" className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Cliente</label><div className="relative"><input type="text" value={buscaCliente} onChange={(e) => setBuscaCliente(e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm pr-10" placeholder="Buscar cliente..." /><button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500">{Icons.search}</button></div></div>
              </div>
              <div className="mb-4"><label className="block text-xs text-gray-500 mb-1">Assunto *</label><input type="text" value={ticket.assunto} onChange={(e) => setTicket({...ticket, assunto: e.target.value})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" placeholder="Título do ticket" /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Descrição *</label><textarea value={ticket.descricao} onChange={(e) => setTicket({...ticket, descricao: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" placeholder="Descreva o problema ou solicitação..." /></div>
            </div>

            {/* Histórico de Mensagens */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Histórico de Mensagens</h2>
              <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                {mensagens.map((msg) => (
                  <div key={msg.id} className={`p-3 rounded-lg ${msg.interno ? 'bg-yellow-50 border border-yellow-200' : msg.autor === 'Cliente' ? 'bg-gray-50' : 'bg-blue-50'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${msg.autor === 'Cliente' ? 'text-gray-700' : 'text-blue-700'}`}>{msg.autor}</span>
                      <div className="flex items-center gap-2">
                        {msg.interno && <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded">Interno</span>}
                        <span className="text-xs text-gray-400 flex items-center gap-1">{Icons.clock}{new Date(msg.data).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{msg.texto}</p>
                  </div>
                ))}
              </div>
              
              {/* Nova Mensagem */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" id="msgInterna" checked={mensagemInterna} onChange={(e) => setMensagemInterna(e.target.checked)} className="w-4 h-4 text-orange-600 rounded" />
                  <label htmlFor="msgInterna" className="text-sm text-gray-600">Mensagem interna (não visível para o cliente)</label>
                </div>
                <div className="flex gap-2">
                  <textarea value={novaMensagem} onChange={(e) => setNovaMensagem(e.target.value)} rows={2} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" placeholder="Digite sua resposta..." />
                  <div className="flex flex-col gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg">{Icons.paperclip}</button>
                    <button onClick={enviarMensagem} className="p-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">{Icons.send}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Lateral - Configurações */}
          <div className="space-y-6">
            {/* Status e Classificação */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Classificação</h2>
              <div className="space-y-3">
                <div><label className="block text-xs text-gray-500 mb-1">Status</label><SelectDropdown value={ticket.status} onChange={(v) => setTicket({...ticket, status: v})} options={statusOptions} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Prioridade</label><SelectDropdown value={ticket.prioridade} onChange={(v) => setTicket({...ticket, prioridade: v})} options={prioridadeOptions} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Categoria</label><SelectDropdown value={ticket.categoria} onChange={(v) => setTicket({...ticket, categoria: v})} options={categoriaOptions} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Módulo</label><SelectDropdown value={ticket.modulo} onChange={(v) => setTicket({...ticket, modulo: v})} options={moduloOptions} /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Atendente</label><SelectDropdown value={ticket.atendente} onChange={(v) => setTicket({...ticket, atendente: v})} options={atendenteOptions} placeholder="Selecionar..." /></div>
              </div>
            </div>

            {/* SLA */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">SLA</h2>
              <div className="space-y-3">
                <div><label className="block text-xs text-gray-500 mb-1">Aberto em</label><input type="text" value={new Date(ticket.dataAbertura).toLocaleString('pt-BR')} readOnly className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" /></div>
                <div><label className="block text-xs text-gray-500 mb-1">Prazo (horas)</label><input type="number" value={ticket.slaHoras} onChange={(e) => setTicket({...ticket, slaHoras: parseInt(e.target.value) || 24})} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" /></div>
                <div className="p-3 bg-green-50 rounded-lg text-center"><span className="text-sm font-medium text-green-700">Dentro do SLA</span><p className="text-xs text-green-600">Restam 18h 45min</p></div>
              </div>
            </div>

            {/* Observações Internas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Observações Internas</h2>
              <textarea value={ticket.observacoesInternas} onChange={(e) => setTicket({...ticket, observacoesInternas: e.target.value})} rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" placeholder="Notas internas da equipe..." />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
