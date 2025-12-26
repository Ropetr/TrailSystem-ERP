import React, { useState, useRef, useEffect } from 'react';

// ============================================
// DASHBOARD FINANCEIRO - TRAILSYSTEM ERP
// ============================================
// Perfil: Analistas Financeiros, Tesouraria
// Foco: Fluxo de Caixa, Contas a Pagar/Receber
// ============================================

// Ícones SVG
const Icons = {
  filter: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  settings: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  drag: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>,
  trendUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  trendDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>,
  sparkles: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  alert: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  calendar: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  send: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  refresh: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  menu: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  cash: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  dollarSign: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  arrowUp: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" /></svg>,
  arrowDown: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" /></svg>,
  creditCard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  chartLine: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>,
  bank: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>,
  exclamation: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  check: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  loader: <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>,
  building: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
};

// Dados mockados para Financeiro
const mockData = {
  kpis: {
    saldoCaixa: { valor: 234560.00, anterior: 198450.00, meta: null },
    aReceber: { valor: 456780.00, anterior: 412350.00, meta: null },
    aPagar: { valor: 312450.00, anterior: 345670.00, meta: null },
    inadimplencia: { valor: 4.2, anterior: 5.8, meta: 3.0 },
  },
  contasPagar: [
    { id: 'CP-4521', fornecedor: 'Gypsum Brasil', valor: 45600, vencimento: '28/12/2025', dias: 2, status: 'pendente' },
    { id: 'CP-4520', fornecedor: 'Energia Elétrica', valor: 8750, vencimento: '30/12/2025', dias: 4, status: 'pendente' },
    { id: 'CP-4519', fornecedor: 'Knauf do Brasil', valor: 32400, vencimento: '02/01/2026', dias: 7, status: 'agendado' },
    { id: 'CP-4518', fornecedor: 'Aluguel Galpão', valor: 15000, vencimento: '05/01/2026', dias: 10, status: 'agendado' },
  ],
  contasReceber: [
    { id: 'CR-7892', cliente: 'Construtora Horizonte', valor: 89500, vencimento: '27/12/2025', dias: 1, status: 'a_vencer' },
    { id: 'CR-7891', cliente: 'MegaObras Ltda', valor: 45200, vencimento: '26/12/2025', dias: 0, status: 'vence_hoje' },
    { id: 'CR-7890', cliente: 'Steel House', valor: 28750, vencimento: '20/12/2025', dias: -6, status: 'vencido' },
    { id: 'CR-7889', cliente: 'Decor Plus', valor: 18900, vencimento: '15/12/2025', dias: -11, status: 'vencido' },
  ],
  fluxoCaixa: [
    { periodo: 'Hoje', entradas: 45000, saidas: 28000, saldo: 251560 },
    { periodo: '7 dias', entradas: 156000, saidas: 98000, saldo: 309560 },
    { periodo: '15 dias', entradas: 245000, saidas: 178000, saldo: 376560 },
    { periodo: '30 dias', entradas: 412000, saidas: 298000, saldo: 490560 },
    { periodo: '60 dias', entradas: 687000, saidas: 512000, saldo: 665560 },
    { periodo: '90 dias', entradas: 945000, saidas: 756000, saldo: 879560 },
  ],
  contasBancarias: [
    { banco: 'Banco do Brasil', agencia: '1234-5', conta: '12345-6', saldo: 89450, cor: '#facc15' },
    { banco: 'Itaú', agencia: '0987', conta: '98765-4', saldo: 67890, cor: '#f97316' },
    { banco: 'Bradesco', agencia: '5678', conta: '45678-9', saldo: 45320, cor: '#ef4444' },
    { banco: 'Santander', agencia: '4321', conta: '87654-3', saldo: 31900, cor: '#dc2626' },
  ],
  agingRecebiveis: [
    { faixa: 'A vencer', valor: 245000, percentual: 53.6, cor: '#22c55e' },
    { faixa: '1-30 dias', valor: 98500, percentual: 21.6, cor: '#eab308' },
    { faixa: '31-60 dias', valor: 67200, percentual: 14.7, cor: '#f97316' },
    { faixa: '61-90 dias', valor: 28300, percentual: 6.2, cor: '#ef4444' },
    { faixa: '+90 dias', valor: 17780, percentual: 3.9, cor: '#991b1b' },
  ],
  insights: [
    { tipo: 'alerta', cor: 'red', msg: '2 títulos vencidos somam R$ 47.650 - iniciar cobrança' },
    { tipo: 'atencao', cor: 'yellow', msg: 'Conta a pagar CP-4521 vence em 2 dias - R$ 45.600' },
    { tipo: 'positivo', cor: 'green', msg: 'Inadimplência caiu 28% comparado ao mês anterior' },
    { tipo: 'info', cor: 'blue', msg: 'Projeção de caixa positiva para os próximos 90 dias' },
  ],
};

