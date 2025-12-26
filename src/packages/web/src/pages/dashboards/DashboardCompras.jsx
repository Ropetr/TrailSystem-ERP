import React, { useState, useRef, useEffect, useMemo } from 'react';

// ============================================
// DASHBOARD DE COMPRAS - TRAILSYSTEM ERP
// ============================================
// Perfil: Compradores, Gestores de Compras
// Foco: Pedidos, Fornecedores, Cotações, Prazos
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
  truck: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
  package: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  refresh: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  menu: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  shoppingBag: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>,
  clock: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  dollarSign: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  clipboardList: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  userGroup: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  documentText: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  chartBar: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  exclamation: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  loader: <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>,
  tag: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  building: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
};

// Dados mockados para Compras
const mockData = {
  kpis: {
    totalCompras: { valor: 456780.00, anterior: 412350.00, meta: 500000.00 },
    economia: { valor: 12.5, anterior: 8.3, meta: 15.0 },
    pedidosPendentes: { valor: 23, anterior: 31, meta: 15 },
    leadTimeMedio: { valor: 5.2, anterior: 6.8, meta: 4.0 },
  },
  pedidosPendentes: [
    { id: 'PC-2024-0892', fornecedor: 'Gypsum Brasil', valor: 45600, prazo: '28/12/2025', diasRestantes: 2, status: 'em_transito' },
    { id: 'PC-2024-0891', fornecedor: 'Knauf do Brasil', valor: 32400, prazo: '30/12/2025', diasRestantes: 4, status: 'confirmado' },
    { id: 'PC-2024-0890', fornecedor: 'Placo Saint-Gobain', valor: 28750, prazo: '02/01/2026', diasRestantes: 7, status: 'aguardando' },
    { id: 'PC-2024-0889', fornecedor: 'Eternit SA', valor: 18900, prazo: '05/01/2026', diasRestantes: 10, status: 'confirmado' },
  ],
  cotacoesAbertas: [
    { id: 'COT-0156', produto: 'Placa Drywall ST 12,5mm', qtd: 500, fornecedores: 3, melhorPreco: 38.50, economia: 8.5, vence: '27/12/2025' },
    { id: 'COT-0155', produto: 'Perfil Montante 70mm', qtd: 200, fornecedores: 4, melhorPreco: 28.90, economia: 12.3, vence: '28/12/2025' },
    { id: 'COT-0154', produto: 'Massa Drywall 28kg', qtd: 100, fornecedores: 2, melhorPreco: 42.00, economia: 5.2, vence: '30/12/2025' },
  ],
  fornecedoresTop: [
    { nome: 'Gypsum Brasil', compras: 156780, pedidos: 24, pontualidade: 98, avaliacao: 4.8 },
    { nome: 'Knauf do Brasil', compras: 98450, pedidos: 18, pontualidade: 95, avaliacao: 4.6 },
    { nome: 'Placo Saint-Gobain', compras: 87200, pedidos: 15, pontualidade: 92, avaliacao: 4.5 },
    { nome: 'Eternit SA', compras: 65400, pedidos: 12, pontualidade: 88, avaliacao: 4.3 },
    { nome: 'Lafarge Holcim', compras: 48950, pedidos: 8, pontualidade: 94, avaliacao: 4.4 },
  ],
  prazosAlerta: [
    { pedido: 'PC-2024-0892', fornecedor: 'Gypsum Brasil', prazo: '28/12/2025', dias: 2, risco: 'alto' },
    { pedido: 'PC-2024-0885', fornecedor: 'Drywall Express', prazo: '26/12/2025', dias: 0, risco: 'critico' },
    { pedido: 'PC-2024-0891', fornecedor: 'Knauf do Brasil', prazo: '30/12/2025', dias: 4, risco: 'medio' },
  ],
  comprasMensais: [
    { mes: 'Jan', atual: 380000, anterior: 350000 },
    { mes: 'Fev', atual: 420000, anterior: 380000 },
    { mes: 'Mar', atual: 395000, anterior: 410000 },
    { mes: 'Abr', atual: 450000, anterior: 420000 },
    { mes: 'Mai', atual: 480000, anterior: 440000 },
    { mes: 'Jun', atual: 456780, anterior: 412350 },
  ],
  categorias: [
    { nome: 'Chapas', valor: 185000, cor: '#3b82f6' },
    { nome: 'Perfis', valor: 98000, cor: '#8b5cf6' },
    { nome: 'Massas', valor: 72000, cor: '#06b6d4' },
    { nome: 'Parafusos', valor: 54780, cor: '#10b981' },
    { nome: 'Ferramentas', valor: 32000, cor: '#f59e0b' },
    { nome: 'Outros', valor: 15000, cor: '#6b7280' },
  ],
  insights: [
    { tipo: 'alerta', cor: 'red', msg: 'Pedido PC-2024-0885 está ATRASADO - contatar fornecedor urgente' },
    { tipo: 'atencao', cor: 'yellow', msg: 'Cotação COT-0156 vence amanhã - 3 propostas disponíveis' },
    { tipo: 'positivo', cor: 'green', msg: 'Economia de 12.5% nas compras este mês - acima da meta!' },
    { tipo: 'info', cor: 'blue', msg: 'Lead time médio caiu 24% comparado ao mês anterior' },
  ],
};

