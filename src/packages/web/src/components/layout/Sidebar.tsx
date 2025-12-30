// =============================================
// TRAILSYSTEM ERP - Sidebar com Módulo CADASTROS
// Aprovado: 15/12/2025 - 57 Especialistas DEV.com
// Ajustado: 16/12/2025 - Flyout alinhado com item selecionado
// Corrigido: 18/12/2025 - Fix hover do submenu (delay e ponte)
// =============================================

import React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';

// Estilo dos ícones - vermelho puro
const neonIconClass = "w-5 h-5 text-red-500";

// Ícones SVG inline
const Icons = {
  home: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  database: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>,
  users: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  shoppingCart: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  cube: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  document: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  cash: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  truck: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
  briefcase: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  userGroup: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  globe: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>,
  calculator: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  archive: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
  chart: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  support: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  cog: <svg className={neonIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  chevronDown: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  chevronRight: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
};

// Categorias do módulo Cadastros
const cadastroCategorias = [
  { id: 'entidades', label: 'Entidades', items: [
    { label: 'Clientes', path: '/cadastros/entidades/clientes' },
    { label: 'Fornecedores', path: '/cadastros/entidades/fornecedores' },
    { label: 'Transportadoras', path: '/cadastros/entidades/transportadoras' },
    { label: 'Colaboradores', path: '/cadastros/entidades/colaboradores' },
    { label: 'Parceiros de Negócio', path: '/cadastros/entidades/parceiros' },
  ]},
  { id: 'produtos', label: 'Produtos', items: [
    { label: 'Produtos e Serviços', path: '/cadastros/produtos/lista' },
  ]},
  { id: 'empresa', label: 'Empresa', items: [
    { label: 'Matriz & Filiais', path: '/cadastros/empresa/filiais' },
  ]},
  { id: 'financeiro', label: 'Financeiro', items: [
    { label: 'Contas Bancárias', path: '/cadastros/financeiro/contas-bancarias' },
    { label: 'Plano de Contas', path: '/cadastros/financeiro/plano-contas' },
    { label: 'Centros de Custo', path: '/cadastros/financeiro/centros-custo' },
    { label: 'Condições de Pagamento', path: '/cadastros/financeiro/condicoes-pagamento' },
  ]},
  { id: 'comercial', label: 'Comercial', items: [
    { label: 'Tabelas de Preço', path: '/cadastros/comercial/tabelas-preco' },
  ]},
  { id: 'patrimonio', label: 'Patrimônio', items: [
    { label: 'Veículos', path: '/cadastros/patrimonio/veiculos' },
    { label: 'Bens', path: '/cadastros/patrimonio/bens' },
  ]},
  { id: 'acessos', label: 'Acessos', items: [
    { label: 'Usuários', path: '/cadastros/acessos/usuarios' },
    { label: 'Perfis de Usuários', path: '/cadastros/acessos/perfis' },
  ]},
];

interface SubMenuItem { label: string; path: string; }
interface MenuItem { id: string; label: string; icon: React.ReactNode; path?: string; children?: SubMenuItem[]; }

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Icons.home, path: '/dashboard' },
  { id: 'comercial', label: 'Comercial', icon: Icons.shoppingCart, children: [
    { label: 'Orçamentos', path: '/comercial/orcamentos' },
    { label: 'Vendas', path: '/comercial/vendas' },
  ]},
  { id: 'estoque', label: 'Estoque', icon: Icons.cube, children: [
    { label: 'Saldos', path: '/estoque/saldos' },
    { label: 'Movimentações', path: '/estoque/movimentacoes' },
    { label: 'Transferências', path: '/estoque/transferencias' },
    { label: 'Inventário', path: '/estoque/inventario' },
  ]},
  { id: 'fiscal', label: 'Fiscal', icon: Icons.document, children: [
    { label: 'Notas Fiscais', path: '/fiscal/notas' },
    { label: 'Emitir NF-e', path: '/fiscal/nfe/nova' },
    { label: 'PDV (NFC-e)', path: '/fiscal/pdv' },
    { label: 'NFS-e (Serviços)', path: '/fiscal/nfse' },
    { label: 'CT-e / MDF-e', path: '/fiscal/cte' },
    { label: 'SPED', path: '/fiscal/sped' },
  ]},
  { id: 'financeiro', label: 'Financeiro', icon: Icons.cash, children: [
    { label: 'Contas a Receber', path: '/financeiro/receber' },
    { label: 'Contas a Pagar', path: '/financeiro/pagar' },
    { label: 'Fluxo de Caixa', path: '/financeiro/fluxo-caixa' },
    { label: 'Boletos', path: '/financeiro/boletos' },
    { label: 'Conciliação', path: '/financeiro/conciliacao' },
  ]},
  { id: 'compras', label: 'Compras', icon: Icons.briefcase, children: [
    { label: 'Cotações', path: '/compras/cotacoes' },
    { label: 'Pedidos de Compra', path: '/compras/pedidos' },
  ]},
  { id: 'logistica', label: 'Logística', icon: Icons.truck, children: [
    { label: 'Entregas', path: '/logistica/entregas' },
    { label: 'Rotas', path: '/logistica/rotas' },
    { label: 'Rastreamento', path: '/logistica/rastreamento' },
  ]},
  { id: 'crm', label: 'CRM', icon: Icons.userGroup, children: [
    { label: 'Dashboard CRM', path: '/crm' },
    { label: 'Pipeline', path: '/crm/pipeline' },
    { label: 'Leads', path: '/crm/leads' },
    { label: 'Oportunidades', path: '/crm/oportunidades' },
    { label: 'Atividades', path: '/crm/atividades' },
  ]},
  { id: 'ecommerce', label: 'E-commerce', icon: Icons.globe, children: [
    { label: 'Configurar Loja', path: '/ecommerce/config' },
    { label: 'Produtos da Loja', path: '/ecommerce/produtos' },
    { label: 'Pedidos Online', path: '/ecommerce/pedidos' },
    { label: 'Banners', path: '/ecommerce/banners' },
    { label: 'Cupons', path: '/ecommerce/cupons' },
  ]},
  { id: 'contabil', label: 'Contábil', icon: Icons.calculator, children: [
    { label: 'Lançamentos', path: '/contabil/lancamentos' },
    { label: 'Fechamento', path: '/contabil/fechamento' },
    { label: 'DRE', path: '/contabil/dre' },
    { label: 'Balanço', path: '/contabil/balanco' },
  ]},
  { id: 'rh', label: 'RH', icon: Icons.users, children: [
    { label: 'Folha de Pagamento', path: '/rh/folha' },
    { label: 'Ponto Eletrônico', path: '/rh/ponto' },
    { label: 'Férias', path: '/rh/ferias' },
  ]},
  { id: 'patrimonio', label: 'Patrimônio', icon: Icons.archive, children: [
    { label: 'Depreciação', path: '/patrimonio/depreciacao' },
    { label: 'Manutenção', path: '/patrimonio/manutencao' },
  ]},
  { id: 'bi', label: 'BI & Relatórios', icon: Icons.chart, children: [
    { label: 'Dashboards', path: '/bi/dashboards' },
    { label: 'Relatórios', path: '/bi/relatorios' },
    { label: 'Indicadores', path: '/bi/indicadores' },
  ]},
  // Suporte movido para o rodapé
  { id: 'configuracoes', label: 'Configurações', icon: Icons.cog, children: [
    { label: 'Geral', path: '/configuracoes/geral' },
    { label: 'Fiscal', path: '/configuracoes/fiscal' },
    { label: 'Impostos', path: '/configuracoes/impostos' },
    { label: 'Comercial', path: '/configuracoes/comercial' },
    { label: 'E-mail', path: '/configuracoes/email' },
    { label: 'Integrações', path: '/configuracoes/integracoes' },
  ]},
];

