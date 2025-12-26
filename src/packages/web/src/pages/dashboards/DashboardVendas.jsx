import React, { useState, useRef, useEffect, useMemo } from 'react';

// ============================================
// DASHBOARD DE VENDAS - TRAILSYSTEM ERP
// ============================================
// Requisitos:
// - Widgets redimensionáveis (drag & drop)
// - Layout padrão por cargo
// - Salvamento por usuário
// - Responsivo (5" a 100"+)
// - Tema híbrido (cards neutros, indicadores coloridos)
// - IA integrada (Mentor + Insights)
// ============================================

// Ícones SVG
const Icons = {
  filter: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>,
  settings: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  drag: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" /></svg>,
  expand: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>,
  trendUp: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  trendDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>,
  sparkles: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  chat: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
  alert: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  calendar: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  user: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  building: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  tag: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  send: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  trophy: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>,
  target: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  handshake: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  shoppingCart: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  package: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  refresh: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>,
  menu: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>,
  mapPin: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  userGroup: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  dollarSign: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  receipt: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" /></svg>,
  percent: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  loader: <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>,
};

// Dados mockados
const mockData = {
  kpis: {
    faturamento: { valor: 847520.00, anterior: 723450.00, meta: 900000.00 },
    ticketMedio: { valor: 2847.50, anterior: 2650.00, meta: 3000.00 },
    qtdVendas: { valor: 298, anterior: 273, meta: 300 },
    conversao: { valor: 68.5, anterior: 62.3, meta: 75.0 },
  },
  vendedores: [
    { id: 1, nome: 'Carlos Silva', foto: null, vendas: 156780, meta: 150000, posicao: 1, variacao: 0 },
    { id: 2, nome: 'Maria Santos', foto: null, vendas: 142350, meta: 150000, posicao: 2, variacao: 1 },
    { id: 3, nome: 'João Oliveira', foto: null, vendas: 138900, meta: 150000, posicao: 3, variacao: -1 },
    { id: 4, nome: 'Ana Costa', foto: null, vendas: 125400, meta: 150000, posicao: 4, variacao: 2 },
    { id: 5, nome: 'Pedro Lima', foto: null, vendas: 118750, meta: 150000, posicao: 5, variacao: -2 },
  ],
  produtosTop: [
    { nome: 'Placa Drywall ST 12,5mm', vendas: 2450, valor: 98000 },
    { nome: 'Perfil Montante 70mm', vendas: 1820, valor: 54600 },
    { nome: 'Massa para Drywall 28kg', vendas: 1650, valor: 41250 },
    { nome: 'Parafuso Drywall 25mm', vendas: 3200, valor: 38400 },
    { nome: 'Fita Telada 50m', vendas: 980, valor: 29400 },
  ],
  produtosSemMovimentacao: [
    { nome: 'Perfil Canaleta 40mm', dias: 45, estoque: 120, valor: 3600 },
    { nome: 'Cantoneira Perfurada 25mm', dias: 38, estoque: 85, valor: 1275 },
    { nome: 'Rebite Pop 4mm', dias: 32, estoque: 500, valor: 750 },
    { nome: 'Fita Adesiva Alumínio', dias: 28, estoque: 45, valor: 675 },
  ],
  clientesInativos: [
    { nome: 'Construtora ABC', dias: 45, ultimaCompra: 12500 },
    { nome: 'Reforma Total', dias: 38, ultimaCompra: 8750 },
    { nome: 'BuildMaster Ltda', dias: 32, ultimaCompra: 15300 },
  ],
  vendasMensais: [
    { mes: 'Jan', atual: 650000, anterior: 580000 },
    { mes: 'Fev', atual: 720000, anterior: 610000 },
    { mes: 'Mar', atual: 680000, anterior: 640000 },
    { mes: 'Abr', atual: 790000, anterior: 700000 },
    { mes: 'Mai', atual: 820000, anterior: 730000 },
    { mes: 'Jun', atual: 847520, anterior: 723450 },
  ],
  categorias: [
    { nome: 'Drywall', valor: 320000, cor: '#ef4444' },
    { nome: 'Steel Frame', valor: 185000, cor: '#f97316' },
    { nome: 'Forros', valor: 142000, cor: '#eab308' },
    { nome: 'Acessórios', valor: 98000, cor: '#22c55e' },
    { nome: 'Ferramentas', valor: 72520, cor: '#3b82f6' },
    { nome: 'Outros', valor: 30000, cor: '#8b5cf6' },
  ],
  insights: [
    { tipo: 'alerta', cor: 'red', msg: 'Cliente "Construtora ABC" não compra há 45 dias - média era mensal' },
    { tipo: 'atencao', cor: 'yellow', msg: 'Meta do mês está 6% abaixo do esperado para este período' },
    { tipo: 'positivo', cor: 'green', msg: 'Vendas de Drywall cresceram 18% este mês' },
    { tipo: 'info', cor: 'blue', msg: '3 orçamentos pendentes há mais de 5 dias aguardando retorno' },
  ],
  principaisClientes: [
    { nome: 'Construtora Horizonte', cidade: 'Maringá/PR', vendas: 89500, pedidos: 12 },
    { nome: 'MegaObras Ltda', cidade: 'Londrina/PR', vendas: 67200, pedidos: 8 },
    { nome: 'Decor Plus', cidade: 'Curitiba/PR', vendas: 54800, pedidos: 15 },
    { nome: 'Steel House', cidade: 'Cascavel/PR', vendas: 48300, pedidos: 6 },
    { nome: 'Reforma Express', cidade: 'Maringá/PR', vendas: 41200, pedidos: 9 },
  ],
  vendasPorRegiao: [
    { estado: 'PR', nome: 'Paraná', vendas: 485000, percentual: 57.2 },
    { estado: 'SC', nome: 'Santa Catarina', vendas: 156000, percentual: 18.4 },
    { estado: 'SP', nome: 'São Paulo', vendas: 98500, percentual: 11.6 },
    { estado: 'RS', nome: 'Rio Grande do Sul', vendas: 67000, percentual: 7.9 },
    { estado: 'MS', nome: 'Mato Grosso do Sul', vendas: 41020, percentual: 4.9 },
  ],
  cidadesTop: [
    { cidade: 'Maringá', estado: 'PR', vendas: 245000 },
    { cidade: 'Londrina', estado: 'PR', vendas: 128000 },
    { cidade: 'Curitiba', estado: 'PR', vendas: 89000 },
    { cidade: 'Cascavel', estado: 'PR', vendas: 45000 },
    { cidade: 'Joinville', estado: 'SC', vendas: 38000 },
  ],
};