// Formatadores
const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(value);
const formatPercent = (value) => `${value.toFixed(1)}%`;
const calcVariacao = (atual, anterior) => ((atual - anterior) / anterior * 100);

// ============================================
// COMPONENTES
// ============================================

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-gray-300 mb-3">{icon}</div>
      <h4 className="text-sm font-medium text-gray-600 mb-1">{title}</h4>
      {description && <p className="text-xs text-gray-400">{description}</p>}
    </div>
  );
}

function FilterDropdown({ icon, label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-gray-300 transition-colors">
        <span className="text-gray-400">{icon}</span>
        <span className="text-gray-600">{label}:</span>
        <span className="font-medium text-gray-800">{value}</span>
        {Icons.chevronDown}
      </button>
      
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-[9999] min-w-full">
          {options.map((opt) => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }} className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${opt === value ? 'text-emerald-600 font-medium' : 'text-gray-700'}`}>
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function KPICardContent({ valor, valorFormatado, anterior, meta, tipo = 'money', loading = false, invertido = false }) {
  if (loading) {
    return (
      <div>
        <Skeleton className="h-10 w-32 mb-3" />
        <Skeleton className="h-4 w-24 mb-4" />
      </div>
    );
  }

  const variacao = calcVariacao(valor, anterior);
  const isPositivo = invertido ? variacao <= 0 : variacao >= 0;
  
  return (
    <div>
      <div className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">{valorFormatado}</div>
      
      <div className="flex items-center gap-4 text-sm mb-4">
        <div className={`flex items-center gap-1.5 ${isPositivo ? 'text-green-600' : 'text-red-500'}`}>
          {isPositivo ? Icons.trendUp : Icons.trendDown}
          <span className="font-semibold">{variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%</span>
        </div>
        <span className="text-gray-500">
          vs {tipo === 'money' ? formatMoney(anterior) : tipo === 'percent' ? formatPercent(anterior) : formatNumber(anterior)}
        </span>
      </div>
      
      {meta && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Meta: {formatPercent(meta)}</span>
            <span className={valor <= meta ? 'text-green-600 font-semibold' : 'text-red-500 font-medium'}>{formatPercent(valor)}</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${valor <= meta ? 'bg-green-500' : 'bg-red-400'}`} style={{ width: `${Math.min((valor / meta) * 100, 150)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function WidgetCard({ titulo, icon, children, className = '', actions, loading = false }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group ${className}`}>
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{icon}</span>
          <h3 className="font-semibold text-gray-800 text-sm sm:text-base">{titulo}</h3>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-gray-300 hover:text-gray-400">{Icons.drag}</div>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        {loading ? <div className="flex items-center justify-center py-8">{Icons.loader}</div> : children}
      </div>
    </div>
  );
}