// Formatadores
const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(value);
const formatPercent = (value) => `${value.toFixed(1)}%`;

// Calcula variação percentual
const calcVariacao = (atual, anterior) => ((atual - anterior) / anterior * 100);

// ============================================
// COMPONENTES
// ============================================

// Loading Skeleton
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

// Empty State
function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="text-gray-300 mb-3">{icon}</div>
      <h4 className="text-sm font-medium text-gray-600 mb-1">{title}</h4>
      {description && <p className="text-xs text-gray-400">{description}</p>}
    </div>
  );
}

// Dropdown de Filtro
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
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-gray-300 transition-colors"
      >
        <span className="text-gray-400">{icon}</span>
        <span className="text-gray-600">{label}:</span>
        <span className="font-medium text-gray-800">{value}</span>
        {Icons.chevronDown}
      </button>
      
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-[9999] min-w-full">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${opt === value ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// KPI Card Content
function KPICardContent({ valor, valorFormatado, anterior, meta, tipo = 'money', loading = false, invertido = false }) {
  if (loading) {
    return (
      <div>
        <Skeleton className="h-10 w-32 mb-3" />
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-2.5 w-full" />
      </div>
    );
  }

  const variacao = calcVariacao(valor, anterior);
  const progresso = meta ? (valor / meta * 100) : null;
  // Para alguns KPIs como "pedidos pendentes", menor é melhor
  const isPositivo = invertido ? variacao <= 0 : variacao >= 0;
  const atingiuMeta = meta && (invertido ? valor <= meta : valor >= meta);
  
  return (
    <div>
      <div className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
        {valorFormatado}
      </div>
      
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
            <span className="text-gray-600">Meta: {tipo === 'money' ? formatMoney(meta) : tipo === 'percent' ? formatPercent(meta) : formatNumber(meta)}</span>
            <span className={atingiuMeta ? 'text-green-600 font-semibold' : 'text-gray-700 font-medium'}>{progresso.toFixed(0)}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${atingiuMeta ? 'bg-green-500' : progresso >= 80 ? 'bg-yellow-500' : 'bg-blue-400'}`}
              style={{ width: `${Math.min(progresso, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Card Widget Base
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
          <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab text-gray-300 hover:text-gray-400">
            {Icons.drag}
          </div>
        </div>
      </div>
      
      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="flex items-center justify-center py-8">{Icons.loader}</div>
        ) : children}
      </div>
    </div>
  );
}

// Gráfico de Barras
function BarChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyState icon={Icons.chartBar} title="Sem dados" description="Nenhum dado disponível" />;
  }

  const maxValor = Math.max(...data.map(d => Math.max(d.atual, d.anterior)));
  
  return (
    <div className="h-48 sm:h-56 flex items-end gap-2 sm:gap-3">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex gap-1 items-end h-40 sm:h-48">
            <div 
              className="flex-1 bg-gray-200 rounded-t transition-all hover:bg-gray-300"
              style={{ height: `${(item.anterior / maxValor) * 100}%` }}
              title={`${item.mes} Anterior: ${formatMoney(item.anterior)}`}
            />
            <div 
              className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
              style={{ height: `${(item.atual / maxValor) * 100}%` }}
              title={`${item.mes} Atual: ${formatMoney(item.atual)}`}
            />
          </div>
          <span className="text-xs text-gray-500">{item.mes}</span>
        </div>
      ))}
    </div>
  );
}