// Formatadores
const formatMoney = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatNumber = (value) => new Intl.NumberFormat('pt-BR').format(value);
const formatPercent = (value) => `${value.toFixed(1)}%`;

// Calcula variação percentual
const calcVariacao = (atual, anterior) => ((atual - anterior) / anterior * 100);

// ============================================
// COMPONENTES COMPARTILHADOS
// ============================================

// Loading Skeleton
function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
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
              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 ${opt === value ? 'text-red-600 font-medium' : 'text-gray-700'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Date Range Picker - Estilo Google Ads (Tema Vermelho TrailSystem)
function DateRangePicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hoverDate, setHoverDate] = useState(null);
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

  const generateMonths = () => {
    const months = [];
    const today = new Date();
    for (let i = -3; i <= 2; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() + i, 1);
      months.push(date);
    }
    return months;
  };

  const months = useMemo(() => generateMonths(), []);

  const generateDays = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const formatMonthYear = (date) => {
    const str = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const formatDateShort = (date) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR');
  };

  const isInRange = (date) => {
    if (!date || !startDate) return false;
    const end = endDate || hoverDate;
    if (!end) return false;
    const min = startDate < end ? startDate : end;
    const max = startDate < end ? end : startDate;
    return date >= min && date <= max;
  };

  const isStart = (date) => {
    if (!date || !startDate) return false;
    return date.toDateString() === startDate.toDateString();
  };

  const isEnd = (date) => {
    if (!date || !endDate) return false;
    return date.toDateString() === endDate.toDateString();
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const handleDateClick = (date) => {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
    }
  };

  const handleApply = () => {
    if (startDate && endDate) {
      onChange(`${formatDateShort(startDate)} - ${formatDateShort(endDate)}`);
      setOpen(false);
    } else if (startDate) {
      onChange(formatDateShort(startDate));
      setOpen(false);
    }
  };

  const handleQuickSelect = (option) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let start, end;

    switch (option) {
      case 'today':
        start = end = new Date(today);
        break;
      case 'yesterday':
        start = end = new Date(today.getTime() - 86400000);
        break;
      case 'last7':
        start = new Date(today.getTime() - 6 * 86400000);
        end = new Date(today);
        break;
      case 'last30':
        start = new Date(today.getTime() - 29 * 86400000);
        end = new Date(today);
        break;
      case 'thisWeek':
        const dayOfWeek = today.getDay();
        start = new Date(today.getTime() - dayOfWeek * 86400000);
        end = new Date(today);
        break;
      case 'lastWeek':
        const lastWeekEnd = new Date(today.getTime() - today.getDay() * 86400000 - 86400000);
        start = new Date(lastWeekEnd.getTime() - 6 * 86400000);
        end = lastWeekEnd;
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today);
        break;
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        end = new Date(today);
        break;
      default:
        return;
    }

    setStartDate(start);
    setEndDate(end);
  };

  const quickOptions = [
    { key: 'today', label: 'Hoje' },
    { key: 'yesterday', label: 'Ontem' },
    { key: 'last7', label: 'Últimos 7 dias' },
    { key: 'last30', label: 'Últimos 30 dias' },
    { key: 'thisWeek', label: 'Esta Semana' },
    { key: 'lastWeek', label: 'Semana Passada' },
    { key: 'thisMonth', label: 'Este Mês' },
    { key: 'lastMonth', label: 'Mês Passado' },
    { key: 'thisYear', label: 'Este Ano' },
  ];

  const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:border-gray-300 transition-colors"
      >
        <span className="text-gray-400">{Icons.calendar}</span>
        <span className="text-gray-600">Período:</span>
        <span className="font-medium text-gray-800">{value}</span>
        {Icons.chevronDown}
      </button>
      
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-[9999] flex flex-col overflow-hidden">
          {/* Conteúdo: Atalhos + Calendário */}
          <div className="flex">
            {/* Atalhos à esquerda */}
            <div className="w-40 border-r border-gray-100 py-2">
              {quickOptions.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleQuickSelect(opt.key)}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 hover:text-red-600 transition-colors text-gray-700"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            
            {/* Calendário à direita */}
            <div className="h-80 overflow-y-auto p-4" style={{ width: '280px' }}>
              {months.map((monthDate, idx) => (
                <div key={idx} className="mb-6">
                  <div className="text-sm font-semibold text-gray-800 mb-3">
                    {formatMonthYear(monthDate)}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {weekDays.map((day, i) => (
                      <div key={i} className="text-xs text-gray-400 text-center py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {generateDays(monthDate.getFullYear(), monthDate.getMonth()).map((date, i) => (
                      <div key={i} className="aspect-square">
                        {date && (
                          <button
                            onClick={() => handleDateClick(date)}
                            onMouseEnter={() => startDate && !endDate && setHoverDate(date)}
                            onMouseLeave={() => setHoverDate(null)}
                            className={`w-full h-full flex items-center justify-center text-sm rounded-full transition-all
                              ${isStart(date) || isEnd(date) 
                                ? 'bg-red-500 text-white font-medium' 
                                : isInRange(date) 
                                  ? 'bg-red-100 text-red-700' 
                                  : isToday(date)
                                    ? 'border-2 border-red-300 text-red-600 font-medium'
                                    : 'hover:bg-gray-100 text-gray-700'
                              }`}
                          >
                            {date.getDate()}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer full-width */}
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {startDate && (
                <span>
                  <span className="font-medium text-gray-800">{formatDateShort(startDate)}</span>
                  {endDate && (
                    <>
                      <span className="mx-2 text-gray-400">até</span>
                      <span className="font-medium text-gray-800">{formatDateShort(endDate)}</span>
                    </>
                  )}
                </span>
              )}
              {!startDate && <span className="text-gray-400">Selecione as datas</span>}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleApply}
                disabled={!startDate}
                className="px-4 py-1.5 text-sm bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg transition-colors font-medium"
              >
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// KPI Card Content (para uso em tabs e grids)
function KPICardContent({ valor, valorFormatado, anterior, meta, tipo = 'money', loading = false }) {
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
  const isPositivo = variacao >= 0;
  const atingiuMeta = meta && valor >= meta;
  
  return (
    <div>
      {/* Valor Principal */}
      <div className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
        {valorFormatado}
      </div>
      
      {/* Indicadores */}
      <div className="flex items-center gap-4 text-sm mb-4">
        {/* Variação */}
        <div className={`flex items-center gap-1.5 ${isPositivo ? 'text-green-600' : 'text-red-500'}`}>
          {isPositivo ? Icons.trendUp : Icons.trendDown}
          <span className="font-semibold">{isPositivo ? '+' : ''}{variacao.toFixed(1)}%</span>
        </div>
        
        {/* Valor anterior */}
        <span className="text-gray-500">
          vs {tipo === 'money' ? formatMoney(anterior) : tipo === 'percent' ? formatPercent(anterior) : formatNumber(anterior)}
        </span>
      </div>
      
      {/* Barra de progresso da meta */}
      {meta && (
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Meta: {tipo === 'money' ? formatMoney(meta) : tipo === 'percent' ? formatPercent(meta) : formatNumber(meta)}</span>
            <span className={atingiuMeta ? 'text-green-600 font-semibold' : 'text-gray-700 font-medium'}>{progresso.toFixed(0)}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${atingiuMeta ? 'bg-green-500' : progresso >= 80 ? 'bg-yellow-500' : 'bg-red-400'}`}
              style={{ width: `${Math.min(progresso, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Card Widget Base (com drag handle)
function WidgetCard({ titulo, icon, children, className = '', actions, loading = false }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group ${className}`}>
      {/* Header */}
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
      
      {/* Content */}
      <div className="p-4 sm:p-5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            {Icons.loader}
          </div>
        ) : children}
      </div>
    </div>
  );
}

// Gráfico de Barras Simples (SVG)
function BarChart({ data }) {
  if (!data || data.length === 0) {
    return <EmptyState icon={Icons.target} title="Sem dados" description="Nenhum dado disponível para o período" />;
  }

  const maxValor = Math.max(...data.map(d => Math.max(d.atual, d.anterior)));
  
  return (
    <div className="h-48 sm:h-56 flex items-end gap-2 sm:gap-3">
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex gap-1 items-end h-40 sm:h-48">
            {/* Barra anterior */}
            <div 
              className="flex-1 bg-gray-200 rounded-t transition-all hover:bg-gray-300"
              style={{ height: `${(item.anterior / maxValor) * 100}%` }}
              title={`${item.mes} Anterior: ${formatMoney(item.anterior)}`}
            />
            {/* Barra atual */}
            <div 
              className="flex-1 bg-red-500 rounded-t transition-all hover:bg-red-600"
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

// Gráfico de Pizza/Donut (SVG)
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
      
      {/* Legenda */}
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

// Ranking de Vendedores
function RankingVendedores({ vendedores }) {
  if (!vendedores || vendedores.length === 0) {
    return <EmptyState icon={Icons.trophy} title="Sem vendedores" description="Nenhum vendedor encontrado" />;
  }

  const getVariacaoIcon = (variacao) => {
    if (variacao > 0) return <span className="text-green-500">▲{variacao}</span>;
    if (variacao < 0) return <span className="text-red-500">▼{Math.abs(variacao)}</span>;
    return <span className="text-gray-400">-</span>;
  };
  
  const getMedalha = (posicao) => {
    if (posicao === 1) return '🥇';
    if (posicao === 2) return '🥈';
    if (posicao === 3) return '🥉';
    return `${posicao}º`;
  };
  
  return (
    <div className="space-y-3">
      {vendedores.map((v) => (
        <div key={v.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
          {/* Posição */}
          <div className="w-8 text-center font-bold text-lg">
            {getMedalha(v.posicao)}
          </div>
          
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-medium">
            {v.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-800 truncate">{v.nome}</div>
            <div className="text-sm text-gray-500">{formatMoney(v.vendas)}</div>
          </div>
          
          {/* Progresso */}
          <div className="hidden sm:block w-24">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${v.vendas >= v.meta ? 'bg-green-500' : 'bg-red-400'}`}
                style={{ width: `${Math.min((v.vendas / v.meta) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{((v.vendas / v.meta) * 100).toFixed(0)}% da meta</div>
          </div>
          
          {/* Variação */}
          <div className="text-sm font-medium w-8 text-right">
            {getVariacaoIcon(v.variacao)}
          </div>
        </div>
      ))}
    </div>
  );
}

// Card Mentor IA
function MentorIA() {
  const [pergunta, setPergunta] = useState('');
  const [mensagens, setMensagens] = useState([
    { tipo: 'ia', texto: 'Olá! Sou o Mentor IA do TrailSystem. Posso ajudar com análises de vendas, informações de clientes e insights do seu desempenho. O que gostaria de saber?' }
  ]);
  
  const sugestoes = [
    'Quais clientes não compram há 30 dias?',
    'Como está minha meta este mês?',
    'Qual meu produto mais vendido?',
  ];
  
  const enviarPergunta = () => {
    if (!pergunta.trim()) return;
    setMensagens([...mensagens, { tipo: 'usuario', texto: pergunta }]);
    setPergunta('');
    // Simular resposta da IA
    setTimeout(() => {
      setMensagens(msgs => [...msgs, { 
        tipo: 'ia', 
        texto: 'Analisando seus dados... Esta é uma demonstração. Em produção, consultarei o banco de dados em tempo real para trazer informações precisas!' 
      }]);
    }, 1000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarPergunta();
    }
  };
  
  return (
    <div className="flex flex-col h-80">
      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {mensagens.map((msg, i) => (
          <div key={i} className={`flex ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
              msg.tipo === 'usuario' 
                ? 'bg-red-500 text-white rounded-br-md' 
                : 'bg-gray-100 text-gray-700 rounded-bl-md'
            }`}>
              {msg.texto}
            </div>
          </div>
        ))}
      </div>
      
      {/* Sugestões */}
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
      
      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={pergunta}
          onChange={(e) => setPergunta(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pergunte algo..."
          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
        />
        <button
          onClick={enviarPergunta}
          disabled={!pergunta.trim()}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-xl transition-colors"
        >
          {Icons.send}
        </button>
      </div>
    </div>
  );
}

// Card Insights Automáticos
function InsightsAutomaticos({ insights }) {
  if (!insights || insights.length === 0) {
    return <EmptyState icon={Icons.sparkles} title="Sem insights" description="Nenhum insight disponível no momento" />;
  }

  const getIcone = (cor) => {
    const iconClass = "w-5 h-5";
    switch (cor) {
      case 'red': 
        return <svg className={iconClass} fill="#ef4444" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>;
      case 'yellow': 
        return <svg className={iconClass} fill="#eab308" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>;
      case 'green': 
        return <svg className={iconClass} fill="#22c55e" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>;
      case 'blue': 
        return <svg className={iconClass} fill="#3b82f6" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>;
      default: 
        return <svg className={iconClass} fill="#9ca3af" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>;
    }
  };
  
  return (
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <div 
          key={i} 
          className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0"
        >
          <span className="mt-0.5 flex-shrink-0">{getIcone(insight.cor)}</span>
          <p className="text-sm text-gray-700 flex-1">{insight.msg}</p>
        </div>
      ))}
    </div>
  );
}

// Top Produtos
function TopProdutos({ produtos }) {
  if (!produtos || produtos.length === 0) {
    return <EmptyState icon={Icons.shoppingCart} title="Sem produtos" description="Nenhum produto vendido no período" />;
  }

  return (
    <div className="space-y-3">
      {produtos.map((p, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
          <span className="text-sm font-bold text-red-500 w-5">{i + 1}.</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{p.nome}</div>
            <div className="text-xs text-gray-500">{formatNumber(p.vendas)} unidades</div>
          </div>
          <div className="text-sm font-medium text-gray-700">{formatMoney(p.valor)}</div>
        </div>
      ))}
    </div>
  );
}

// Produtos sem Movimentação
function ProdutosSemMovimentacao({ produtos }) {
  if (!produtos || produtos.length === 0) {
    return <EmptyState icon={Icons.package} title="Tudo movimentando!" description="Nenhum produto parado no estoque" />;
  }

  return (
    <div className="space-y-3">
      {produtos.map((p, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
          <span className="text-yellow-500 font-bold text-xl flex-shrink-0">!</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-800">
              <span className="font-medium">{p.nome}</span>
              <span className="text-yellow-600 font-medium ml-2">{p.dias} dias</span>
            </div>
            <div className="text-xs text-gray-500">Estoque: {p.estoque} un • {formatMoney(p.valor)} parado</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Principais Clientes
function PrincipaisClientes({ clientes }) {
  if (!clientes || clientes.length === 0) {
    return <EmptyState icon={Icons.userGroup} title="Sem clientes" description="Nenhum cliente encontrado" />;
  }

  return (
    <div className="space-y-3">
      {clientes.map((c, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
            i === 0 ? 'bg-red-500' : i === 1 ? 'bg-red-400' : i === 2 ? 'bg-red-300' : 'bg-gray-300'
          }`}>
            {c.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 truncate">{c.nome}</div>
            <div className="text-xs text-gray-500">{c.cidade} • {c.pedidos} pedidos</div>
          </div>
          <div className="text-sm font-semibold text-gray-700">{formatMoney(c.vendas)}</div>
        </div>
      ))}
    </div>
  );
}

// Mapa de Vendas por Região
function MapaVendas({ regioes, cidades }) {
  if (!regioes || regioes.length === 0) {
    return <EmptyState icon={Icons.mapPin} title="Sem dados regionais" description="Nenhuma venda por região disponível" />;
  }

  const maxVendas = Math.max(...regioes.map(r => r.vendas));
  
  return (
    <div className="space-y-4">
      {/* Mapa visual simplificado - Barras por estado */}
      <div className="space-y-3">
        {regioes.map((r, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600 font-bold text-xs flex-shrink-0">
              {r.estado}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{r.nome}</span>
                <span className="text-sm font-semibold text-gray-800">{formatMoney(r.vendas)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full transition-all"
                  style={{ width: `${(r.vendas / maxVendas) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500 w-12 text-right">{r.percentual}%</span>
          </div>
        ))}
      </div>
      
      {/* Top Cidades */}
      {cidades && cidades.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Top Cidades</div>
          <div className="flex flex-wrap gap-2">
            {cidades.slice(0, 5).map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-red-400' : 'bg-red-300'}`} />
                <span className="text-xs text-gray-700">{c.cidade}/{c.estado}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Clientes Inativos (Alerta)
function ClientesInativos({ clientes }) {
  if (!clientes || clientes.length === 0) {
    return <EmptyState icon={Icons.users} title="Todos ativos!" description="Nenhum cliente inativo no período" />;
  }

  return (
    <div className="space-y-3">
      {clientes.map((c, i) => (
        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
          <span className="text-red-500 font-bold text-xl flex-shrink-0">!</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-800">
              <span className="font-medium">{c.nome}</span>
              <span className="text-red-500 font-medium ml-2">{c.dias} dias</span>
            </div>
            <div className="text-xs text-gray-500">Última compra: {formatMoney(c.ultimaCompra)}</div>
          </div>
          <button className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
            Contatar
          </button>
        </div>
      ))}
    </div>
  );
}

// Responsive Tabs/Grid - Mostra grid em tela grande, tabs em tela pequena
function ResponsiveTabsGrid({ tabs, breakpoint = 900, minWidth = 280 }) {
  const [activeTab, setActiveTab] = useState(0);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const checkWidth = () => {
      setIsSmallScreen(window.innerWidth < breakpoint);
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, [breakpoint]);

  // Modo Grid (tela grande)
  if (!isSmallScreen) {
    return (
      <div 
        ref={containerRef}
        className="grid gap-4 sm:gap-6" 
        style={{ gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}px, 1fr))` }}
      >
        {tabs.map((tab, i) => (
          <WidgetCard key={i} titulo={tab.titulo} icon={tab.icon} actions={tab.actions}>
            {tab.content}
          </WidgetCard>
        ))}
      </div>
    );
  }

  // Modo Tabs (tela pequena)
  return (
    <div ref={containerRef} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b border-gray-100">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 text-sm font-medium transition-colors relative
              ${activeTab === i 
                ? 'text-red-600 bg-red-50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
          >
            <span className={activeTab === i ? 'text-red-500' : 'text-gray-400'}>{tab.icon}</span>
            <span className="hidden sm:inline truncate">{tab.titulo}</span>
            <span className="sm:hidden text-xs">{tab.tituloShort || tab.titulo.split(' ')[0]}</span>
            {activeTab === i && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
            )}
          </button>
        ))}
      </div>
      
      {/* Tab Header com título e actions */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-red-500">{tabs[activeTab].icon}</span>
          <h3 className="font-semibold text-gray-800">{tabs[activeTab].titulo}</h3>
        </div>
        {tabs[activeTab].actions}
      </div>
      
      {/* Tab Content */}
      <div className="p-4 sm:p-5">
        {tabs[activeTab].content}
      </div>
    </div>
  );
}

// ============================================
// DASHBOARD PRINCIPAL
// ============================================
export default function DashboardVendas() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState({
    periodo: 'Este Mês',
    vendedor: 'Todos',
    parceiro: 'Todos',
    filial: 'Matriz',
    categoria: 'Todas',
  });
  
  const { kpis, vendedores, produtosTop, produtosSemMovimentacao, clientesInativos, vendasMensais, categorias, insights, principaisClientes, vendasPorRegiao, cidadesTop } = mockData;
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo e Título */}
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {Icons.menu}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center">
                  {Icons.target}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-800">Dashboard de Vendas</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Atualizado há 5 minutos</p>
                </div>
              </div>
            </div>
            
            {/* Ações */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" 
                title="Atualizar"
                onClick={() => setLoading(true)}
              >
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
            
            <DateRangePicker
              value={filtros.periodo}
              onChange={(v) => setFiltros({...filtros, periodo: v})}
            />
            
            <FilterDropdown
              icon={Icons.user}
              label="Vendedor"
              value={filtros.vendedor}
              options={['Todos', 'Carlos Silva', 'Maria Santos', 'João Oliveira', 'Ana Costa', 'Pedro Lima']}
              onChange={(v) => setFiltros({...filtros, vendedor: v})}
            />
            
            <FilterDropdown
              icon={Icons.handshake}
              label="Parceiro"
              value={filtros.parceiro}
              options={['Todos', 'Arq. Marina Costa', 'Eng. Roberto Luz', 'Const. Horizonte', 'Decor Plus', 'MegaObras Ind.']}
              onChange={(v) => setFiltros({...filtros, parceiro: v})}
            />
            
            <FilterDropdown
              icon={Icons.building}
              label="Filial"
              value={filtros.filial}
              options={['Todas', 'Matriz', 'Filial Londrina', 'Filial Cascavel']}
              onChange={(v) => setFiltros({...filtros, filial: v})}
            />
            
            <FilterDropdown
              icon={Icons.tag}
              label="Categoria"
              value={filtros.categoria}
              options={['Todas', 'Drywall', 'Steel Frame', 'Forros', 'Acessórios', 'Ferramentas']}
              onChange={(v) => setFiltros({...filtros, categoria: v})}
            />
          </div>
        </div>
      </div>
      
      {/* Conteúdo Principal */}
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPIs - Responsivo: Grid ou Tabs */}
        <div className="mb-6">
          <ResponsiveTabsGrid 
            breakpoint={768}
            minWidth={200}
            tabs={[
              {
                titulo: 'Faturamento',
                tituloShort: 'Fatur.',
                icon: Icons.dollarSign,
                content: (
                  <KPICardContent
                    valor={kpis.faturamento.valor}
                    valorFormatado={formatMoney(kpis.faturamento.valor)}
                    anterior={kpis.faturamento.anterior}
                    meta={kpis.faturamento.meta}
                    tipo="money"
                    loading={loading}
                  />
                )
              },
              {
                titulo: 'Ticket Médio',
                tituloShort: 'Ticket',
                icon: Icons.receipt,
                content: (
                  <KPICardContent
                    valor={kpis.ticketMedio.valor}
                    valorFormatado={formatMoney(kpis.ticketMedio.valor)}
                    anterior={kpis.ticketMedio.anterior}
                    meta={kpis.ticketMedio.meta}
                    tipo="money"
                    loading={loading}
                  />
                )
              },
              {
                titulo: 'Qtd. Vendas',
                tituloShort: 'Qtd',
                icon: Icons.shoppingCart,
                content: (
                  <KPICardContent
                    valor={kpis.qtdVendas.valor}
                    valorFormatado={formatNumber(kpis.qtdVendas.valor)}
                    anterior={kpis.qtdVendas.anterior}
                    meta={kpis.qtdVendas.meta}
                    tipo="number"
                    loading={loading}
                  />
                )
              },
              {
                titulo: 'Taxa Conversão',
                tituloShort: 'Conv.',
                icon: Icons.percent,
                content: (
                  <KPICardContent
                    valor={kpis.conversao.valor}
                    valorFormatado={formatPercent(kpis.conversao.valor)}
                    anterior={kpis.conversao.anterior}
                    meta={kpis.conversao.meta}
                    tipo="percent"
                    loading={loading}
                  />
                )
              }
            ]}
          />
        </div>
        
        {/* Gráficos + Principais Clientes - Responsivo: Grid ou Tabs */}
        <div className="mb-6">
          <ResponsiveTabsGrid 
            breakpoint={1000}
            minWidth={320}
            tabs={[
              {
                titulo: 'Evolução de Vendas',
                tituloShort: 'Evolução',
                icon: Icons.target,
                content: (
                  <div>
                    <div className="flex items-center gap-4 mb-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded" />
                        <span className="text-gray-600">Este ano</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-200 rounded" />
                        <span className="text-gray-600">Ano anterior</span>
                      </div>
                    </div>
                    <BarChart data={vendasMensais} />
                  </div>
                )
              },
              {
                titulo: 'Vendas por Categoria',
                tituloShort: 'Categorias',
                icon: Icons.tag,
                content: <DonutChart data={categorias} />
              },
              {
                titulo: 'Principais Clientes',
                tituloShort: 'Clientes',
                icon: Icons.userGroup,
                content: <PrincipaisClientes clientes={principaisClientes} />
              }
            ]}
          />
        </div>
        
        {/* Rankings e Listas - Responsivo: Grid ou Tabs */}
        <div className="mb-6">
          <ResponsiveTabsGrid 
            tabs={[
              {
                titulo: 'Ranking Vendedores',
                tituloShort: 'Ranking',
                icon: Icons.trophy,
                content: <RankingVendedores vendedores={vendedores} />
              },
              {
                titulo: 'Top Produtos',
                tituloShort: 'Produtos',
                icon: Icons.shoppingCart,
                content: <TopProdutos produtos={produtosTop} />
              },
              {
                titulo: 'Produtos Parados',
                tituloShort: 'Parados',
                icon: Icons.package,
                content: <ProdutosSemMovimentacao produtos={produtosSemMovimentacao} />
              }
            ]}
          />
        </div>
        
        {/* Clientes Inativos + IA - Responsivo: Grid ou Tabs */}
        <div className="mb-6">
          <ResponsiveTabsGrid 
            tabs={[
              {
                titulo: 'Clientes Inativos',
                tituloShort: 'Inativos',
                icon: Icons.alert,
                content: <ClientesInativos clientes={clientesInativos} />
              },
              {
                titulo: 'Mentor IA',
                tituloShort: 'Mentor',
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
        
        {/* Mapa de Vendas por Região */}
        <div className="mb-6">
          <WidgetCard titulo="Vendas por Região" icon={Icons.mapPin}>
            <MapaVendas regioes={vendasPorRegiao} cidades={cidadesTop} />
          </WidgetCard>
        </div>
      </main>
      
      {/* Footer com dica de personalização */}
      <footer className="bg-white border-t border-gray-100 py-4 mt-8">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <p>💡 <strong>Dica:</strong> Arraste os cards para reorganizar seu dashboard. Suas preferências são salvas automaticamente.</p>
            <button className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium">
              {Icons.settings}
              <span>Personalizar Dashboard</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