// Fluxo de Caixa Projetado
function FluxoCaixaProjetado({ dados }) {
  if (!dados || dados.length === 0) {
    return <EmptyState icon={Icons.chartLine} title="Sem projeção" description="Dados insuficientes para projeção" />;
  }

  const maxSaldo = Math.max(...dados.map(d => d.saldo));

  return (
    <div className="space-y-4">
      {dados.map((d, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-16 text-sm font-medium text-gray-600">{d.periodo}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-green-600 flex items-center gap-1">{Icons.arrowUp} {formatMoney(d.entradas)}</span>
              <span className="text-xs text-red-500 flex items-center gap-1">{Icons.arrowDown} {formatMoney(d.saidas)}</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${(d.saldo / maxSaldo) * 100}%` }} />
            </div>
          </div>
          <div className="w-28 text-right">
            <span className="text-sm font-bold text-gray-800">{formatMoney(d.saldo)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Contas a Pagar
function ContasPagar({ contas }) {
  if (!contas || contas.length === 0) {
    return <EmptyState icon={Icons.check} title="Sem contas pendentes" description="Todas as contas foram pagas" />;
  }

  return (
    <div className="space-y-3">
      {contas.map((c) => (
        <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
          <div className={`w-2 h-10 rounded-full ${c.dias <= 2 ? 'bg-red-500' : c.dias <= 7 ? 'bg-yellow-500' : 'bg-green-500'}`} />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800">{c.id}</div>
            <div className="text-xs text-gray-500">{c.fornecedor}</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-800">{formatMoney(c.valor)}</div>
            <div className={`text-xs ${c.dias <= 2 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>{c.vencimento}</div>
          </div>
          <button className="text-xs px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors">Pagar</button>
        </div>
      ))}
    </div>
  );
}

// Contas a Receber
function ContasReceber({ contas }) {
  if (!contas || contas.length === 0) {
    return <EmptyState icon={Icons.check} title="Sem contas a receber" description="Todas as contas foram recebidas" />;
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'vencido': return { label: 'Vencido', bg: 'bg-red-100', text: 'text-red-700' };
      case 'vence_hoje': return { label: 'Hoje', bg: 'bg-yellow-100', text: 'text-yellow-700' };
      case 'a_vencer': return { label: 'A vencer', bg: 'bg-green-100', text: 'text-green-700' };
      default: return { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  return (
    <div className="space-y-3">
      {contas.map((c) => {
        const status = getStatusConfig(c.status);
        return (
          <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">{c.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>{status.label}</span>
              </div>
              <div className="text-xs text-gray-500">{c.cliente}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-800">{formatMoney(c.valor)}</div>
              <div className="text-xs text-gray-500">{c.vencimento}</div>
            </div>
            {c.status === 'vencido' && (
              <button className="text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors">Cobrar</button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Contas Bancárias
function ContasBancarias({ contas }) {
  if (!contas || contas.length === 0) {
    return <EmptyState icon={Icons.bank} title="Sem contas" description="Nenhuma conta bancária cadastrada" />;
  }

  const total = contas.reduce((acc, c) => acc + c.saldo, 0);

  return (
    <div className="space-y-4">
      {contas.map((c, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.cor + '20' }}>
            <span className="text-lg" style={{ color: c.cor }}>🏦</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800">{c.banco}</div>
            <div className="text-xs text-gray-500">Ag: {c.agencia} • C/C: {c.conta}</div>
          </div>
          <div className="text-sm font-semibold text-gray-800">{formatMoney(c.saldo)}</div>
        </div>
      ))}
      <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600">Total em Bancos</span>
        <span className="text-lg font-bold text-emerald-600">{formatMoney(total)}</span>
      </div>
    </div>
  );
}

// Aging de Recebíveis
function AgingRecebiveis({ dados }) {
  if (!dados || dados.length === 0) {
    return <EmptyState icon={Icons.chartLine} title="Sem dados" description="Sem recebíveis para análise" />;
  }

  const total = dados.reduce((acc, d) => acc + d.valor, 0);

  return (
    <div className="space-y-3">
      {dados.map((d, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.cor }} />
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-700">{d.faixa}</span>
              <span className="text-sm font-medium text-gray-800">{formatMoney(d.valor)}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ backgroundColor: d.cor, width: `${d.percentual}%` }} />
            </div>
          </div>
          <span className="text-xs text-gray-500 w-12 text-right">{d.percentual}%</span>
        </div>
      ))}
      <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-600">Total Recebíveis</span>
        <span className="text-lg font-bold text-gray-800">{formatMoney(total)}</span>
      </div>
    </div>
  );
}

// Insights
function InsightsAutomaticos({ insights }) {
  if (!insights || insights.length === 0) {
    return <EmptyState icon={Icons.sparkles} title="Sem insights" description="Nenhum insight disponível" />;
  }

  const getIcone = (cor) => {
    const cores = { red: '#ef4444', yellow: '#eab308', green: '#22c55e', blue: '#3b82f6' };
    return <svg className="w-5 h-5" fill={cores[cor] || '#9ca3af'} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>;
  };
  
  return (
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <div key={i} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
          <span className="mt-0.5 flex-shrink-0">{getIcone(insight.cor)}</span>
          <p className="text-sm text-gray-700 flex-1">{insight.msg}</p>
        </div>
      ))}
    </div>
  );
}

// Mentor IA
function MentorIA() {
  const [pergunta, setPergunta] = useState('');
  const [mensagens, setMensagens] = useState([
    { tipo: 'ia', texto: 'Olá! Sou o assistente Financeiro do TrailSystem. Posso ajudar com análises de fluxo de caixa, inadimplência e projeções. O que precisa?' }
  ]);
  
  const sugestoes = [
    'Como está o fluxo para os próximos 30 dias?',
    'Quais títulos estão vencidos?',
    'Qual a previsão de inadimplência?',
  ];
  
  const enviarPergunta = () => {
    if (!pergunta.trim()) return;
    setMensagens([...mensagens, { tipo: 'usuario', texto: pergunta }]);
    setPergunta('');
    setTimeout(() => {
      setMensagens(msgs => [...msgs, { tipo: 'ia', texto: 'Analisando dados financeiros... Em produção, consultarei o banco para fornecer análises precisas!' }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-80">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {mensagens.map((msg, i) => (
          <div key={i} className={`flex ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.tipo === 'usuario' ? 'bg-emerald-500 text-white rounded-br-md' : 'bg-gray-100 text-gray-700 rounded-bl-md'}`}>
              {msg.texto}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {sugestoes.map((sug, i) => (
          <button key={i} onClick={() => setPergunta(sug)} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
            {sug}
          </button>
        ))}
      </div>
      
      <div className="flex gap-2">
        <input type="text" value={pergunta} onChange={(e) => setPergunta(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarPergunta()} placeholder="Pergunte algo..." className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100" />
        <button onClick={enviarPergunta} disabled={!pergunta.trim()} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-xl transition-colors">
          {Icons.send}
        </button>
      </div>
    </div>
  );
}

// Responsive Tabs/Grid
function ResponsiveTabsGrid({ tabs, breakpoint = 900, minWidth = 280 }) {
  const [activeTab, setActiveTab] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkWidth = () => setIsSmallScreen(window.innerWidth < breakpoint);
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [breakpoint]);

  if (!isSmallScreen) {
    return (
      <div className="grid gap-4 sm:gap-6" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))` }}>
        {tabs.map((tab, i) => (
          <WidgetCard key={i} titulo={tab.titulo} icon={tab.icon} actions={tab.actions}>{tab.content}</WidgetCard>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex border-b border-gray-100">
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors relative ${activeTab === i ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}>
            <span className={activeTab === i ? 'text-emerald-500' : 'text-gray-400'}>{tab.icon}</span>
            <span className="hidden sm:inline truncate">{tab.titulo}</span>
            <span className="sm:hidden text-xs">{tab.tituloShort || tab.titulo.split(' ')[0]}</span>
            {activeTab === i && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-emerald-500">{tabs[activeTab].icon}</span>
          <h3 className="font-semibold text-gray-800">{tabs[activeTab].titulo}</h3>
        </div>
        {tabs[activeTab].actions}
      </div>
      <div className="p-4 sm:p-5">{tabs[activeTab].content}</div>
    </div>
  );
}

// ============================================
// DASHBOARD PRINCIPAL
// ============================================
export default function DashboardFinanceiro() {
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    periodo: 'Este Mês',
    conta: 'Todas',
    filial: 'Matriz',
  });
  
  const { kpis, contasPagar, contasReceber, fluxoCaixa, contasBancarias, agingRecebiveis, insights } = mockData;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">{Icons.menu}</button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center text-white">{Icons.cash}</div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Dashboard Financeiro</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Atualizado há 5 minutos</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => setLoading(true)}>{Icons.refresh}</button>
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">{Icons.settings}<span>Personalizar</span></button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Filtros */}
      <div className="bg-white border-b border-gray-100 py-3 sticky top-16 z-30">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1 text-gray-400 pr-2 border-r border-gray-200">{Icons.filter}<span className="text-sm font-medium hidden sm:inline">Filtros:</span></div>
            <FilterDropdown icon={Icons.calendar} label="Período" value={filtros.periodo} options={['Hoje', 'Esta Semana', 'Este Mês', 'Último Trimestre']} onChange={(v) => setFiltros({...filtros, periodo: v})} />
            <FilterDropdown icon={Icons.bank} label="Conta" value={filtros.conta} options={['Todas', 'Banco do Brasil', 'Itaú', 'Bradesco', 'Santander']} onChange={(v) => setFiltros({...filtros, conta: v})} />
            <FilterDropdown icon={Icons.building} label="Filial" value={filtros.filial} options={['Todas', 'Matriz', 'Filial Londrina', 'Filial Cascavel']} onChange={(v) => setFiltros({...filtros, filial: v})} />
          </div>
        </div>
      </div>
      
      {/* Conteúdo */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPIs */}
        <div className="mb-6">
          <ResponsiveTabsGrid breakpoint={768} minWidth={200} tabs={[
            { titulo: 'Saldo em Caixa', tituloShort: 'Caixa', icon: Icons.cash, content: <KPICardContent valor={kpis.saldoCaixa.valor} valorFormatado={formatMoney(kpis.saldoCaixa.valor)} anterior={kpis.saldoCaixa.anterior} tipo="money" loading={loading} /> },
            { titulo: 'A Receber', tituloShort: 'Receber', icon: Icons.arrowUp, content: <KPICardContent valor={kpis.aReceber.valor} valorFormatado={formatMoney(kpis.aReceber.valor)} anterior={kpis.aReceber.anterior} tipo="money" loading={loading} /> },
            { titulo: 'A Pagar', tituloShort: 'Pagar', icon: Icons.arrowDown, content: <KPICardContent valor={kpis.aPagar.valor} valorFormatado={formatMoney(kpis.aPagar.valor)} anterior={kpis.aPagar.anterior} tipo="money" loading={loading} invertido={true} /> },
            { titulo: 'Inadimplência', tituloShort: 'Inadim.', icon: Icons.exclamation, content: <KPICardContent valor={kpis.inadimplencia.valor} valorFormatado={formatPercent(kpis.inadimplencia.valor)} anterior={kpis.inadimplencia.anterior} meta={kpis.inadimplencia.meta} tipo="percent" loading={loading} invertido={true} /> },
          ]} />
        </div>
        
        {/* Fluxo e Contas */}
        <div className="mb-6">
          <ResponsiveTabsGrid breakpoint={1000} minWidth={320} tabs={[
            { titulo: 'Fluxo de Caixa Projetado', tituloShort: 'Fluxo', icon: Icons.chartLine, content: <FluxoCaixaProjetado dados={fluxoCaixa} /> },
            { titulo: 'Contas Bancárias', tituloShort: 'Bancos', icon: Icons.bank, content: <ContasBancarias contas={contasBancarias} /> },
            { titulo: 'Aging Recebíveis', tituloShort: 'Aging', icon: Icons.creditCard, content: <AgingRecebiveis dados={agingRecebiveis} /> },
          ]} />
        </div>
        
        {/* Contas a Pagar/Receber */}
        <div className="mb-6">
          <ResponsiveTabsGrid tabs={[
            { titulo: 'Contas a Pagar', tituloShort: 'Pagar', icon: Icons.arrowDown, content: <ContasPagar contas={contasPagar} /> },
            { titulo: 'Contas a Receber', tituloShort: 'Receber', icon: Icons.arrowUp, content: <ContasReceber contas={contasReceber} /> },
          ]} />
        </div>
        
        {/* IA e Insights */}
        <div className="mb-6">
          <ResponsiveTabsGrid tabs={[
            { titulo: 'Assistente IA', tituloShort: 'IA', icon: Icons.sparkles, actions: <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Online</span>, content: <MentorIA /> },
            { titulo: 'Insights Automáticos', tituloShort: 'Insights', icon: Icons.alert, content: <InsightsAutomaticos insights={insights} /> },
          ]} />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-4 mt-8">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <p>💡 <strong>Dica:</strong> Arraste os cards para reorganizar seu dashboard.</p>
            <button className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium">{Icons.settings}<span>Personalizar Dashboard</span></button>
          </div>
        </div>
      </footer>
    </div>
  );
}
