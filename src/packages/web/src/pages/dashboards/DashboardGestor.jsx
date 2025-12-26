import React, { useState, useRef, useEffect } from 'react';

// ============================================
// DASHBOARD DO GESTOR - TRAILSYSTEM ERP
// ============================================
// Perfil: Diretores, Proprietários, Gerentes
// Foco: Visão consolidada, KPIs estratégicos
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
  briefcase: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  dollarSign: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  chartPie: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
  chartBar: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  trophy: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  building: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  mapPin: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  shoppingCart: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  flag: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>,
  loader: <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>,
};

// Dados mockados para Gestor
const mockData = {
  kpis: {
    faturamento: { valor: 1847520.00, anterior: 1623450.00, meta: 2000000.00 },
    margem: { valor: 28.5, anterior: 26.2, meta: 30.0 },
    ebitda: { valor: 312450.00, anterior: 278900.00, meta: 350000.00 },
    crescimento: { valor: 13.8, anterior: 8.5, meta: 15.0 },
  },
  vendasVsMeta: [
    { mes: 'Jan', vendas: 280000, meta: 300000 },
    { mes: 'Fev', vendas: 320000, meta: 300000 },
    { mes: 'Mar', vendas: 295000, meta: 310000 },
    { mes: 'Abr', vendas: 345000, meta: 320000 },
    { mes: 'Mai', vendas: 360000, meta: 340000 },
    { mes: 'Jun', vendas: 247520, meta: 350000 },
  ],
  filiais: [
    { nome: 'Matriz Maringá', vendas: 956780, meta: 1000000, margem: 29.5, clientes: 245, crescimento: 15.2 },
    { nome: 'Filial Londrina', vendas: 523400, meta: 550000, margem: 27.8, clientes: 156, crescimento: 12.8 },
    { nome: 'Filial Cascavel', vendas: 367340, meta: 400000, margem: 26.2, clientes: 98, crescimento: 9.4 },
  ],
  topVendedores: [
    { nome: 'Carlos Silva', vendas: 256780, meta: 250000, posicao: 1 },
    { nome: 'Maria Santos', vendas: 198450, meta: 200000, posicao: 2 },
    { nome: 'João Oliveira', vendas: 187900, meta: 180000, posicao: 3 },
    { nome: 'Ana Costa', vendas: 165400, meta: 170000, posicao: 4 },
    { nome: 'Pedro Lima', vendas: 148750, meta: 150000, posicao: 5 },
  ],
  topProdutos: [
    { nome: 'Placa Drywall ST 12,5mm', vendas: 245000, margem: 32, ranking: 1 },
    { nome: 'Perfil Montante 70mm', vendas: 156780, margem: 28, ranking: 2 },
    { nome: 'Massa para Drywall 28kg', vendas: 98450, margem: 35, ranking: 3 },
    { nome: 'Parafuso Drywall 25mm', vendas: 87200, margem: 42, ranking: 4 },
    { nome: 'Fita Telada 50m', vendas: 65400, margem: 38, ranking: 5 },
  ],
  topClientes: [
    { nome: 'Construtora Horizonte', vendas: 289500, pedidos: 42, cidade: 'Maringá/PR' },
    { nome: 'MegaObras Ltda', vendas: 187200, pedidos: 28, cidade: 'Londrina/PR' },
    { nome: 'Steel House', vendas: 154800, pedidos: 36, cidade: 'Cascavel/PR' },
    { nome: 'Decor Plus', vendas: 128300, pedidos: 45, cidade: 'Curitiba/PR' },
    { nome: 'Reforma Express', vendas: 98200, pedidos: 22, cidade: 'Maringá/PR' },
  ],
  alertasGerenciais: [
    { tipo: 'critico', msg: 'Meta de junho 29% abaixo - ação imediata necessária', area: 'Comercial' },
    { tipo: 'atencao', msg: 'Margem da Filial Cascavel 3.3pp abaixo da média', area: 'Financeiro' },
    { tipo: 'info', msg: 'Estoque de Placas Drywall para 15 dias apenas', area: 'Estoque' },
    { tipo: 'positivo', msg: 'Crescimento de 15.2% na Matriz - acima da meta!', area: 'Comercial' },
  ],
  vendasPorRegiao: [
    { estado: 'PR', nome: 'Paraná', vendas: 1285000, percentual: 69.5 },
    { estado: 'SC', nome: 'Santa Catarina', vendas: 312000, percentual: 16.9 },
    { estado: 'SP', nome: 'São Paulo', vendas: 156500, percentual: 8.5 },
    { estado: 'RS', nome: 'Rio Grande do Sul', vendas: 94020, percentual: 5.1 },
  ],
  insights: [
    { tipo: 'alerta', cor: 'red', msg: 'Faturamento de Junho precisa de R$ 102.480 para atingir meta' },
    { tipo: 'atencao', cor: 'yellow', msg: 'Margem média caiu 1.5pp nas últimas 2 semanas' },
    { tipo: 'positivo', cor: 'green', msg: 'Top 5 vendedores representam 52% do faturamento' },
    { tipo: 'info', cor: 'blue', msg: 'Crescimento de 62% nos últimos 12 meses' },
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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setOpen(false);
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
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }} className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${opt === value ? 'text-violet-600 font-medium' : 'text-gray-700'}`}>{opt}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function KPICardContent({ valor, valorFormatado, anterior, meta, tipo = 'money', loading = false }) {
  if (loading) return <div><Skeleton className="h-10 w-32 mb-3" /><Skeleton className="h-4 w-24" /></div>;

  const variacao = calcVariacao(valor, anterior);
  const progresso = meta ? (valor / meta * 100) : null;
  const isPositivo = variacao >= 0;
  const atingiuMeta = meta && valor >= meta;
  
  return (
    <div>
      <div className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">{valorFormatado}</div>
      <div className="flex items-center gap-4 text-sm mb-4">
        <div className={`flex items-center gap-1.5 ${isPositivo ? 'text-green-600' : 'text-red-500'}`}>
          {isPositivo ? Icons.trendUp : Icons.trendDown}
          <span className="font-semibold">{isPositivo ? '+' : ''}{variacao.toFixed(1)}%</span>
        </div>
        <span className="text-gray-500">vs {tipo === 'money' ? formatMoney(anterior) : tipo === 'percent' ? formatPercent(anterior) : formatNumber(anterior)}</span>
      </div>
      {meta && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Meta: {tipo === 'money' ? formatMoney(meta) : formatPercent(meta)}</span>
            <span className={atingiuMeta ? 'text-green-600 font-semibold' : 'text-gray-700 font-medium'}>{progresso.toFixed(0)}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${atingiuMeta ? 'bg-green-500' : progresso >= 80 ? 'bg-yellow-500' : 'bg-violet-400'}`} style={{ width: `${Math.min(progresso, 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function WidgetCard({ titulo, icon, children, className = '', actions }) {
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
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

// Vendas vs Meta
function VendasVsMeta({ dados }) {
  if (!dados || dados.length === 0) return <EmptyState icon={Icons.chartBar} title="Sem dados" />;
  const maxValor = Math.max(...dados.map(d => Math.max(d.vendas, d.meta)));
  
  return (
    <div className="h-48 sm:h-56 flex items-end gap-2 sm:gap-3">
      {dados.map((item, i) => {
        const atingiu = item.vendas >= item.meta;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex gap-1 items-end h-40 sm:h-48">
              <div className="flex-1 bg-gray-200 rounded-t" style={{ height: `${(item.meta / maxValor) * 100}%` }} title={`Meta: ${formatMoney(item.meta)}`} />
              <div className={`flex-1 ${atingiu ? 'bg-green-500' : 'bg-violet-500'} rounded-t`} style={{ height: `${(item.vendas / maxValor) * 100}%` }} title={`Vendas: ${formatMoney(item.vendas)}`} />
            </div>
            <span className="text-xs text-gray-500">{item.mes}</span>
          </div>
        );
      })}
    </div>
  );
}

// Comparativo Filiais
function ComparativoFiliais({ filiais }) {
  if (!filiais || filiais.length === 0) return <EmptyState icon={Icons.building} title="Sem filiais" />;
  
  return (
    <div className="space-y-4">
      {filiais.map((f, i) => {
        const progresso = (f.vendas / f.meta) * 100;
        const atingiu = progresso >= 100;
        return (
          <div key={i} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-800">{f.nome}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${atingiu ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {progresso.toFixed(0)}%
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-xs text-gray-500">Vendas</div>
                <div className="text-sm font-medium text-gray-800">{formatMoney(f.vendas).replace('R$', '')}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Margem</div>
                <div className="text-sm font-medium text-gray-800">{f.margem}%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Clientes</div>
                <div className="text-sm font-medium text-gray-800">{f.clientes}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Cresc.</div>
                <div className={`text-sm font-medium ${f.crescimento >= 10 ? 'text-green-600' : 'text-gray-800'}`}>+{f.crescimento}%</div>
              </div>
            </div>
            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${atingiu ? 'bg-green-500' : 'bg-violet-500'}`} style={{ width: `${Math.min(progresso, 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Top Vendedores (Mini)
function TopVendedoresMini({ vendedores }) {
  if (!vendedores || vendedores.length === 0) return <EmptyState icon={Icons.trophy} title="Sem dados" />;
  const getMedalha = (pos) => pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}º`;
  
  return (
    <div className="space-y-2">
      {vendedores.map((v) => (
        <div key={v.posicao} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
          <span className="w-6 text-center">{getMedalha(v.posicao)}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{v.nome}</div>
          </div>
          <div className="text-sm font-semibold text-gray-700">{formatMoney(v.vendas).replace('R$', 'R$ ')}</div>
        </div>
      ))}
    </div>
  );
}

// Top Produtos (Mini)
function TopProdutosMini({ produtos }) {
  if (!produtos || produtos.length === 0) return <EmptyState icon={Icons.shoppingCart} title="Sem dados" />;
  
  return (
    <div className="space-y-2">
      {produtos.map((p) => (
        <div key={p.ranking} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
          <span className="w-5 h-5 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center">{p.ranking}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{p.nome}</div>
            <div className="text-xs text-gray-500">Margem: {p.margem}%</div>
          </div>
          <div className="text-sm font-semibold text-gray-700">{formatMoney(p.vendas).replace('R$', '')}</div>
        </div>
      ))}
    </div>
  );
}

// Top Clientes (Mini)
function TopClientesMini({ clientes }) {
  if (!clientes || clientes.length === 0) return <EmptyState icon={Icons.users} title="Sem dados" />;
  
  return (
    <div className="space-y-2">
      {clientes.map((c, i) => (
        <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${i === 0 ? 'bg-violet-500' : i === 1 ? 'bg-violet-400' : 'bg-gray-300'}`}>
            {c.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{c.nome}</div>
            <div className="text-xs text-gray-500">{c.cidade} • {c.pedidos} pedidos</div>
          </div>
          <div className="text-sm font-semibold text-gray-700">{formatMoney(c.vendas).replace('R$', '')}</div>
        </div>
      ))}
    </div>
  );
}

// Alertas Gerenciais
function AlertasGerenciais({ alertas }) {
  if (!alertas || alertas.length === 0) return <EmptyState icon={Icons.flag} title="Sem alertas" />;
  
  const getConfig = (tipo) => {
    switch (tipo) {
      case 'critico': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🔴' };
      case 'atencao': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', icon: '🟡' };
      case 'positivo': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '🟢' };
      default: return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '🔵' };
    }
  };
  
  return (
    <div className="space-y-3">
      {alertas.map((a, i) => {
        const cfg = getConfig(a.tipo);
        return (
          <div key={i} className={`p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}>
            <div className="flex items-start gap-2">
              <span>{cfg.icon}</span>
              <div className="flex-1">
                <div className={`text-sm font-medium ${cfg.text}`}>{a.msg}</div>
                <div className="text-xs text-gray-500 mt-1">Área: {a.area}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Vendas por Região
function VendasPorRegiao({ regioes }) {
  if (!regioes || regioes.length === 0) return <EmptyState icon={Icons.mapPin} title="Sem dados" />;
  const maxVendas = Math.max(...regioes.map(r => r.vendas));
  
  return (
    <div className="space-y-3">
      {regioes.map((r, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center text-violet-600 font-bold text-xs">{r.estado}</div>
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">{r.nome}</span>
              <span className="text-sm font-semibold text-gray-800">{formatMoney(r.vendas)}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full" style={{ width: `${(r.vendas / maxVendas) * 100}%` }} />
            </div>
          </div>
          <span className="text-xs text-gray-500 w-10 text-right">{r.percentual}%</span>
        </div>
      ))}
    </div>
  );
}

// Insights
function InsightsAutomaticos({ insights }) {
  if (!insights || insights.length === 0) return <EmptyState icon={Icons.sparkles} title="Sem insights" />;
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
  const [mensagens, setMensagens] = useState([{ tipo: 'ia', texto: 'Olá! Sou o assistente executivo do TrailSystem. Posso fornecer análises estratégicas, comparativos e projeções. Como posso ajudar?' }]);
  const sugestoes = ['Como está a performance das filiais?', 'Qual a projeção de faturamento?', 'Quais áreas precisam de atenção?'];
  
  const enviarPergunta = () => {
    if (!pergunta.trim()) return;
    setMensagens([...mensagens, { tipo: 'usuario', texto: pergunta }]);
    setPergunta('');
    setTimeout(() => setMensagens(msgs => [...msgs, { tipo: 'ia', texto: 'Analisando dados executivos... Em produção, fornecerei insights estratégicos em tempo real!' }]), 1000);
  };

  return (
    <div className="flex flex-col h-80">
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {mensagens.map((msg, i) => (
          <div key={i} className={`flex ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${msg.tipo === 'usuario' ? 'bg-violet-500 text-white rounded-br-md' : 'bg-gray-100 text-gray-700 rounded-bl-md'}`}>{msg.texto}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {sugestoes.map((sug, i) => <button key={i} onClick={() => setPergunta(sug)} className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600">{sug}</button>)}
      </div>
      <div className="flex gap-2">
        <input type="text" value={pergunta} onChange={(e) => setPergunta(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviarPergunta()} placeholder="Pergunte algo..." className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100" />
        <button onClick={enviarPergunta} disabled={!pergunta.trim()} className="px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:bg-gray-300 text-white rounded-xl">{Icons.send}</button>
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
        {tabs.map((tab, i) => <WidgetCard key={i} titulo={tab.titulo} icon={tab.icon} actions={tab.actions}>{tab.content}</WidgetCard>)}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex border-b border-gray-100">
        {tabs.map((tab, i) => (
          <button key={i} onClick={() => setActiveTab(i)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors relative ${activeTab === i ? 'text-violet-600 bg-violet-50' : 'text-gray-600 hover:bg-gray-50'}`}>
            <span className={activeTab === i ? 'text-violet-500' : 'text-gray-400'}>{tab.icon}</span>
            <span className="hidden sm:inline truncate">{tab.titulo}</span>
            <span className="sm:hidden text-xs">{tab.tituloShort || tab.titulo.split(' ')[0]}</span>
            {activeTab === i && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500" />}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2"><span className="text-violet-500">{tabs[activeTab].icon}</span><h3 className="font-semibold text-gray-800">{tabs[activeTab].titulo}</h3></div>
        {tabs[activeTab].actions}
      </div>
      <div className="p-4 sm:p-5">{tabs[activeTab].content}</div>
    </div>
  );
}

// ============================================
// DASHBOARD PRINCIPAL
// ============================================
export default function DashboardGestor() {
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({ periodo: 'Este Mês', filial: 'Todas' });
  const { kpis, vendasVsMeta, filiais, topVendedores, topProdutos, topClientes, alertasGerenciais, vendasPorRegiao, insights } = mockData;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">{Icons.menu}</button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center">{Icons.briefcase}</div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Dashboard Executivo</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Visão Consolidada • Atualizado há 5 minutos</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" onClick={() => setLoading(true)}>{Icons.refresh}</button>
              <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700">{Icons.settings}<span>Personalizar</span></button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Filtros */}
      <div className="bg-white border-b border-gray-100 py-3 sticky top-16 z-30">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1 text-gray-400 pr-2 border-r border-gray-200">{Icons.filter}<span className="text-sm font-medium hidden sm:inline">Filtros:</span></div>
            <FilterDropdown icon={Icons.calendar} label="Período" value={filtros.periodo} options={['Hoje', 'Esta Semana', 'Este Mês', 'Este Trimestre', 'Este Ano']} onChange={(v) => setFiltros({...filtros, periodo: v})} />
            <FilterDropdown icon={Icons.building} label="Filial" value={filtros.filial} options={['Todas', 'Matriz Maringá', 'Filial Londrina', 'Filial Cascavel']} onChange={(v) => setFiltros({...filtros, filial: v})} />
          </div>
        </div>
      </div>
      
      {/* Conteúdo */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPIs */}
        <div className="mb-6">
          <ResponsiveTabsGrid breakpoint={768} minWidth={200} tabs={[
            { titulo: 'Faturamento', tituloShort: 'Fatur.', icon: Icons.dollarSign, content: <KPICardContent valor={kpis.faturamento.valor} valorFormatado={formatMoney(kpis.faturamento.valor)} anterior={kpis.faturamento.anterior} meta={kpis.faturamento.meta} tipo="money" loading={loading} /> },
            { titulo: 'Margem', tituloShort: 'Marg.', icon: Icons.chartPie, content: <KPICardContent valor={kpis.margem.valor} valorFormatado={formatPercent(kpis.margem.valor)} anterior={kpis.margem.anterior} meta={kpis.margem.meta} tipo="percent" loading={loading} /> },
            { titulo: 'EBITDA', tituloShort: 'EBITDA', icon: Icons.chartBar, content: <KPICardContent valor={kpis.ebitda.valor} valorFormatado={formatMoney(kpis.ebitda.valor)} anterior={kpis.ebitda.anterior} meta={kpis.ebitda.meta} tipo="money" loading={loading} /> },
            { titulo: 'Crescimento', tituloShort: 'Cresc.', icon: Icons.trendUp, content: <KPICardContent valor={kpis.crescimento.valor} valorFormatado={formatPercent(kpis.crescimento.valor)} anterior={kpis.crescimento.anterior} meta={kpis.crescimento.meta} tipo="percent" loading={loading} /> },
          ]} />
        </div>
        
        {/* Gráficos e Filiais */}
        <div className="mb-6">
          <ResponsiveTabsGrid breakpoint={1000} minWidth={320} tabs={[
            { titulo: 'Vendas vs Meta', tituloShort: 'VsxMeta', icon: Icons.chartBar, content: <><div className="flex gap-4 mb-4 text-sm"><div className="flex items-center gap-2"><div className="w-3 h-3 bg-violet-500 rounded" /><span className="text-gray-600">Vendas</span></div><div className="flex items-center gap-2"><div className="w-3 h-3 bg-gray-200 rounded" /><span className="text-gray-600">Meta</span></div></div><VendasVsMeta dados={vendasVsMeta} /></> },
            { titulo: 'Comparativo Filiais', tituloShort: 'Filiais', icon: Icons.building, content: <ComparativoFiliais filiais={filiais} /> },
            { titulo: 'Alertas Gerenciais', tituloShort: 'Alertas', icon: Icons.flag, content: <AlertasGerenciais alertas={alertasGerenciais} /> },
          ]} />
        </div>
        
        {/* Rankings */}
        <div className="mb-6">
          <ResponsiveTabsGrid tabs={[
            { titulo: 'Top Vendedores', tituloShort: 'Vended.', icon: Icons.trophy, content: <TopVendedoresMini vendedores={topVendedores} /> },
            { titulo: 'Top Produtos', tituloShort: 'Prods.', icon: Icons.shoppingCart, content: <TopProdutosMini produtos={topProdutos} /> },
            { titulo: 'Top Clientes', tituloShort: 'Clientes', icon: Icons.users, content: <TopClientesMini clientes={topClientes} /> },
          ]} />
        </div>
        
        {/* Mapa e IA */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WidgetCard titulo="Vendas por Região" icon={Icons.mapPin}><VendasPorRegiao regioes={vendasPorRegiao} /></WidgetCard>
          <WidgetCard titulo="Assistente Executivo" icon={Icons.sparkles} actions={<span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Online</span>}><MentorIA /></WidgetCard>
        </div>
        
        {/* Insights */}
        <div className="mb-6">
          <WidgetCard titulo="Insights Estratégicos" icon={Icons.alert}><InsightsAutomaticos insights={insights} /></WidgetCard>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-4 mt-8">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <p>💡 <strong>Dica:</strong> Arraste os cards para reorganizar seu dashboard.</p>
            <button className="flex items-center gap-2 text-violet-600 hover:text-violet-700 font-medium">{Icons.settings}<span>Personalizar Dashboard</span></button>
          </div>
        </div>
      </footer>
    </div>
  );
}