// =============================================
// FLYOUT PORTAL CORRIGIDO - Com ponte invisível
// =============================================
function FlyoutPortal({ 
  children, 
  targetRef, 
  isVisible, 
  onMouseEnter, 
  onMouseLeave 
}: { 
  children: React.ReactNode; 
  targetRef: React.RefObject<HTMLDivElement>; 
  isVisible: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const [position, setPosition] = useState({ top: 0, left: 0, height: 0 });

  useEffect(() => {
    if (targetRef.current && isVisible) {
      const rect = targetRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top - 4,
        left: rect.right,
        height: rect.height,
      });
    }
  }, [isVisible, targetRef]);

  if (!isVisible) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 99999,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* PONTE INVISÍVEL - Área que conecta o item ao flyout */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: -12,
          width: 12,
          height: Math.max(position.height + 8, 40),
          // background: 'rgba(255,0,0,0.1)', // Descomente para debug
        }}
      />
      
      {/* FLYOUT REAL */}
      <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#3a3a3c] rounded-lg shadow-xl py-1 min-w-48">
        {children}
      </div>
    </div>,
    document.body
  );
}

interface SidebarProps { isOpen: boolean; onClose: () => void; }

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const categoryRefs = useRef<{ [key: string]: React.RefObject<HTMLDivElement> }>({});
  
  // Timeout refs para controle de delay
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  cadastroCategorias.forEach(cat => {
    if (!categoryRefs.current[cat.id]) {
      categoryRefs.current[cat.id] = React.createRef<HTMLDivElement>();
    }
  });

  // Limpar timeouts ao desmontar
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  // HOVER no menu principal - abre imediatamente
  const handleMenuHover = (menuId: string) => {
    if (!expandedMenus.includes(menuId)) {
      setExpandedMenus(prev => [...prev, menuId]);
    }
  };

  // CLIQUE: Toggle - fecha se estiver aberto
  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  // =============================================
  // HOVER NA CATEGORIA - Com delay para abrir
  // =============================================
  const handleCategoryEnter = useCallback((categoryId: string) => {
    // Cancelar qualquer timeout de saída pendente
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    // Pequeno delay para evitar flickering ao passar rápido
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(categoryId);
    }, 50);
  }, []);

  // =============================================
  // SAIR DA CATEGORIA - Com delay maior para dar tempo de chegar no flyout
  // =============================================
  const handleCategoryLeave = useCallback(() => {
    // Cancelar timeout de entrada se houver
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Delay de 300ms para fechar - tempo suficiente para mover o mouse
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 300);
  }, []);

  // =============================================
  // ENTRAR NO FLYOUT - Cancela o fechamento
  // =============================================
  const handleFlyoutEnter = useCallback(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }, []);

  // =============================================
  // SAIR DO FLYOUT - Fecha imediatamente
  // =============================================
  const handleFlyoutLeave = useCallback(() => {
    setHoveredCategory(null);
  }, []);

  // Sair do sidebar - fecha todos os menus
  const handleSidebarLeave = () => {
    // Delay para não fechar enquanto navega entre itens
    setTimeout(() => {
      if (!hoveredCategory) {
        setExpandedMenus([]);
      }
    }, 200);
  };

  // Fechar tudo ao clicar em um item
  const handleItemClick = () => {
    setHoveredCategory(null);
    setExpandedMenus([]);
    onClose();
  };

  // =============================================
  // RENDERIZAR CATEGORIA COM FLYOUT CORRIGIDO
  // =============================================
  const renderCategoriaComFlyout = (categoria: typeof cadastroCategorias[0]) => {
    const isHovered = hoveredCategory === categoria.id;
    const ref = categoryRefs.current[categoria.id];

    return (
      <div
        key={categoria.id}
        ref={ref}
        onMouseEnter={() => handleCategoryEnter(categoria.id)}
        onMouseLeave={handleCategoryLeave}
        className="relative"
      >
        <div
          className={`flex items-center justify-between px-3 py-1.5 ml-3 rounded-lg text-sm cursor-pointer transition-colors ${
            isHovered 
              ? 'bg-gray-100 dark:bg-[#2c2c2e] text-gray-900 dark:text-white' 
              : 'text-gray-600 dark:text-[#8e8e93] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span>{categoria.label}</span>
          <span className="text-gray-400">{Icons.chevronRight}</span>
        </div>

        <FlyoutPortal 
          targetRef={ref} 
          isVisible={isHovered}
          onMouseEnter={handleFlyoutEnter}
          onMouseLeave={handleFlyoutLeave}
        >
          {categoria.items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleItemClick}
              className={({ isActive }) => `
                block px-4 py-2 text-sm transition-colors
                ${isActive 
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium' 
                  : 'text-gray-700 dark:text-[#e5e5e7] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'
                }
              `}
            >
              {item.label}
            </NavLink>
          ))}
        </FlyoutPortal>
      </div>
    );
  };

  // Renderizar menu Cadastros
  const renderCadastrosMenu = () => {
    const isExpanded = expandedMenus.includes('cadastros');

    return (
      <div onMouseEnter={() => handleMenuHover('cadastros')}>
        <button
          onClick={() => toggleMenu('cadastros')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 text-gray-700 dark:text-[#e5e5e7] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]"
        >
          <div className="flex items-center gap-3">
            {Icons.database}
            <span className="font-medium">Cadastros</span>
          </div>
          <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            {Icons.chevronDown}
          </span>
        </button>

        {isExpanded && (
          <div className="mt-1 space-y-0.5">
            {cadastroCategorias.map(renderCategoriaComFlyout)}
          </div>
        )}
      </div>
    );
  };

  // Renderizar menu padrão
  const renderMenuItem = (item: MenuItem) => {
    if (item.path) {
      return (
        <NavLink
          key={item.id}
          to={item.path}
          onClick={handleItemClick}
          className={({ isActive }) => `
            flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200
            ${isActive 
              ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
              : 'text-gray-700 dark:text-[#e5e5e7] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'
            }
          `}
        >
          {item.icon}
          <span className="font-medium">{item.label}</span>
        </NavLink>
      );
    }

    const isExpanded = expandedMenus.includes(item.id);

    return (
      <div key={item.id} onMouseEnter={() => handleMenuHover(item.id)}>
        <button
          onClick={() => toggleMenu(item.id)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all duration-200 text-gray-700 dark:text-[#e5e5e7] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]"
        >
          <div className="flex items-center gap-3">
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </div>
          <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
            {Icons.chevronDown}
          </span>
        </button>

        {isExpanded && item.children && (
          <div className="mt-1 ml-3 space-y-0.5">
            {item.children.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                onClick={handleItemClick}
                className={({ isActive }) => `
                  block px-3 py-1.5 rounded-lg text-sm transition-colors
                  ${isActive 
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium' 
                    : 'text-gray-500 dark:text-[#636366] hover:bg-gray-100 dark:hover:bg-[#2c2c2e] hover:text-gray-700 dark:hover:text-white'
                  }
                `}
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        onMouseLeave={handleSidebarLeave}
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-[#2c2c2e] transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-[#2c2c2e]">
          <NavLink to="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">TRAILSYSTEM</span>
          </NavLink>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {renderMenuItem(menuItems[0])}
          {renderCadastrosMenu()}
          {menuItems.slice(1).map(renderMenuItem)}
        </nav>

        {/* Footer - Suporte Fixo */}
        <div className="border-t border-gray-200 dark:border-[#2c2c2e] p-3">
          <FooterSuporteMenu onItemClick={handleItemClick} />
        </div>
      </aside>
    </>
  );
}

// =============================================
// COMPONENTE SUPORTE NO RODAPÉ COM FLYOUT
// =============================================
function FooterSuporteMenu({ onItemClick }: { onItemClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [flyoutPosition, setFlyoutPosition] = useState({ bottom: 0, left: 0 });
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const suporteItems = [
    { label: 'Tickets', path: '/suporte/tickets' },
    { label: 'Base de Conhecimento', path: '/suporte/base' },
  ];

  useEffect(() => {
    if (menuRef.current && isHovered) {
      const rect = menuRef.current.getBoundingClientRect();
      setFlyoutPosition({
        bottom: window.innerHeight - rect.top - rect.height,
        left: rect.right,
      });
    }
  }, [isHovered]);

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 300);
  };

  const handleFlyoutEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  };

  const handleFlyoutLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      ref={menuRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative"
    >
      <div
        className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
          isHovered
            ? 'bg-gray-100 dark:bg-[#2c2c2e] text-gray-900 dark:text-white'
            : 'text-gray-700 dark:text-[#e5e5e7] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'
        }`}
      >
        {Icons.support}
        <span className="font-medium">Suporte</span>
        <span className="ml-auto text-gray-400">{Icons.chevronRight}</span>
      </div>

      {/* Flyout do Suporte */}
      {isHovered && createPortal(
        <div
          style={{
            position: 'fixed',
            bottom: flyoutPosition.bottom,
            left: flyoutPosition.left,
            zIndex: 99999,
          }}
          onMouseEnter={handleFlyoutEnter}
          onMouseLeave={handleFlyoutLeave}
        >
          {/* Ponte invisível */}
          <div 
            style={{
              position: 'absolute',
              bottom: 0,
              left: -12,
              width: 12,
              height: 60,
            }}
          />
          
          {/* Menu flyout */}
          <div className="bg-white dark:bg-[#1c1c1e] border border-gray-200 dark:border-[#3a3a3c] rounded-lg shadow-xl py-1 min-w-48">
            {suporteItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => {
                  setIsHovered(false);
                  onItemClick();
                }}
                className={({ isActive }) => `
                  block px-4 py-2 text-sm transition-colors
                  ${isActive 
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium' 
                    : 'text-gray-700 dark:text-[#e5e5e7] hover:bg-gray-100 dark:hover:bg-[#2c2c2e]'
                  }
                `}
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default Sidebar;