// Gráfico Donut
function DonutChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyState icon={Icons.tag} title="Sem dados" description="Nenhuma categoria disponível" />;
  }

  const total = data.reduce((acc, d) => acc + d.valor, 0);
  let accumulatedPercent = 0;
  
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative w-36 h-36 sm:w-44 sm:h-44">
        <svg viewBox="0 0 100 100" className="transform -rotate-90">
          {data.map((item, i) => {
            const percent = (item.valor / total) * 100;
            const offset = accumulatedPercent;
            accumulatedPercent += percent;
            
            return (
              <circle
                key={i}
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={item.cor}
                strokeWidth="20"
                strokeDasharray={`${percent * 2.51} ${251 - percent * 2.51}`}
                strokeDashoffset={`${-offset * 2.51}`}
                className="transition-all hover:opacity-80 cursor-pointer"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg sm:text-xl font-bold text-gray-800">{formatMoney(total).replace('R$', '')}</span>
          <span className="text-xs text-gray-500">Total</span>
        </div>
      </div>
      
      <div className="flex flex-wrap sm:flex-col gap-2 justify-center">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.cor }} />
            <span className="text-gray-600">{item.nome}</span>
            <span className="text-gray-400 text-xs">({((item.valor / total) * 100).toFixed(0)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Pedidos Pendentes
function PedidosPendentes({ pedidos }) {
  if (!pedidos || pedidos.length === 0) {
    return <EmptyState icon={Icons.package} title="Nenhum pedido pendente" description="Todos os pedidos foram entregues" />;
  }

  const getStatusConfig = (status) => {
    switch (status) {
      case 'em_transito': return { label: 'Em Trânsito', bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'confirmado': return { label: 'Confirmado', bg: 'bg-green-100', text: 'text-green-700' };
      case 'aguardando': return { label: 'Aguardando', bg: 'bg-yellow-100', text: 'text-yellow-700' };
      default: return { label: status, bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  return (
    <div className="space-y-3">
      {pedidos.map((p) => {
        const status = getStatusConfig(p.status);
        return (
          <div key={p.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">{p.id}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>{status.label}</span>
              </div>
              <div className="text-xs text-gray-500">{p.fornecedor}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-800">{formatMoney(p.valor)}</div>
              <div className={`text-xs ${p.diasRestantes <= 2 ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                {p.diasRestantes === 0 ? 'Hoje' : p.diasRestantes === 1 ? 'Amanhã' : `${p.diasRestantes} dias`}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Cotações Abertas
function CotacoesAbertas({ cotacoes }) {
  if (!cotacoes || cotacoes.length === 0) {
    return <EmptyState icon={Icons.documentText} title="Nenhuma cotação aberta" description="Todas as cotações foram finalizadas" />;
  }

  return (
    <div className="space-y-3">
      {cotacoes.map((c) => (
        <div key={c.id} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{c.produto}</div>
            <div className="text-xs text-gray-500">{c.qtd} un • {c.fornecedores} fornecedores</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-800">{formatMoney(c.melhorPreco)}/un</div>
            <div className="text-xs text-green-600 font-medium">-{c.economia}%</div>
          </div>
          <button className="text-xs px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
            Analisar
          </button>
        </div>
      ))}
    </div>
  );
}

// Top Fornecedores
function FornecedoresTop({ fornecedores }) {
  if (!fornecedores || fornecedores.length === 0) {
    return <EmptyState icon={Icons.userGroup} title="Sem fornecedores" description="Nenhum fornecedor encontrado" />;
  }

  return (
    <div className="space-y-3">
      {fornecedores.map((f, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
            i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-blue-400' : i === 2 ? 'bg-blue-300' : 'bg-gray-300'
          }`}>
            {f.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{f.nome}</div>
            <div className="text-xs text-gray-500">{f.pedidos} pedidos • {f.pontualidade}% pontual</div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-700">{formatMoney(f.compras)}</div>
            <div className="flex items-center gap-0.5 text-yellow-500 text-xs">
              {'★'.repeat(Math.floor(f.avaliacao))}
              <span className="text-gray-400 ml-1">{f.avaliacao}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Alertas de Prazo
function PrazosAlerta({ alertas }) {
  if (!alertas || alertas.length === 0) {
    return <EmptyState icon={Icons.clock} title="Sem alertas" description="Todos os prazos estão em dia" />;
  }

  const getRiscoConfig = (risco) => {
    switch (risco) {
      case 'critico': return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
      case 'alto': return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
      case 'medio': return { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
    }
  };

  return (
    <div className="space-y-3">
      {alertas.map((a, i) => {
        const risco = getRiscoConfig(a.risco);
        return (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${risco.border} ${risco.bg}`}>
            <span className={`text-xl ${risco.text}`}>⚠️</span>
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${risco.text}`}>{a.pedido}</div>
              <div className="text-xs text-gray-600">{a.fornecedor}</div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-bold ${risco.text}`}>
                {a.dias === 0 ? 'HOJE!' : a.dias < 0 ? `${Math.abs(a.dias)}d ATRASO` : `${a.dias} dias`}
              </div>
              <div className="text-xs text-gray-500">{a.prazo}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Insights Automáticos
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
    { tipo: 'ia', texto: 'Olá! Sou o assistente de Compras do TrailSystem. Posso ajudar com análises de fornecedores, cotações e otimização de compras. O que precisa?' }
  ]);
  
  const sugestoes = [
    'Qual fornecedor tem melhor preço?',
    'Pedidos atrasados esta semana?',
    'Como reduzir lead time?',
  ];
  
  const enviarPergunta = () => {
    if (!pergunta.trim()) return;
    setMensagens([...mensagens, { tipo: 'usuario', texto: pergunta }]);
    setPergunta('');
    setTimeout(() => {
      setMensagens(msgs => [...msgs, { 
        tipo: 'ia', 
        texto: 'Analisando dados de compras... Em produção, consultarei o banco de dados para fornecer insights precisos!' 
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-80">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {mensagens.map((msg, i) => (
          <div key={i} className={`flex ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
              msg.tipo === 'usuario' 
                ? 'bg-blue-500 text-white rounded-br-md' 
                : 'bg-gray-100 text-gray-700 rounded-bl-md'
            }`}>
              {msg.texto}
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {sugestoes.map((sug, i) => (
          <button
            key={i}
            onClick={() => setPergunta(sug)}
            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
          >
            {sug}
          </button>
        ))}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && enviarPergunta()}
          placeholder="Pergunte algo..."
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        <button
          onClick={enviarPergunta}
          disabled={!pergunta.trim()}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-xl transition-colors"
        >
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
          <WidgetCard key={i} titulo={tab.titulo} icon={tab.icon} actions={tab.actions}>
            {tab.content}
          </WidgetCard>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex border-b border-gray-100">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors relative
              ${activeTab === i ? 'text-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'}`}
          >
            <span className={activeTab === i ? 'text-blue-500' : 'text-gray-400'}>{tab.icon}</span>
            <span className="hidden sm:inline truncate">{tab.titulo}</span>
            <span className="sm:hidden text-xs">{tab.tituloShort || tab.titulo.split(' ')[0]}</span>
            {activeTab === i && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
          </button>
        ))}
      </div>
      
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-blue-500">{tabs[activeTab].icon}</span>
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
export default function DashboardCompras() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    periodo: 'Este Mês',
    fornecedor: 'Todos',
    categoria: 'Todas',
    filial: 'Matriz',
  });
  
  const { kpis, pedidosPendentes, cotacoesAbertas, fornecedoresTop, prazosAlerta, comprasMensais, categorias, insights } = mockData;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {Icons.menu}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
                  {Icons.shoppingBag}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Dashboard de Compras</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Atualizado há 5 minutos</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Atualizar" onClick={() => setLoading(true)}>
                {Icons.refresh}
              </button>
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                {Icons.settings}
                <span>Personalizar</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Filtros */}
      <div className="bg-white border-b border-gray-100 py-3 sticky top-16 z-30">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1 text-gray-400 pr-2 border-r border-gray-200">
              {Icons.filter}
              <span className="text-sm font-medium hidden sm:inline">Filtros:</span>
            </div>
            
            <FilterDropdown
              icon={Icons.calendar}
              label="Período"
              value={filtros.periodo}
              options={['Hoje', 'Esta Semana', 'Este Mês', 'Último Trimestre', 'Este Ano']}
              onChange={(v) => setFiltros({...filtros, periodo: v})}
            />
            
            <FilterDropdown
              icon={Icons.userGroup}
              label="Fornecedor"
              value={filtros.fornecedor}
              options={['Todos', 'Gypsum Brasil', 'Knauf do Brasil', 'Placo Saint-Gobain', 'Eternit SA']}
              onChange={(v) => setFiltros({...filtros, fornecedor: v})}
            />
            
            <FilterDropdown
              icon={Icons.tag}
              label="Categoria"
              value={filtros.categoria}
              options={['Todas', 'Chapas', 'Perfis', 'Massas', 'Parafusos', 'Ferramentas']}
              onChange={(v) => setFiltros({...filtros, categoria: v})}
            />
            
            <FilterDropdown
              icon={Icons.building}
              label="Filial"
              value={filtros.filial}
              options={['Todas', 'Matriz', 'Filial Londrina', 'Filial Cascavel']}
              onChange={(v) => setFiltros({...filtros, filial: v})}
            />
          </div>
        </div>
      </div>
      
      {/* Conteúdo Principal */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPIs */}
        <div className="mb-6">
          <ResponsiveTabsGrid 
            breakpoint={768}
            minWidth={200}
            tabs={[
              {
                titulo: 'Total Compras',
                tituloShort: 'Total',
                icon: Icons.dollarSign,
                content: <KPICardContent valor={kpis.totalCompras.valor} valorFormatado={formatMoney(kpis.totalCompras.valor)} anterior={kpis.totalCompras.anterior} meta={kpis.totalCompras.meta} tipo="money" loading={loading} />
              },
              {
                titulo: 'Economia',
                tituloShort: 'Econ.',
                icon: Icons.chartBar,
                content: <KPICardContent valor={kpis.economia.valor} valorFormatado={formatPercent(kpis.economia.valor)} anterior={kpis.economia.anterior} meta={kpis.economia.meta} tipo="percent" loading={loading} />
              },
              {
                titulo: 'Pedidos Pendentes',
                tituloShort: 'Pend.',
                icon: Icons.package,
                content: <KPICardContent valor={kpis.pedidosPendentes.valor} valorFormatado={formatNumber(kpis.pedidosPendentes.valor)} anterior={kpis.pedidosPendentes.anterior} meta={kpis.pedidosPendentes.meta} tipo="number" loading={loading} invertido={true} />
              },
              {
                titulo: 'Lead Time Médio',
                tituloShort: 'Lead',
                icon: Icons.clock,
                content: <KPICardContent valor={kpis.leadTimeMedio.valor} valorFormatado={`${kpis.leadTimeMedio.valor} dias`} anterior={kpis.leadTimeMedio.anterior} meta={kpis.leadTimeMedio.meta} tipo="number" loading={loading} invertido={true} />
              }
            ]}
          />
        </div>
        
        {/* Gráficos */}
        <div className="mb-6">
          <ResponsiveTabsGrid 
            breakpoint={1000}
            minWidth={320}
            tabs={[
              {
                titulo: 'Evolução de Compras',
                tituloShort: 'Evolução',
                icon: Icons.chartBar,
                content: (
                  <div>
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded" />
                        <span className="text-gray-600">Este ano</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-200 rounded" />
                        <span className="text-gray-600">Ano anterior</span>
                      </div>
                    </div>
                    <BarChart data={comprasMensais} />
                  </div>
                )
              },
              {
                titulo: 'Compras por Categoria',
                tituloShort: 'Categorias',
                icon: Icons.tag,
                content: <DonutChart data={categorias} />
              },
              {
                titulo: 'Alertas de Prazo',
                tituloShort: 'Alertas',
                icon: Icons.exclamation,
                content: <PrazosAlerta alertas={prazosAlerta} />
              }
            ]}
          />
        </div>
        
        {/* Listas */}
        <div className="mb-6">
          <ResponsiveTabsGrid 
            tabs={[
              {
                titulo: 'Pedidos Pendentes',
                tituloShort: 'Pedidos',
                icon: Icons.package,
                content: <PedidosPendentes pedidos={pedidosPendentes} />
              },
              {
                titulo: 'Cotações Abertas',
                tituloShort: 'Cotações',
                icon: Icons.documentText,
                content: <CotacoesAbertas cotacoes={cotacoesAbertas} />
              },
              {
                titulo: 'Top Fornecedores',
                tituloShort: 'Fornec.',
                icon: Icons.userGroup,
                content: <FornecedoresTop fornecedores={fornecedoresTop} />
              }
            ]}
          />
        </div>
        
        {/* IA e Insights */}
        <div className="mb-6">
          <ResponsiveTabsGrid 
            tabs={[
              {
                titulo: 'Assistente IA',
                tituloShort: 'IA',
                icon: Icons.sparkles,
                actions: <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Online</span>,
                content: <MentorIA />
              },
              {
                titulo: 'Insights Automáticos',
                tituloShort: 'Insights',
                icon: Icons.alert,
                content: <InsightsAutomaticos insights={insights} />
              }
            ]}
          />
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-4 mt-8">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <p>💡 <strong>Dica:</strong> Arraste os cards para reorganizar seu dashboard.</p>
            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
              {Icons.settings}
              <span>Personalizar Dashboard</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
